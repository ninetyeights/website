import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function setup(t, viewport = { width: 1440, height: 1000 }) {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const context = await browser.newContext({ viewport, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${base}/tools/text-compare`);
  return page;
}
async function compare(page, left, right, mode) {
  await page.getByLabel('原始文本', { exact: true }).fill(left);
  await page.getByLabel('对比文本', { exact: true }).fill(right);
  if (mode) {
    await page.getByRole('combobox', { name: '对比粒度' }).click();
    await page.getByRole('option', { name: { auto: '自动', character: '字符', word: '单词', line: '行' }[mode], exact: true }).click();
  }
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await page.getByRole('region', { name: '对比结果', exact: true }).waitFor();
}

test('directory, worker comparison, original rendering, view switch and clipboard', { timeout: 90000 }, async t => {
  const page = await setup(t);
  await page.goto(`${base}/tools`);
  await page.getByRole('link').filter({ hasText: '文字对比' }).click();
  const network = [];
  page.on('request', req => { if (['fetch', 'xhr'].includes(req.resourceType())) network.push({url:req.url(), method:req.method(), body:req.postData(), rsc:req.headers().rsc}); });
  const left = '今天下午去超市。\n然后回家。', right = '今天晚上去超市。\n然后回家吃饭。';
  await compare(page, left, right);
  assert.equal(await page.locator('[data-panel="left"] del').first().textContent(), '下午');
  assert.equal(await page.locator('[data-panel="right"] ins').first().textContent(), '晚上');
  for (const request of network) {
    const url = new URL(request.url);
    assert.equal(url.origin, new URL(base).origin);
    assert.equal(request.method, 'GET');
    assert.equal(request.body, null);
    assert(url.pathname === '/analytics/config' || request.rsc === '1', 'only analytics configuration and Next.js navigation prefetch are allowed');
    assert(!decodeURIComponent(request.url).includes(left) && !decodeURIComponent(request.url).includes(right), 'text comparison must not send input over the network');
  }
  await page.getByRole('button', { name: '复制原始文本' }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '今天下午去超市。\n然后回家。');
  await page.getByRole('button', { name: '复制结果', exact: true }).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\[-.*\-\]/s);
  await page.getByRole('button', { name: '合并视图', exact: true }).click();
  assert(await page.getByRole('region', { name: '合并对比结果' }).isVisible());
  assert(await page.locator('[data-panel="inline"] del').count() > 0);
  await page.getByRole('button', { name: '交换', exact: true }).click();
  assert.equal(await page.getByLabel('原始文本', { exact: true }).inputValue(), '今天晚上去超市。\n然后回家吃饭。');
  assert.equal(await page.getByRole('region', { name: '对比结果', exact: true }).count(), 0);
  await page.getByRole('button', { name: '清空', exact: true }).click();
  assert.equal(await page.getByLabel('原始文本', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('对比文本', { exact: true }).inputValue(), '');
});

test('normalization preserves each side, invalidation, empty input and literal HTML', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.getByLabel('忽略大小写', { exact: true }).check();
  await page.getByLabel('忽略多余空格', { exact: true }).check();
  await compare(page, 'Hello    WORLD', 'hello world', 'word');
  assert.match(await page.getByRole('status').textContent(), /内容相同/);
  assert.equal(await page.locator('[data-panel="left"]').textContent(), 'Hello    WORLD');
  assert.equal(await page.locator('[data-panel="right"]').textContent(), 'hello world');
  assert(await page.getByRole('button', { name: '下一个差异' }).isDisabled());
  await page.getByLabel('忽略大小写', { exact: true }).uncheck();
  assert.equal(await page.getByRole('region', { name: '对比结果', exact: true }).count(), 0);
  await compare(page, '', '');
  assert.match(await page.getByRole('status').textContent(), /内容相同/);
  await compare(page, '', '<script>window.UNSAFE=1</script><img src=x onerror=alert(1)>');
  assert.equal(await page.evaluate(() => window.UNSAFE), undefined);
  assert.equal(await page.locator('[data-panel] script,[data-panel] img').count(), 0);
  assert.match(await page.locator('[data-panel="right"]').textContent(), /<script>/);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.getByRole('button', { name: '复制结果', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '复制失败' }).waitFor();
});

test('aligned anchors, bidirectional sync, independent scroll and difference navigation', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const lines = Array.from({ length: 160 }, (_, i) => `第 ${i} 行 内容保持一致。`);
  const updated = [...lines]; updated.splice(20, 0, ...Array.from({ length: 20 }, (_, i) => `新增内容 ${i}`)); updated[130] = '这里是另一个变化';
  await compare(page, lines.join('\n'), updated.join('\n'), 'line');
  const left = page.locator('[data-panel="left"]'), right = page.locator('[data-panel="right"]');
  await page.waitForTimeout(200);
  const sizes = await page.evaluate(() => {
    const a = [...document.querySelectorAll('[data-panel="left"] [data-block]')], b = [...document.querySelectorAll('[data-panel="right"] [data-block]')];
    return a.map((el, i) => Math.abs(el.getBoundingClientRect().height - b[i].getBoundingClientRect().height));
  });
  assert(sizes.every(delta => delta < 1));
  await left.evaluate(e => e.scrollTop = 900); await page.waitForTimeout(150);
  assert(Math.abs(await left.evaluate(e => e.scrollTop) - await right.evaluate(e => e.scrollTop)) < 1);
  await right.evaluate(e => e.scrollTop = 500); await page.waitForTimeout(150);
  assert(Math.abs(await left.evaluate(e => e.scrollTop) - 500) < 1);
  await page.getByLabel('同步滚动', { exact: true }).uncheck();
  await left.evaluate(e => e.scrollTop = 1200); await page.waitForTimeout(150);
  assert.equal(await right.evaluate(e => e.scrollTop), 500);
  await page.getByLabel('同步滚动', { exact: true }).check(); await page.waitForTimeout(150);
  assert.equal(await right.evaluate(e => e.scrollTop), 1200);
  await page.getByRole('button', { name: '下一个差异' }).click();
  assert(await page.getByText('差异 2 / 2', { exact: true }).isVisible());
  assert(await left.evaluate(e => e.scrollTop) > 1200);
  await page.getByRole('button', { name: '下一个差异' }).click();
  assert(await page.getByText('差异 1 / 2', { exact: true }).isVisible());
  await page.getByRole('button', { name: '上一个差异' }).click();
  assert(await page.getByText('差异 2 / 2', { exact: true }).isVisible());
});

test('mobile, long strings, limits, cancellation and stale worker protection', { timeout: 60000 }, async t => {
  const page = await setup(t, { width: 390, height: 844 });
  await compare(page, 'a'.repeat(4000), 'b'.repeat(4000), 'character');
  assert(await page.getByRole('note').isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByRole('button', { name: '合并视图', exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByLabel('原始文本', { exact: true }).fill('a'.repeat(100001));
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  assert.match(await page.getByRole('status').textContent(), /100,000/);
  await page.getByLabel('原始文本', { exact: true }).fill('a');
  // Hold the worker response to make cancellation deterministic.
  await page.evaluate(() => {
    window.Worker = class { postMessage() {} terminate() {} };
  });
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await page.getByRole('button', { name: '取消比较', exact: true }).click();
  assert(await page.getByRole('button', { name: '开始比较', exact: true }).isEnabled());
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await page.getByRole('button', { name: '清空', exact: true }).click();
  assert.equal(await page.getByLabel('原始文本', { exact: true }).inputValue(), '');
  assert.equal(await page.getByRole('region', { name: '对比结果', exact: true }).count(), 0);
});
