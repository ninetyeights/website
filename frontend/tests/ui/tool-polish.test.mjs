import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function setup(t, path) {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${base}/tools${path}`);
  return page;
}

test('directory separates available tools, searches multiple terms and keeps clear-search keyboard focus', {timeout:60000}, async t => {
  const page = await setup(t, '');
  assert.equal(await page.getByRole('list', {name:'已上线工具'}).getByRole('link').count(), 5);
  assert.equal(await page.getByRole('list', {name:'规划中工具'}).getByRole('link').count(), 0);
  const search = page.getByRole('searchbox', {name:'搜索工具'});
  await search.fill('UNIX 毫秒');
  assert.equal(await page.getByRole('list', {name:'已上线工具'}).getByRole('link').count(), 1);
  assert.match(await page.getByRole('list', {name:'已上线工具'}).textContent(), /时间戳转换/);
  await page.getByRole('button', {name:'清除搜索', exact:true}).click();
  assert(await search.evaluate(el => el === document.activeElement));
  await search.fill('Excel');
  assert.match(await page.getByRole('list', {name:'已上线工具'}).textContent(), /链接提取/);
  await search.fill('不存在的工具');
  await page.getByRole('button', {name:'清除筛选'}).click();
  assert.equal(await search.inputValue(), '');
  await page.setViewportSize({width:320,height:800});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});

test('comparison rejects stale clipboard feedback and restores result status after copying', {timeout:60000}, async t => {
  const page = await setup(t, '/text-compare');
  const copy = page.getByRole('button', {name:'复制原始文本',exact:true});
  assert(await copy.isDisabled());
  assert(await page.getByRole('button', {name:'复制对比文本',exact:true}).isDisabled());
  const input = page.getByLabel('原始文本', {exact:true});
  await input.fill('before');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:() => new Promise(resolve => {window.finishCopy = resolve;})}}));
  await copy.click();
  await input.fill('after');
  await page.evaluate(() => window.finishCopy());
  assert(!/已复制/.test(await page.getByRole('status').textContent()));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:() => Promise.resolve()}}));
  await page.getByLabel('对比文本', {exact:true}).fill('after');
  await page.getByRole('button', {name:'开始比较',exact:true}).click();
  await page.getByRole('region', {name:'对比结果',exact:true}).waitFor();
  await copy.click();
  await page.getByRole('status').filter({hasText:'原始文本已复制'}).waitFor();
  await page.getByRole('status').filter({hasText:'内容相同'}).waitFor();
});

test('empty table stays idle and a replacement selection starts on the first preview page', {timeout:60000}, async t => {
  const page = await setup(t, '/link-extract');
  await page.getByRole('button', {name:'保留表格布局',exact:true}).click();
  await page.waitForTimeout(500);
  await page.getByText('粘贴一个连续表格选区即可开始。', {exact:true}).waitFor();
  assert(await page.getByRole('button', {name:'复制完整表格'}).isDisabled());
  const input = page.locator('#link-input');
  await input.fill(Array.from({length:110}, (_,i) => `https://e.test/a${i}`).join('\n'));
  const preview = page.getByRole('region', {name:'表格预览',exact:true});
  await preview.waitFor();
  await page.getByRole('button', {name:'下一页',exact:true}).click();
  assert.equal(await preview.locator('th').first().textContent(), '51');
  await input.fill(Array.from({length:110}, (_,i) => `https://e.test/b${i}`).join('\n'));
  await preview.waitFor();
  assert.equal(await preview.locator('th').first().textContent(), '1');
  assert.match(await preview.locator('td').first().textContent(), /b0/);
  await input.fill('');
  await page.waitForTimeout(500);
  await page.getByText('粘贴一个连续表格选区即可开始。', {exact:true}).waitFor();
  assert.equal(await page.locator('#table-output').inputValue(), '');
});
