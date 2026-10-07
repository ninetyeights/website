import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const compiled = ts.transpileModule(readFileSync(new URL('../src/lib/project-downloads.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { createDownloadResolver } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const release = (repo, names, overrides = {}) => ({ draft: false, prerelease: false, published_at: '2026-10-01T00:00:00Z', assets: names.map(name => ({ name, browser_download_url: `https://github.com/ninetyeights/${repo}/releases/download/v1/${name}` })), ...overrides });

test('matches all supported platforms, skips drafts and permits MagiDesk previews', async () => {
  for (const [project, repo, platform, name] of [
    ['magidesk', 'MagiDesk', 'windows', 'MagiDesk-1-win-x64-Setup-1.exe'],
    ['audiodeviceswitcher', 'AudioDeviceSwitcher', 'windows', 'AudioDeviceSwitcher-Setup-1.exe'],
    ['lyricdrop', 'LyricDrop', 'macos', 'LyricDrop-1.dmg'],
    ['lyricdrop', 'LyricDrop', 'windows', 'LyricDrop-Windows-1-win-x64.zip'],
  ]) {
    const resolver = createDownloadResolver(async () => Response.json([release(repo, [name], { draft: true }), release(repo, [name], { prerelease: project === 'magidesk' })]));
    assert.equal((await resolver(project, platform)).headers.get('Location'), `https://github.com/ninetyeights/${repo}/releases/download/v1/${name}`);
  }
});

test('shares concurrent requests and repository cache across platforms; refreshes after 15 minutes', async () => {
  let calls = 0, time = 1;
  const resolver = createDownloadResolver(async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return Response.json([release('LyricDrop', ['LyricDrop-1.dmg', 'LyricDrop-Windows-1-win-x64.zip'])]); }, () => time);
  await Promise.all([resolver('lyricdrop', 'windows'), resolver('lyricdrop', 'macos')]);
  await resolver('lyricdrop', 'windows');
  assert.equal(calls, 1);
  time += 15 * 60_000;
  await resolver('lyricdrop', 'windows');
  assert.equal(calls, 2);
});

test('failure uses stale cache up to 24 hours, throttles failed lookups, then falls back', async () => {
  let time = 1, calls = 0;
  const resolver = createDownloadResolver(async () => { if (++calls > 1) throw new Error('offline'); return Response.json([release('LyricDrop', ['LyricDrop-1.dmg'])]); }, () => time);
  await resolver('lyricdrop', 'macos');
  time += 16 * 60_000;
  assert.match((await resolver('lyricdrop', 'macos')).headers.get('Location'), /releases\/download/);
  await resolver('lyricdrop', 'macos');
  assert.equal(calls, 2);
  time += 24 * 60 * 60_000;
  assert.equal((await resolver('lyricdrop', 'macos')).headers.get('Location'), 'https://github.com/ninetyeights/LyricDrop/releases');
});

test('fallback for failure, malformed response, absent stable assets and unsafe URL; invalid paths remain 404', async () => {
  for (const response of [new Response('', { status: 403 }), Response.json({}), Response.json([release('LyricDrop', ['LyricDrop-1.dmg'], { prerelease: true })]), Response.json([release('LyricDrop', ['LyricDrop-1.dmg'], { assets: [{ name: 'LyricDrop-1.dmg', browser_download_url: 'https://evil.example/file' }] })])]) {
    const resolver = createDownloadResolver(async () => response);
    assert.equal((await resolver('lyricdrop', 'macos')).headers.get('Location'), 'https://github.com/ninetyeights/LyricDrop/releases');
    assert.equal((await resolver('__proto__', 'macos')).status, 404);
    assert.equal((await resolver('lyricdrop', 'linux')).status, 404);
  }
});
