import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const marker = 'window.__xssProbe=1';

async function setup(t) {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addInitScript(() => { window.__xssProbe = 0; });
  return page;
}

test('pasted HTML remains inert and dangerous links never reach the output', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const externalRequests = [];
  page.on('request', request => {
    if (request.url().includes('xss-probe.invalid')) externalRequests.push(request.url());
  });
  await page.goto(`${base}/tools/link-extract`);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__inlineControl=true';
    document.head.appendChild(script);
  });
  assert.equal(await page.evaluate(() => window.__inlineControl), true, 'current CSP permits inline scripts: the probe is not masked by CSP');
  const payload = `<table><tr><td><a href="https://example.com/safe">safe</a></td><td>
    <a href="javascript:${marker}">bad</a><a href="java&#x73;cript:${marker}">bad</a>
    <a href="data:text/html,<script>${marker}</script>">bad</a>
    <img id="xss-injected" src="https://xss-probe.invalid/image" onerror="${marker}">
    <svg onload="${marker}"></svg><script>${marker}</script>
    <iframe srcdoc="<script>${marker}</script>"></iframe>
    </td></tr></table>`;
  await page.locator('#link-input').evaluate((el, html) => {
    const data = new DataTransfer();
    data.setData('text/html', html);
    data.setData('text/plain', 'safe');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  }, payload);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__xssProbe), 0);
  assert.equal(await page.locator('#xss-injected').count(), 0);
  assert.deepEqual(externalRequests, []);
  assert.match(await page.locator('#table-output').inputValue(), /https:\/\/example.com\/safe/);
  assert(!/javascript:|data:text\/html/i.test(await page.locator('#table-output').inputValue()));
  await page.getByRole('button', { name: '链接列表', exact: true }).click();
  await page.waitForTimeout(500);
  assert.equal(await page.getByLabel('可复制输出', { exact: true }).inputValue(), 'https://example.com/safe');
  assert.equal(await page.evaluate(() => window.__xssProbe), 0);
});

test('translation upstream HTML is displayed as text, not executable markup', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const payload = `<img id="xss-injected" src="x" onerror="${marker}"><svg onload="${marker}"></svg><script>${marker}</script>`;
  await page.route('https://translate.googleapis.com/**', route => route.fulfill({ json: [[[payload, 'hello']], null, 'en'] }));
  await page.goto(`${base}/tools/translate`);
  await page.locator('#translation-source').fill('hello');
  await page.getByRole('button', { name: '翻译', exact: true }).click();
  await page.locator('.translation-result').waitFor();
  assert.equal(await page.locator('.translation-result').textContent(), payload);
  assert.equal(await page.locator('#xss-injected').count(), 0);
  assert.equal(await page.evaluate(() => window.__xssProbe), 0);
});

test('HTML-like query and route values are not reflected as executable elements', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const payload = `<svg id="xss-injected" onload="${marker}"></svg>`;
  for (const path of [`/?q=${encodeURIComponent(payload)}`, `/projects/${encodeURIComponent(payload)}`, `/admin/login?email=${encodeURIComponent(payload)}`]) {
    await page.goto(base + path);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#xss-injected').count(), 0);
    assert.equal(await page.evaluate(() => window.__xssProbe), 0);
  }
});
