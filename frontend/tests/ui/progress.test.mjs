import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

test('long translation shows activity before the first result and real partial progress', { timeout: 60000 }, async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    const pending = [];
    await page.route('https://translate.googleapis.com/**', route => { pending.push(route); });
    await page.goto('http://127.0.0.1:3000/tools/translate');
    await page.locator('#translation-source').fill('hello world\n'.repeat(400));
    await page.getByRole('button', { name: '翻译', exact: true }).click();
    const progress = page.getByRole('progressbar', { name: '翻译进度' });
    await progress.waitFor();
    await page.getByText('已完成 0 / 2 段', { exact: true }).waitFor();
    assert.equal(await progress.getAttribute('aria-valuenow'), '0');
    await page.getByText('已用时 1 秒', { exact: true }).waitFor();
    assert.equal(pending.length, 2);
    await pending[0].fulfill({ json: [[['你好']], null, 'en'] });
    await page.getByText('已完成 1 / 2 段', { exact: true }).waitFor();
    assert.equal(await progress.getAttribute('aria-valuenow'), '50');
    await pending[1].fulfill({ json: [[['世界']], null, 'en'] });
    await page.locator('.translation-result').waitFor();
    assert.equal(await progress.count(), 0);
    await page.getByRole('button', { name: '清空', exact: true }).click();
    assert.equal(await page.getByText(/已用时 \d+ 秒/).count(), 0);
});
