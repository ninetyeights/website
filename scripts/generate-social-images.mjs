// Run with Playwright installed. SOCIAL_FONT can point to a local Chinese font.
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'frontend/public/social');
const read = path => readFile(resolve(root, path), 'utf8');
const entries = new Map();
const routes = ['/', '/feedback', '/privacy', '/projects', '/projects/magidesk', '/tools', '/tools/link-extract', '/tools/translate', '/tools/password', '/tools/timestamp', '/tools/text-compare'];
for (const path of routes) {
  const source = await read(`frontend/src/app${path === '/' ? '' : path}/page.tsx`);
  const title = source.match(/\btitle:\s*['"]([^'"]+)['"]/)?.[1];
  const description = source.match(/\bdescription:\s*['"]([^'"]+)['"]/)?.[1];
  if (!title || !description) throw new Error(`Missing metadata for ${path}`);
  entries.set(path, { title, description });
}
const projects = await read('frontend/src/lib/projects.ts');
for (const match of projects.matchAll(/slug: '([^']+)', name: '([^']+)'[\s\S]*?description: '([^']+)'/g)) {
  const path = `/projects/${match[1]}`;
  if (!entries.has(path)) entries.set(path, { title: `${match[2]} · 官方网站`, description: match[3] });
}
const navigation = await read('frontend/src/lib/navigation.ts');
for (const match of navigation.matchAll(/slug: '([^']+)', label: '([^']+)', description: '([^']+)'/g)) {
  const path = `/${match[1]}`;
  if (!entries.has(path)) entries.set(path, { title: `${match[2]} · 玖捌小站`, description: match[3] });
}
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const font = process.env.SOCIAL_FONT ? `@font-face{font-family:ShareFont;src:url('${pathToFileURL(process.env.SOCIAL_FONT).href}')}` : '';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [path, entry] of entries) {
    const key = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
    const slug = path.startsWith('/projects/') ? path.split('/').at(-1) : null;
    const logo = slug ? `projects/${slug}/logo.${slug === 'magidesk' ? 'svg' : slug === 'lyricdrop' ? 'png' : 'ico'}` : 'brand/jiuba-gray-cat-v1.png';
    const colors = slug === 'lyricdrop' ? ['#f9f0fc', '#e9dcfa', '#706198'] : slug === 'audiodeviceswitcher' ? ['#eff7fc', '#d4e9f8', '#376b90'] : ['#f2faf7', '#d4eee4', '#21795e'];
    const title = path === '/' ? '给日常，添一点顺手。' : entry.title.split(' · ')[0];
    const html = `<!doctype html><meta charset="utf-8"><style>${font}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:ShareFont,sans-serif;color:#193b32;background:linear-gradient(125deg,${colors[0]} 30%,${colors[1]})}.orb{position:absolute;right:-190px;top:-150px;width:660px;height:660px;border:1px solid #ffffff90;border-radius:50%;box-shadow:0 0 0 65px #ffffff28,0 0 0 130px #ffffff20}.content{position:absolute;inset:58px 64px;display:flex;flex-direction:column}.brand{font-size:25px;letter-spacing:3px;color:${colors[2]}}.body{flex:1;display:flex;align-items:center;gap:38px}.copy{width:765px}h1{font-size:${title.length > 21 ? 46 : 58}px;line-height:1.3;margin:0 0 26px;overflow-wrap:anywhere;letter-spacing:-1px}p{font-size:27px;line-height:1.8;margin:0;color:#526d65}img{width:210px;height:210px;object-fit:contain;filter:drop-shadow(0 15px 20px #173d3218)}.footer{display:flex;justify-content:space-between;font-size:19px;color:${colors[2]};border-top:1px solid #193b3218;padding-top:22px}</style><div class="orb"></div><div class="content"><div class="brand">玖捌小站 / NINETYEIGHTS</div><div class="body"><div class="copy"><h1>${escape(title)}</h1><p>${escape(entry.description)}</p></div><img src="${pathToFileURL(resolve(root, 'frontend/public', logo)).href}" alt=""></div><div class="footer"><span>${slug ? '软件作品 · 探索与下载' : path.startsWith('/tools') ? '实用工具 · 打开即用' : '发现实用工具，探索软件作品'}</span><span>NINETYEIGHTS</span></div></div>`;
    const temp = resolve(output, '.preview.html');
    await writeFile(temp, html);
    await page.goto(pathToFileURL(temp).href);
    await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) { await img.decode(); } });
    if (await page.locator('.body').evaluate(el => el.scrollHeight > el.clientHeight)) throw new Error(`Card overflow: ${path}`);
    await page.screenshot({ path: resolve(output, `${key}.png`) });
    console.log(`Generated ${key}.png`);
  }
} finally {
  await browser.close();
  const { unlink } = await import('node:fs/promises');
  await unlink(resolve(output, '.preview.html')).catch(() => {});
}
