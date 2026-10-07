import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

test('experimental retry and final error messages explain the actual failure', { timeout: 60000 }, async (t) => {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    let requests = 0;
    await page.route('https://translate.googleapis.com/**', route => route.fulfill({
        status: ++requests === 1 ? 409 : 403,
        body: 'private upstream body',
    }));
    await page.goto('http://127.0.0.1:3000/tools/translate');
    await page.locator('#translation-source').fill('hello');
    await page.getByRole('button', { name: '翻译', exact: true }).click();
    await page.getByText(/请求发生冲突.*HTTP 409/).waitFor();
    const alert = page.getByRole('alert').filter({ hasText: 'HTTP 403' });
    await alert.waitFor();
    assert.match(await alert.innerText(), /拒绝.*HTTP 403/);
    assert(!(await alert.innerText()).includes('private upstream body'));
    assert.equal(requests, 2);
    assert(await page.getByRole('button', { name: '翻译', exact: true }).isEnabled());
});
