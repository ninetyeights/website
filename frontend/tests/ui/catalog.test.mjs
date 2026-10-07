import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

// This test uses an isolated copy of the production frontend and a mock catalog.
// It never changes the site's real database or administrator accounts.
const base = process.env.TEST_CATALOG_BASE_URL;
test('runtime flags control every entry, promo, detail, download and sitemap without rebuilding', { skip: !base, timeout: 60000 }, async t => {
  const initial = [
    ['tool', 'link-extract'], ['tool', 'translate'], ['tool', 'text-compare'], ['tool', 'timestamp'], ['tool', 'password'],
    ['project', 'magidesk'], ['project', 'audiodeviceswitcher'], ['project', 'lyricdrop'],
  ].map(([kind, slug], index) => ({ kind, slug, enabled: true, sort_order: (index + 1) * 10 }));
  let entries = structuredClone(initial);
  let unavailable = false;
  const server = createServer((request, response) => {
    if (request.url !== '/api/site-catalog') { response.writeHead(404).end(); return; }
    response.writeHead(unavailable ? 503 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ entries }));
  });
  await new Promise(resolve => server.listen(3302, '0.0.0.0', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  assert.equal((await page.goto(`${base}/`)).status(), 200);
  assert.equal(await page.locator('a[href="/projects/magidesk"]').count(), 2);
  for (const entry of entries) {
    const directory = entry.kind === 'tool' ? 'tools' : 'projects';
    const path = `/${directory}/${entry.slug}`;
    assert.equal((await page.request.get(base + path)).status(), 200, path);
    entry.enabled = false;
    const disabled = await page.request.get(base + path);
    assert.equal(disabled.status(), 404, path);
    assert.match(disabled.headers()['x-robots-tag'], /noindex/);
    assert.equal((await page.request.get(base + path + '?preview=true')).status(), 404);
    await page.goto(`${base}/${directory}`);
    assert.equal(await page.locator(`a[href="${path}"]`).count(), 0, `directory ${path}`);
    await page.goto(`${base}/`);
    assert.equal(await page.locator(`a[href="${path}"]`).count(), 0, `home ${path}`);
    const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
    assert(!sitemap.includes(path), `sitemap ${path}`);
    if (entry.kind === 'project') {
      for (const platform of ['windows', 'macos']) {
        assert.equal((await page.request.get(`${base}/downloads/${entry.slug}/${platform}`, { maxRedirects: 0 })).status(), 404);
      }
    }
    entry.enabled = true;
    assert.equal((await page.request.get(base + path)).status(), 200, `restore ${path}`);
  }

  entries.find(entry => entry.slug === 'password').sort_order = 0;
  entries.find(entry => entry.slug === 'lyricdrop').sort_order = 0;
  await page.goto(`${base}/tools`);
  assert.equal(await page.locator('ul[aria-label="已上线工具"] a').first().getAttribute('href'), '/tools/password');
  await page.goto(`${base}/projects`);
  assert.equal(await page.locator('main a[href^="/projects/"]').first().getAttribute('href'), '/projects/lyricdrop');
  entries.forEach(entry => { entry.enabled = false; });
  await page.goto(`${base}/`);
  assert.equal(await page.locator('a[href^="/tools/"]').count(), 0);
  assert.equal(await page.locator('a[href^="/projects/"]').count(), 0);
  await page.goto(`${base}/tools`);
  assert.equal(await page.locator('a[href^="/tools/"]').count(), 0);
  assert(!await (await page.request.get(`${base}/sitemap.xml`)).text().then(text => text.includes('/tools/password')));
  unavailable = true;
  assert.equal((await page.request.get(`${base}/tools/password`)).status(), 503);
  assert.equal((await page.request.get(`${base}/downloads/magidesk/windows`)).status(), 503);
  unavailable = false;
  entries = structuredClone(initial);
  assert.equal((await page.request.get(`${base}/tools/password`)).status(), 200);
  assert.deepEqual(errors, []);
});
