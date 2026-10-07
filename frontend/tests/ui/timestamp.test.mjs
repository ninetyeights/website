import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function setup(t, timezoneId = 'Asia/Shanghai') {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.clock.setFixedTime(new Date('2024-12-31T13:22:33.456Z'));
  await page.goto(`${base}/tools/timestamp`);
  await page.getByRole('tab', { name: '时间戳 → 日期' }).waitFor();
  return page;
}
const value = (page, id) => page.locator(`[data-result="${id}"] dd`).textContent();

test('tool directory, local live clock, automatic units, original formats and clipboard', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.goto(`${base}/tools`);
  await page.getByRole('link').filter({ hasText: '时间戳转换' }).click();
  await page.getByRole('tab', { name: '时间戳 → 日期' }).waitFor();
  assert.equal(await value(page, 'clock-local'), '2024-12-31 21:22:33.456');
  await page.clock.setFixedTime(new Date('2024-12-31T13:22:34.789Z'));
  await page.waitForTimeout(100);
  assert.equal(await value(page, 'clock-milliseconds'), String(Date.parse('2024-12-31T13:22:34.789Z')));
  const network = []; page.on('request', request => { if (['xhr', 'fetch'].includes(request.resourceType())) network.push(request.url()); });
  await page.getByLabel('时间戳', { exact: true }).fill('1700000000123');
  assert.equal(await value(page, 'ts-iso'), '2023-11-14T22:13:20.123Z');
  assert.equal(await value(page, 'ts-local'), '2023-11-15 06:13:20.123');
  assert.equal(await value(page, 'ts-offset'), 'UTC+08:00');
  await page.getByRole('button', { name: '复制毫秒时间戳', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '1700000000123');
  assert.match(await page.getByRole('status').textContent(), /已复制/);
  await page.getByLabel('时间戳', { exact: true }).fill('-1');
  assert.equal(await value(page, 'ts-iso'), '1969-12-31T23:59:59.000Z');
  await page.getByRole('combobox', { name: '输入单位' }).click();
  await page.getByRole('option', { name: '毫秒', exact: true }).click();
  assert.equal(await value(page, 'ts-iso'), '1969-12-31T23:59:59.999Z');
  await page.getByRole('button', { name: '现在', exact: true }).click();
  assert.equal(await page.getByLabel('时间戳', { exact: true }).inputValue(), String(Date.parse('2024-12-31T13:22:34.789Z')));
  assert.equal(network.length, 0);
});

test('timestamp errors, empty reset, keyboard tabs, presets and invalid dates', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const input = page.getByLabel('时间戳', { exact: true });
  await input.fill('0'); assert.equal(await value(page, 'ts-seconds'), '0');
  for (const bad of ['abc', '1e10', '8640000000000001']) {
    await input.fill(bad); assert(await page.getByRole('tabpanel').getByRole('alert').isVisible());
    assert.equal(await page.locator('[data-result="ts-iso"]').count(), 0);
  }
  await input.fill(''); assert.equal(await page.getByRole('tabpanel').getByRole('alert').count(), 0);
  await page.getByRole('tab', { name: '时间戳 → 日期' }).focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: '日期 → 时间戳' }).getAttribute('aria-selected'), 'true');
  for (const [label, iso] of [['现在', '2024-12-31T13:22:33.456Z'], ['今天 00:00', '2024-12-30T16:00:00.000Z'], ['今天 23:59', '2024-12-31T15:59:59.999Z'], ['明天', '2024-12-31T16:00:00.000Z'], ['昨天', '2024-12-29T16:00:00.000Z'], ['本周一', '2024-12-29T16:00:00.000Z']]) {
    await page.getByRole('button', { name: label, exact: true }).click(); assert.equal(await value(page, 'dt-iso'), iso);
  }
  await page.getByLabel('年', { exact: true }).fill('2023');
  await page.getByLabel('月', { exact: true }).fill('2');
  await page.getByLabel('日', { exact: true }).fill('29');
  assert(await page.getByRole('tabpanel').getByRole('alert').isVisible()); assert.equal(await page.locator('[data-result="dt-iso"]').count(), 0);
  await page.getByLabel('年', { exact: true }).fill('2024');
  assert.equal(await value(page, 'dt-iso'), '2024-02-28T16:00:00.000Z');
  await page.getByLabel('毫秒', { exact: true }).fill(''); assert(await page.getByRole('tabpanel').getByRole('alert').isVisible());
});

test('DST gaps, ISO week boundaries, copy failure and mobile layout', { timeout: 60000 }, async t => {
  const page = await setup(t, 'America/New_York');
  await page.getByLabel('时间戳', { exact: true }).fill(String(Date.parse('2021-01-01T17:00:00Z')));
  assert.equal(await value(page, 'ts-week'), '2020 年第 53 周（ISO）');
  assert.equal(await value(page, 'ts-day'), '第 1 天');
  await page.setViewportSize({ width: 390, height: 844 });
  const unit = page.getByRole('combobox', { name: '输入单位' });
  await unit.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('listbox').waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('毫秒'));
  await page.keyboard.press('Enter');
  assert.match(await unit.textContent(), /毫秒/);
  await unit.click();
  const menu = await page.getByRole('listbox').boundingBox();
  assert(menu.x >= 0 && menu.x + menu.width <= 390);
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  await page.keyboard.press('Escape');
  await page.getByRole('listbox').waitFor({ state: 'hidden' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('tab', { name: '日期 → 时间戳' }).click();
  for (const [label, text] of [['年', '2024'], ['月', '3'], ['日', '10'], ['时', '2'], ['分', '30']]) await page.getByLabel(label, { exact: true }).fill(text);
  assert.match(await page.getByRole('tabpanel').getByRole('alert').textContent(), /夏令时/);
  await page.getByLabel('时', { exact: true }).fill('3');
  assert.equal(await page.getByRole('tabpanel').getByRole('alert').count(), 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.getByRole('button', { name: '复制秒时间戳', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '复制失败' }).waitFor();
});

test('selected timezone, pasted ISO offsets, ambiguous input and input-mode preservation', { timeout: 60000 }, async t => {
  const page = await setup(t, 'America/New_York');
  const selectZone = async name => {
    await page.getByRole('combobox', { name: '转换时区' }).click();
    await page.getByRole('option', { name, exact: true }).click();
  };
  await page.getByLabel('时间戳', { exact: true }).fill('0');
  await selectZone('北京 · Asia/Shanghai');
  assert.equal(await value(page, 'ts-local'), '1970-01-01 08:00:00.000');
  await page.getByRole('tab', { name: '日期 → 时间戳' }).click();
  await page.getByRole('button', { name: '今天 00:00', exact: true }).click();
  assert.equal(await value(page, 'dt-iso'), '2024-12-30T16:00:00.000Z');
  await page.getByRole('button', { name: '直接粘贴', exact: true }).click();
  const input = page.getByLabel('日期字符串', { exact: true });
  await input.fill('2026-09-27 15:30:00');
  assert.equal(await value(page, 'dt-iso'), '2026-09-27T07:30:00.000Z');
  await input.fill('2026-09-27T15:30:00.123+08:00');
  assert.equal(await value(page, 'dt-iso'), '2026-09-27T07:30:00.123Z');
  await selectZone('UTC');
  assert.equal(await value(page, 'dt-iso'), '2026-09-27T07:30:00.123Z');
  assert(await page.getByText('解析依据：字符串自带 UTC+08:00', { exact: true }).isVisible());
  await input.fill('01/02/2026');
  assert.match(await page.getByRole('tabpanel').getByRole('alert').textContent(), /歧义/);
  assert.equal(await page.locator('[data-result="dt-iso"]').count(), 0);
  await input.fill('2026-09-27T15:30:00Z');
  await page.getByRole('button', { name: '分项填写', exact: true }).click();
  await page.getByRole('button', { name: '直接粘贴', exact: true }).click();
  assert.equal(await input.inputValue(), '2026-09-27T15:30:00Z');
  await input.fill('');
  assert.equal(await page.locator('[data-result="dt-iso"]').count(), 0);
  assert.equal(await page.getByRole('tabpanel').getByRole('alert').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await selectZone('洛杉矶 · America/Los_Angeles');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});


test('live clock pause freezes displayed and copied values, then resumes', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.getByRole('button', { name: '暂停时钟' }).click();
  const frozen = await value(page, 'clock-milliseconds');
  await page.clock.setFixedTime(new Date('2025-01-01T00:00:00Z'));
  await page.waitForTimeout(150);
  assert.equal(await value(page, 'clock-milliseconds'), frozen);
  await page.locator('[data-result="clock-milliseconds"]').getByRole('button').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), frozen);
  await page.getByRole('button', { name: '继续时钟' }).click();
  await page.waitForTimeout(150);
  assert.equal(await value(page, 'clock-milliseconds'), String(Date.parse('2025-01-01T00:00:00Z')));
});

test('batch errors, filtering, copying, stale result invalidation and mobile containment', { timeout: 60000 }, async t => {
  const page = await setup(t);
  const batch = page.getByRole('region', { name: '批量转换', exact: true });
  await batch.locator('summary').click();
  const input = batch.getByLabel('批量输入', { exact: true });
  await input.fill('0\n\nwrong\n1700000000123');
  await batch.getByRole('button', { name: '批量转换', exact: true }).click();
  assert.match(await batch.getByRole('status').textContent(), /共 3 条 · 成功 2 条 · 失败 1 条/);
  assert.equal(await batch.locator('tbody tr').count(), 3);
  await batch.getByLabel('只看错误').check();
  assert.equal(await batch.locator('tbody tr').count(), 1);
  assert.equal(await batch.locator('tbody tr td').first().textContent(), '3');
  await batch.getByRole('button', { name: '复制全部结果' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(copied.split('\n').length, 4);
  assert.match(copied, /1970-01-01T00:00:00.000Z/); assert.match(copied, /wrong/);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await input.fill('0');
  assert.equal(await batch.getByRole('region', { name: '批量转换结果' }).count(), 0);
  await batch.getByRole('combobox', { name: '批量转换方向' }).click();
  await page.getByRole('option', { name: '日期 → 时间戳', exact: true }).click();
  await input.fill('1970-01-01 08:00:00\n1970-01-01T00:00:00Z');
  await batch.getByRole('button', { name: '批量转换', exact: true }).click();
  assert.match(await batch.getByRole('status').textContent(), /成功 2 条 · 失败 0 条/);
  assert.equal(await batch.locator('tbody tr').filter({ hasText: '0 秒 / 0 毫秒' }).count(), 2);
  await page.getByRole('combobox', { name: '转换时区' }).click();
  await page.getByRole('option', { name: 'UTC', exact: true }).click();
  assert.equal(await batch.getByRole('region', { name: '批量转换结果' }).count(), 0);
  await batch.locator('summary').click(); await batch.locator('summary').click();
  assert.match(await input.inputValue(), /1970-01-01/);
  await batch.getByRole('button', { name: '清空批量内容' }).click();
  assert.equal(await input.inputValue(), '');
  await batch.getByRole('button', { name: '批量转换', exact: true }).click();
  assert(await batch.getByRole('alert').isVisible());
});
