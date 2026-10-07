import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function setup(t) {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${base}/tools/password`);
  await page.getByRole('tab', { name: '随机密码' }).waitFor();
  await page.getByTestId('primary-password').waitFor();
  return page;
}
const primary = page => page.getByTestId('primary-password');
const generatedCount = async page => Number((await page.getByText(/^使用浏览器安全随机数/).textContent()).match(/本次已生成 (\d+) 条/)[1]);

test('automatic defaults and debounced edits preserve focus, coalesce batches and cancel stale work', { timeout: 60000 }, async t => {
  const page = await setup(t);
  assert.equal((await primary(page).textContent()).length, 16);
  assert.equal(await generatedCount(page), 1);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.locator('#pw-length').fill('20');
  await page.clock.runFor(150);
  await page.locator('#pw-length').fill('32');
  await page.clock.runFor(150);
  assert.equal(await primary(page).count(), 0);
  assert.equal(await generatedCount(page), 1);
  await page.clock.runFor(150);
  assert.equal((await primary(page).textContent()).length, 32);
  assert.equal(await generatedCount(page), 2);
  assert.equal(await page.locator('#pw-length').evaluate(el => el === document.activeElement), true);
  await page.locator('#pw-count').fill('10');
  await page.clock.runFor(300);
  assert.equal(await page.getByRole('list', { name: '批量密码' }).locator('li').count(), 10);
  assert.equal(await generatedCount(page), 12);
  await page.locator('#pw-length').fill('48');
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  await page.clock.runFor(500);
  assert.equal(await generatedCount(page), 22);
  assert.equal((await primary(page).textContent()).length, 48);
  await page.locator('#pw-length').fill('64');
  await page.getByRole('button', { name: '清空结果' }).click();
  await page.clock.runFor(500);
  assert.equal(await primary(page).count(), 0);
  assert.equal(await generatedCount(page), 22);
  await page.getByRole('button', { name: '密码长度设为 64', exact: true }).click();
  await page.clock.runFor(500);
  assert.equal(await primary(page).count(), 0);
  await page.locator('#pw-length').fill('');
  await page.clock.runFor(500);
  assert.equal(await primary(page).count(), 0);
  await page.locator('#pw-length').fill('16');
  await page.clock.runFor(300);
  assert.equal((await primary(page).textContent()).length, 16);
  assert.equal(await generatedCount(page), 32);
});

test('automatic mode and slider changes keep hidden state and never reveal or focus results', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '隐藏密码' }).click();
  await page.evaluate(() => {
    window.resultScrolls = 0;
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(options) {
      if (this.id === 'password-result-title') window.resultScrolls++;
      return original.call(this, options);
    };
  });
  await page.getByRole('tab', { name: 'PIN 码' }).click();
  assert.equal(await primary(page).textContent(), '••••••••••••');
  assert.equal(await page.getByRole('tab', { name: 'PIN 码' }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: '显示密码' }).click();
  assert.match(await primary(page).textContent(), /^\d{6}$/);
  const slider = page.getByRole('slider', { name: 'PIN 位数滑块' });
  await slider.focus(); await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('[data-testid="primary-password"]')?.textContent.length === 7);
  assert.equal(await slider.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => window.resultScrolls), 0);
  await page.getByRole('tab', { name: '单词短语' }).click();
  assert.equal((await primary(page).textContent()).split('-').length, 6);
  await page.getByRole('combobox', { name: '单词分隔符' }).click();
  await page.getByRole('option', { name: '句点 .', exact: true }).click();
  assert.equal((await primary(page).textContent()).split('.').length, 6);
  assert.equal(await page.evaluate(() => window.resultScrolls), 0);
});

test('unchanged settings preserve results and default restore is scoped to the active mode', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('tab', { name: '单词短语' }).click();
  await page.locator('#pw-wordCount').fill('10');
  await page.getByRole('tab', { name: '随机密码' }).click();
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  const password = await primary(page).textContent();
  await page.getByRole('tab', { name: '随机密码' }).click();
  await page.getByRole('button', { name: '密码长度设为 16', exact: true }).click();
  await page.getByRole('button', { name: '生成数量设为 1', exact: true }).click();
  await page.getByRole('button', { name: '恢复当前模式默认设置' }).click();
  assert.equal(await primary(page).textContent(), password);
  await page.locator('#pw-length').fill('24');
  await page.locator('#pw-count').fill('5');
  await page.getByLabel('排除易混淆字符 0 O 1 l I', { exact: true }).check();
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  await page.getByRole('button', { name: '恢复当前模式默认设置' }).click();
  assert.equal((await primary(page).textContent()).length, 16);
  assert.equal(await page.locator('#pw-length').inputValue(), '16');
  assert.equal(await page.locator('#pw-count').inputValue(), '1');
  assert.equal(await page.getByLabel('排除易混淆字符 0 O 1 l I', { exact: true }).isChecked(), false);
  await page.getByRole('tab', { name: '单词短语' }).click();
  assert.equal(await page.locator('#pw-wordCount').inputValue(), '10');
  await page.getByRole('button', { name: '恢复当前模式默认设置' }).click();
  assert.equal(await page.locator('#pw-wordCount').inputValue(), '6');
  await page.getByRole('tab', { name: 'PIN 码' }).click();
  await page.locator('#pw-pinLength').fill('12');
  await page.getByLabel('避免相邻重复', { exact: true }).check();
  await page.getByRole('button', { name: '恢复当前模式默认设置' }).click();
  assert.equal(await page.locator('#pw-pinLength').inputValue(), '6');
  assert.equal(await page.getByLabel('避免相邻重复', { exact: true }).isChecked(), false);
});

test('single possible password receives a specific warning that clears with a larger pool', { timeout: 60000 }, async t => {
  const page = await setup(t);
  for (const label of ['大写字母 A–Z', '小写字母 a–z', '数字 0–9']) await page.getByLabel(label, { exact: true }).uncheck();
  await page.getByLabel('自定义符号', { exact: true }).fill('!!!');
  const warning = page.getByRole('main').getByRole('alert');
  assert.match(await warning.textContent(), /只有一种可能结果，没有随机性/);
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  assert.equal(await primary(page).textContent(), '!'.repeat(16));
  await page.getByLabel('自定义符号', { exact: true }).fill('!?');
  assert.equal(await warning.count(), 0);
});

test('mobile first generation reveals and focuses results without moving on regeneration', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView;
    window.resultScrolls = [];
    Element.prototype.scrollIntoView = function(options) {
      if (this.id === 'password-result-title') window.resultScrolls.push(options);
      return original.call(this, options);
    };
  });
  await page.getByRole('button', { name: '清空结果' }).click();
  // Explicit generation after clearing may reveal results; automatic updates never do.
  await page.locator('#pw-length').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'password-result-title');
  const heading = page.getByRole('heading', { name: '生成结果' });
  const bounds = await heading.boundingBox();
  assert(bounds.y >= 70 && bounds.y < 844);
  assert.deepEqual(await page.evaluate(() => window.resultScrolls), [{ block: 'start', behavior: 'instant' }]);
  await page.getByRole('button', { name: '再生成一组' }).click();
  assert.equal(await page.evaluate(() => window.resultScrolls.length), 1);
  assert.equal(await page.getByRole('button', { name: '再生成一组' }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: '清空结果' }).click();
  await page.locator('#pw-length').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.resultScrolls.length === 2);
});

test('password directory, random rules, batch copies, concealment and clear', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.goto(`${base}/tools`); await page.getByRole('link').filter({ hasText: '密码生成' }).click();
  await page.getByRole('tab', { name: '随机密码' }).waitFor();
  const requests = []; page.on('request', r => { if (['xhr', 'fetch'].includes(r.resourceType())) requests.push(r.url()); });
  await page.getByLabel('排除易混淆字符 0 O 1 l I', { exact: true }).check();
  await page.locator('#pw-count').fill('5');
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  const first = await primary(page).textContent(); assert.equal(first.length, 16); assert(!/[0O1lI]/.test(first));
  for (const pattern of [/[A-Z]/, /[a-z]/, /[2-9]/, /[^A-Za-z0-9]/]) assert(pattern.test(first));
  const rows = page.getByRole('list', { name: '批量密码' }).locator('li'); assert.equal(await rows.count(), 5);
  const passwords = await rows.locator('code').allTextContents();
  await page.getByRole('button', { name: '隐藏密码' }).click(); assert.equal(await primary(page).textContent(), '••••••••••••');
  assert.equal(await page.getByText(first, { exact: true }).count(), 0);
  await page.getByRole('button', { name: '复制全部 5 条' }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), passwords.join('\n'));
  await page.getByRole('button', { name: '复制第 3 条', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), passwords[2]);
  await page.getByRole('button', { name: '显示密码' }).click(); assert.equal(await primary(page).textContent(), first);
  await page.getByRole('button', { name: '清空结果' }).click(); assert.equal(await primary(page).count(), 0);
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  await page.locator('#pw-length').fill('24'); assert.equal(await primary(page).count(), 0);
  assert.equal(requests.length, 0);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
});

test('word options, keyboard modes, PIN restrictions and mobile layout', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.getByRole('tab', { name: '随机密码' }).focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: '单词短语' }).getAttribute('aria-selected'), 'true');
  await page.getByRole('combobox', { name: '单词分隔符' }).click();
  await page.getByRole('option', { name: '空格', exact: true }).click();
  await page.getByLabel('尾部添加两位数字', { exact: true }).check();
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  const phrase = await primary(page).textContent(); assert.equal(phrase.split(' ').length, 6); assert.match(phrase, /\d{2}$/);
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('tab', { name: 'PIN 码' }).click();
  await page.getByLabel('避免相邻重复', { exact: true }).check();
  await page.getByLabel('避免相邻递增或递减', { exact: true }).check();
  await page.locator('#pw-count').fill('100');
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  for (const pin of await page.getByRole('list', { name: '批量密码' }).locator('code').allTextContents()) {
    assert.match(pin, /^\d{6}$/); for (let i = 1; i < pin.length; i++) assert(Math.abs(Number(pin[i]) - Number(pin[i - 1])) > 1);
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('tab', { name: '单词短语' }).click();
  assert.match(await page.getByRole('combobox', { name: '单词分隔符' }).textContent(), /空格/);
});

test('invalid rules, empty values, unavailable crypto and clipboard denial', { timeout: 60000 }, async t => {
  const page = await setup(t);
  await page.locator('#pw-length').fill(''); assert(await page.getByRole('main').getByRole('alert').isVisible());
  assert(await page.getByRole('button', { name: '重新生成', exact: true }).isDisabled());
  await page.locator('#pw-length').fill('16');
  await page.getByLabel('自定义符号', { exact: true }).fill(''); assert(await page.getByRole('main').getByRole('alert').isVisible());
  await page.getByLabel('自定义符号', { exact: true }).fill('!');
  await page.locator('#pw-count').fill('501'); assert(await page.getByRole('main').getByRole('alert').isVisible());
  await page.locator('#pw-count').fill('1');
  for (const label of ['大写字母 A–Z', '小写字母 a–z', '数字 0–9', '符号']) await page.getByLabel(label, { exact: true }).uncheck();
  assert.match(await page.getByRole('main').getByRole('alert').textContent(), /至少选择/);
  await page.getByLabel('数字 0–9', { exact: true }).check();
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.getByRole('button', { name: '复制第一条' }).click();
  await page.getByRole('status').filter({ hasText: '复制失败' }).waitFor();
  await page.evaluate(() => Object.defineProperty(globalThis.crypto, 'getRandomValues', { configurable: true, value: undefined }));
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  assert.match(await page.getByRole('main').getByRole('alert').textContent(), /安全随机数/); assert.equal(await primary(page).count(), 0);
});
