import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function setup(t) {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${base}/tools/link-extract`);
  await page.getByRole('textbox', { name: '输入内容', exact: true }).waitFor();
  return page;
}
async function settle(page) { await page.waitForTimeout(400); }
async function choose(page, label, option) { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('option', { name: option, exact: true }).click(); }
const output = page => page.getByLabel('可复制输出', { exact: true }).inputValue();

test('rich clipboard preserves hidden href, extracts all anchors without loading or executing markup', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const requests = []; page.on('request', request => requests.push(request.url()));
  await page.getByRole('textbox', { name: '输入内容', exact: true }).evaluate(el => {
    const data = new DataTransfer();
    data.setData('text/plain', '用户 小组');
    data.setData('text/html', '<table><tr><td><a href="https://example.com/users/1/?a=1&amp;b=2#x">用户</a></td><td><a href="/groups/2/">小组</a></td></tr></table><script>window.pasteExecuted=true</script><img src="https://should-not-load.invalid/image"><iframe src="https://should-not-load.invalid/frame"></iframe><a href="javascript:alert(1)">坏链接</a>');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await settle(page);
  assert.equal(await page.getByRole('button', {name:'保留表格布局',exact:true}).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', {name:'链接列表',exact:true}).click(); await settle(page);
  assert.equal(await output(page), 'https://example.com/users/1/?a=1&b=2#x\n/groups/2/');
  assert.equal(await page.evaluate(() => window.pasteExecuted), undefined);
  assert.equal(requests.filter(url => !url.includes('localhost') && !url.includes('127.0.0.1')).length, 0);
  await page.getByLabel('基础网址', { exact: false }).fill('https://example.com/'); await settle(page);
  assert.match(await output(page), /https:\/\/example.com\/groups\/2\//);
  await page.getByRole('button', { name: '复制当前结果' }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await output(page));
  await page.getByRole('textbox', { name: '输入内容', exact: true }).fill('<p>https://example.com/text</p><img src="https://should-not-load.invalid/only-image"><script>const url="https://example.com/script"</script>');
  await settle(page);
  assert.equal(await output(page), 'https://example.com/text');
  assert.equal(requests.filter(url => url.includes('should-not-load.invalid')).length, 0);
});

test('legacy table first/last/all, fallback, cleanup and ID-only exports', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.getByRole('button', { name: '填入示例' }).click(); await settle(page);
  assert.equal((await output(page)).split('\n').length, 3);
  await page.getByRole('button', { name: '每行取最后一个（原版预设）' }).click(); await settle(page);
  assert.equal(await output(page), '/groups/456/\nhttps://example.com/articles/2\n没有超链接的行内文字');
  await choose(page, '表格提取方式', '每行第一个'); await settle(page);
  assert.match(await output(page), /^https:\/\/example.com\/users\/123\/\?from=list#info/);
  await page.locator('summary').click();
  for (const label of ['去掉路径末尾斜线', '移除查询参数（? 后）', '移除锚点（# 后）']) await page.getByLabel(label, { exact: true }).check();
  await settle(page); assert.match(await output(page), /^https:\/\/example.com\/users\/123\n/);
  await page.getByLabel('链接', { exact: true }).uncheck();
  await page.getByLabel('路径末段（原 ID）', { exact: true }).check();
  assert.match(await output(page), /^123\n2\n/);
  await page.getByLabel('路径末段（原 ID）', { exact: true }).uncheck();
  assert(await page.getByRole('button', { name: '复制当前结果' }).isDisabled());
  assert(await page.getByRole('main').getByRole('alert').isVisible());
});

test('markdown filtering, pagination, CSV download, error recovery and mobile layout', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.getByRole('textbox', { name: '输入内容', exact: true }).fill(Array.from({length: 105}, (_, i) => `[条目 ${i}](https://example.com/${i})`).join('\n'));
  await settle(page);
  assert.equal(await page.getByRole('region', { name: '链接明细' }).locator('li').count(), 100);
  assert.equal((await output(page)).split('\n').length, 105);
  await page.getByRole('button', { name: '下一页' }).click();
  assert.equal(await page.getByRole('region', { name: '链接明细' }).locator('li').count(), 5);
  await page.getByLabel('搜索结果', { exact: true }).fill('条目 104');
  assert.equal(await output(page), 'https://example.com/104');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出 CSV' }).click();
  const file = await download; assert.equal(file.suggestedFilename(), 'extracted-links.csv');
  const stream = await file.createReadStream(); let csv = ''; for await (const chunk of stream) csv += chunk.toString();
  assert.match(csv, /条目 104/); assert(!csv.includes('条目 103'));
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByLabel('基础网址', { exact: false }).fill('invalid'); await settle(page);
  assert(await page.getByRole('main').getByRole('alert').isVisible()); assert.equal(await output(page), '');
  await page.getByLabel('基础网址', { exact: false }).fill(''); await settle(page);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.getByRole('button', { name: '复制当前结果' }).click(); await page.getByText('复制失败，请在输出框中选中文本手动复制。').waitFor();
  await page.getByRole('button', { name: '清空内容' }).click(); await settle(page);
  assert.equal(await output(page), ''); assert(await page.getByRole('button', { name: '复制当前结果' }).isDisabled());
});
