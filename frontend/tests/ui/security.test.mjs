import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('security headers cover pages, errors and API; CSP preserves hydration and blocks foreign scripts', {timeout:60000}, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://docs.google.com/forms/**', route => route.fulfill({contentType:'text/html', body:'<!doctype html><p>Google Forms embed test</p>'}));
  await page.addInitScript(() => {
    window.policyViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.policyViolations.push({directive:event.effectiveDirective, uri:event.blockedURI, disposition:event.disposition}));
  });
  for (const path of ['/', '/projects', '/tools', '/tools/text-compare', '/tools/translate', '/feedback', '/privacy', '/missing-security-test']) {
    const response = await page.goto(base + path);
    const headers = response.headers();
    assert.equal(headers['x-frame-options'], 'DENY');
    assert.equal(headers['x-content-type-options'], 'nosniff');
    assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.match(headers['permissions-policy'], /microphone=\(\)/);
    assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
    assert.match(headers['content-security-policy-report-only'], /report-uri \/api\/security\/csp-report/);
    assert(!headers['content-security-policy-report-only'].includes('unsafe-eval'));
    assert(!headers['content-security-policy-report-only'].split('script-src ')[1].split(';')[0].includes('unsafe-inline'));
    assert.equal(headers['x-powered-by'], undefined);
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => window.policyViolations.filter(event => event.disposition === 'enforce')), []);
    assert(await page.evaluate(() => window.policyViolations.some(event => event.disposition === 'report' && event.directive.startsWith('script-src'))));
    if (path === '/feedback') assert(await page.frameLocator('iframe').getByText('Google Forms embed test').isVisible());
  }
  const response = await page.request.post(base + '/api/tools/translate', {data:{text:'',provider:'azure'}});
  assert.equal(response.status(), 422);
  assert.equal(response.headers()['x-content-type-options'], 'nosniff');
  assert.match((await response.json()).errors.text[0], /请输入/);
  await page.goto(base + '/tools');
  await page.getByLabel('搜索工具', {exact:true}).fill('时间戳');
  await page.getByRole('link', {name:/时间戳转换/}).waitFor();
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.reportOnlyProbe = true';
    document.head.appendChild(script);
  });
  assert.equal(await page.evaluate(() => window.reportOnlyProbe), true);
  await page.evaluate(() => {
    const script = document.createElement('script'); script.src = 'https://example.invalid/untrusted.js'; document.head.appendChild(script);
  });
  await page.waitForFunction(() => window.policyViolations.some(event => event.uri === 'https://example.invalid/untrusted.js'));
  assert(await page.evaluate(() => window.policyViolations.some(event => event.directive.startsWith('script-src'))));
});
