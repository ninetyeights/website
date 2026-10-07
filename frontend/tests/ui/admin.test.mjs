import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('admin login loads local assets and submits through Livewire', { timeout: 60000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('/api/security/csp-report')) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() => {
    window.policyViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.policyViolations.push({uri:event.blockedURI, disposition:event.disposition}));
  });
  const response = await page.goto(`${base}/admin`);
  assert.equal(response.status(), 200);
  assert.equal(new URL(page.url()).pathname, '/admin/login');
  assert.match(response.headers()['x-robots-tag'], /noindex/);
  assert.match(response.headers()['content-security-policy-report-only'], /script-src 'self';/);
  await page.locator('input[type="email"]').fill('unknown-admin@example.invalid');
  await page.locator('input[type="password"]').fill('InvalidPassword123456');
  const update = page.waitForResponse(response => /livewire.*\/update/.test(response.url()));
  await page.getByRole('button', { name: '登录', exact: true }).click();
  assert.equal((await update).status(), 200);
  await page.getByText('登录信息有误。', { exact: true }).waitFor();
  assert.deepEqual(failures, []);
  assert.deepEqual(await page.evaluate(() => window.policyViolations.filter(event => event.disposition === 'enforce')), []);
  assert(await page.evaluate(() => window.policyViolations.some(event => event.disposition === 'report')));
  const publicPage = await page.request.get(base);
  assert(!publicPage.headers()['content-security-policy'].includes('unsafe-eval'));
});
