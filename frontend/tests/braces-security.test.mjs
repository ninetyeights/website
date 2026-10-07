import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const braces = require('braces');
const rejected = (callback) => assert.throws(callback, (error) => error.code === 'ERR_BRACES_COMPLEXITY');

test('braces preserves normal patterns, ranges, quotes, escapes and nesting', () => {
  assert.equal(braces.compile('src/**/*.{ts,tsx}'), 'src/**/*.(ts|tsx)');
  assert.deepEqual(braces.expand('{a,{b,c}}'), ['a', 'b', 'c']);
  assert.deepEqual(braces.expand('{1..3}'), ['1', '2', '3']);
  assert.deepEqual(braces.expand('\\{a,b\\}'), ['{a,b}']);
  assert.deepEqual(braces.expand('"' + '{'.repeat(200) + '"'), ['{'.repeat(200)]);
  assert.equal(braces.stringify(braces.parse('{a,b}')), '{a,b}');
});

test('all public string entry points reject deep braces, parentheses and unclosed blocks', () => {
  for (const pattern of ['{'.repeat(3000) + 'a' + '}'.repeat(3000), '('.repeat(3000) + 'a' + ')'.repeat(3000), '{'.repeat(3000)]) {
    for (const method of [braces, braces.create, braces.parse, braces.compile, braces.expand, braces.stringify]) {
      rejected(() => method(pattern, { maxDepth: Infinity, maxLength: Infinity }));
    }
  }
});

test('direct AST walkers reject deep or cyclic ASTs before recursive traversal', () => {
  let ast = { type: 'text', value: 'a' };
  for (let i = 0; i < 10000; i++) ast = { type: 'root', nodes: [ast] };
  const cyclic = { type: 'root', nodes: [] };
  cyclic.nodes.push(cyclic);
  for (const method of [braces.compile, braces.expand, braces.stringify]) {
    rejected(() => method(ast));
    rejected(() => method(cyclic));
  }
});
