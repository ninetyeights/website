import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('privacy page is linked globally, works on mobile, and tool analytics exclude input and output', {timeout:60000}, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/analytics/config', route => route.fulfill({json: {measurementId:'G-TEST123', domains:[new URL(base).hostname]}}));
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({contentType:'application/javascript', body:''}));
  await page.goto(`${base}/tools/link-extract`);
  await page.waitForFunction(() => typeof window.gtag === 'function');
  await page.locator('#link-input').fill('https://example.test/PRIVATE_TOOL_INPUT_123');
  await page.waitForFunction(() => window.dataLayer.some(event => event[0] === 'event' && event[1] === 'tool_success'));
  const events = await page.evaluate(() => window.dataLayer.filter(event => event[0] === 'event'));
  assert(events.every(event => event[1] === 'tool_success' && JSON.stringify(event[2]) === JSON.stringify({tool_name:'link-extract'})));
  assert(!JSON.stringify(events).includes('PRIVATE_TOOL_INPUT_123'));
  await page.getByRole('contentinfo').getByRole('link', {name:'隐私说明', exact:true}).click();
  await page.getByRole('heading', {name:'隐私说明', exact:true}).waitFor();
  for (const name of ['访问与操作统计', '文本翻译', '反馈表单', '在浏览器本地处理的工具']) {
    assert(await page.getByRole('heading', {name, exact:true}).isVisible());
  }
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://ninetyeights.com/privacy');
  assert.deepEqual(errors, []);
});
