import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {trackToolSuccess} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

test('tool events send only fixed tool names, including translation and passwords', () => {
  const calls = [];
  globalThis.window = {gtag: (...args) => calls.push(args)};
  try {
    const tools = ['translate','link-extract','text-compare','password','timestamp'];
    tools.forEach(tool => trackToolSuccess(tool));
    assert.deepEqual(calls, tools.map(tool => ['event','tool_success',{tool_name:tool}]));
  } finally { delete globalThis.window; }
});
