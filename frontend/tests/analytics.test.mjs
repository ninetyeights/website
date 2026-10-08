import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {trackToolSuccess, installGoogleTag} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

test('Google tag queues config and events as Arguments objects', () => {
  const existing = { event: 'existing' };
  const target = { dataLayer: [existing] };
  installGoogleTag(target);
  target.gtag('config', 'G-TEST123');
  target.gtag('event', 'tool_success', { tool_name: 'translate' });
  assert.equal(target.dataLayer[0], existing);
  for (const command of target.dataLayer.slice(1)) {
    assert.equal(Object.prototype.toString.call(command), '[object Arguments]');
    assert.equal(Array.isArray(command), false);
  }
  assert.deepEqual(Array.from(target.dataLayer[1]), ['config', 'G-TEST123']);
  assert.deepEqual(Array.from(target.dataLayer[2]), ['event', 'tool_success', { tool_name: 'translate' }]);
});

test('both CSP policies permit Google Analytics collection endpoints', () => {
  const policy = readFileSync(new URL('../../docker/backend/security-headers.inc', import.meta.url), 'utf8');
  const headers = [...policy.matchAll(/add_header Content-Security-Policy(?:-Report-Only)? "([^"]+)"/g)];
  assert.equal(headers.length, 2);
  for (const [, header] of headers) {
    const connect = header.split(';').find(value => value.trim().startsWith('connect-src ')).trim().split(/\s+/);
    assert.ok(connect.includes('https://analytics.google.com'));
    assert.ok(connect.includes('https://*.google.com'));
    assert.ok(connect.includes('https://*.google-analytics.com'));
    assert.ok(!connect.includes('*'));
  }
});

test('tool events send only fixed tool names, including translation and passwords', () => {
  const calls = [];
  globalThis.window = {gtag: (...args) => calls.push(args)};
  try {
    const tools = ['translate','link-extract','text-compare','password','timestamp'];
    tools.forEach(tool => trackToolSuccess(tool));
    assert.deepEqual(calls, tools.map(tool => ['event','tool_success',{tool_name:tool}]));
  } finally { delete globalThis.window; }
});
