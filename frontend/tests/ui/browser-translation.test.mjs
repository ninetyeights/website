import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('local provider downloads on click, translates without cloud requests, and cancels stale results', { timeout: 60000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  const cloudRequests = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://translate.googleapis.com/**', route => { cloudRequests.push(route.request().url()); return route.abort(); });
  await page.route('**/api/tools/translate', route => { cloudRequests.push(route.request().url()); return route.abort(); });
  await page.addInitScript(() => {
    window.localTest = { creates: 0, destroys: 0 };
    Object.defineProperty(window, 'LanguageDetector', { configurable: true, value: {
      availability: async () => 'downloadable',
      create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }], destroy: () => {} }),
    } });
    Object.defineProperty(window, 'Translator', { configurable: true, value: {
      availability: async () => 'downloadable',
      create: async options => {
        window.localTest.creates++;
        options.monitor({ addEventListener: (_, callback) => callback({ loaded: 0.5 }) });
        await new Promise(resolve => setTimeout(resolve, 600));
        return {
          translate: async text => { await new Promise(resolve => setTimeout(resolve, 200)); return text.split(/\r\n|\r|\n/).map(line => line.trim() ? '你好' : '').join('\n'); },
          destroy: () => window.localTest.destroys++,
        };
      },
    } });
  });
  await page.goto(`${base}/tools/translate`);
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '浏览器本地翻译', exact: true }).click();
  await page.getByText('点击翻译后准备语言模型，首次使用可能需要下载。', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.localTest.creates), 0);
  await page.locator('#translation-source').fill('hello\n\n  world\n');
  await page.getByRole('button', { name: '翻译', exact: true }).click();
  await page.getByText('正在下载语言模型：50%', { exact: true }).waitFor();
  await page.locator('.translation-result').waitFor();
  assert.equal(await page.locator('.translation-result').textContent(), '你好\n\n  你好\n');
  await page.getByText(/准备 [\d.]+ 秒 · 识别 [\d.]+ 秒 · 翻译 [\d.]+ 秒/).waitFor();
  assert.equal(await page.evaluate(() => window.localTest.destroys), 1);
  if (process.env.LOCAL_TRANSLATION_ARTIFACTS) await page.screenshot({ path: `${process.env.LOCAL_TRANSLATION_ARTIFACTS}/desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (process.env.LOCAL_TRANSLATION_ARTIFACTS) await page.screenshot({ path: `${process.env.LOCAL_TRANSLATION_ARTIFACTS}/mobile-timings.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: '翻译', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('.translation-result').count(), 0);
  assert.equal(await page.evaluate(() => window.localTest.destroys), 2);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (process.env.LOCAL_TRANSLATION_ARTIFACTS) await page.screenshot({ path: `${process.env.LOCAL_TRANSLATION_ARTIFACTS}/mobile.png`, fullPage: true });
  assert.deepEqual(cloudRequests, []);
  assert.deepEqual(errors, []);
});

test('unsupported local mode explains availability and retains the cloud provider', { timeout: 60000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addInitScript(() => Object.defineProperty(window, 'Translator', { configurable: true, value: undefined }));
  await page.goto(`${base}/tools/translate`);
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '浏览器本地翻译', exact: true }).click();
  await page.getByText('当前浏览器不支持自动识别或本地翻译，请手动选择源语言或其他服务。', { exact: true }).waitFor();
  await page.locator('#translation-source').fill('hello');
  assert.equal(await page.getByRole('button', { name: '翻译', exact: true }).isDisabled(), true);
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Google 翻译', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '翻译', exact: true }).isEnabled(), true);
});

test('line-by-line translation preserves layout', { timeout: 60000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.lineCalls = 0;
    Object.defineProperty(window, 'LanguageDetector', { configurable: true, value: {
      availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }], destroy: () => {} }),
    } });
    Object.defineProperty(window, 'Translator', { configurable: true, value: {
      availability: async () => 'available', create: async () => ({ translate: async text => {
        window.lineCalls++;
        if (/[\r\n]/.test(text)) throw new Error('expected single line input');
        return ({ hello: '你好', world: '世界', bye: '再见' })[text];
      }, destroy: () => {} }),
    } });
  });
  await page.goto(`${base}/tools/translate`);
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '浏览器本地翻译', exact: true }).click();
  await page.getByText('本地翻译已就绪', { exact: true }).waitFor();
  await page.locator('#translation-source').fill('hello\n  world\nbye');
  await page.getByRole('button', { name: '翻译', exact: true }).click();
  await page.locator('.translation-result').waitFor();
  assert.equal(await page.locator('.translation-result').textContent(), '你好\n  世界\n再见');
  assert.equal(await page.evaluate(() => window.lineCalls), 3);
  assert.equal(await page.getByText('本地翻译诊断', { exact: true }).count(), 0);
});

test('request failure shows a simple error without diagnostics', { timeout: 60000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.localCalls = 0;
    Object.defineProperty(window, 'Translator', { configurable: true, value: {
      availability: async () => 'available', create: async () => ({ translate: async () => { window.localCalls++; throw new Error('PRIVATE_ONE'); }, destroy: () => {} }),
    } });
    Object.defineProperty(window, 'LanguageDetector', { configurable: true, value: {
      availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.99 }], destroy: () => {} }),
    } });
  });
  await page.goto(`${base}/tools/translate`);
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: '浏览器本地翻译', exact: true }).click();
  await page.getByText('本地翻译已就绪', { exact: true }).waitFor();
  await page.locator('#translation-source').fill('PRIVATE_ONE\nPRIVATE_TWO');
  await page.getByRole('button', { name: '翻译', exact: true }).click();
  const error = page.getByRole('alert').filter({ hasText: '本地翻译失败' });
  await error.waitFor();
  assert.ok(!(await error.innerText()).includes('PRIVATE_ONE'));
  assert.equal(await page.getByText('本地翻译诊断', { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => window.localCalls), 1);
  assert.equal(await page.locator('.translation-result').count(), 0);
  assert.equal(await page.getByRole('button', { name: '复制译文', exact: true }).isDisabled(), true);
});
