import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test, { after } from 'node:test';
import ts from 'typescript';

const directory = mkdtempSync(join(tmpdir(), 'text-diff-'));
after(() => rmSync(directory, { recursive: true, force: true }));
for (const name of ['normalization', 'engine', 'compare']) {
  const source = readFileSync(new URL(`../src/lib/text-diff/${name}.ts`, import.meta.url), 'utf8');
  writeFileSync(join(directory, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'"));
}
const { compare, defaultOptions, MAX_LENGTH, formatResult } = await import(pathToFileURL(join(directory, 'compare.mjs')));
const { normalize } = await import(pathToFileURL(join(directory, 'normalization.mjs')));
const { tokenize } = await import(pathToFileURL(join(directory, 'engine.mjs')));

function invariant(result, left, right) {
  assert.equal(result.operations.map(op => op.leftText).join(''), left);
  assert.equal(result.operations.map(op => op.rightText).join(''), right);
  assert.equal(result.blocks.flat().map(op => op.leftText).join(''), left);
  assert.equal(result.blocks.flat().map(op => op.rightText).join(''), right);
  let l = 0, r = 0;
  for (const op of result.operations) {
    assert.deepEqual(op.leftRange, [l, l + op.leftText.length]);
    assert.deepEqual(op.rightRange, [r, r + op.rightText.length]);
    assert.equal(left.slice(...op.leftRange), op.leftText);
    assert.equal(right.slice(...op.rightRange), op.rightText);
    l += op.leftText.length; r += op.rightText.length;
    if (op.detail) { assert.equal(op.detail.map(p => p.leftText).join(''), op.leftText); assert.equal(op.detail.map(p => p.rightText).join(''), op.rightText); }
  }
  assert.equal(result.differenceCount, Object.values(result.statistics).reduce((a, b) => a + b, 0));
  assert(result.similarity >= 0 && result.similarity <= 100);
}

test('empty, identical, insertion, deletion and replacement have consistent ranges', () => {
  for (const mode of ['auto', 'character', 'word', 'line']) for (const [left, right, type] of [['', '', 'equal'], ['abc', 'abc', 'equal'], ['', 'abc', 'insert'], ['abc', '', 'delete'], ['abc', 'xyz', 'replace']]) {
    const result = compare(left, right, { mode }); invariant(result, left, right);
    assert.equal(result.operations[0].type, type);
    assert.equal(result.identical, left === right);
  }
});

test('Chinese character and English word changes identify the exact content', () => {
  assert.equal(compare('今天下午出发', '今天晚上出发').operations.find(o => o.type === 'replace').leftText, '下午');
  const result = compare('The quick fox', 'The fast fox', { mode: 'word' });
  assert.equal(result.operations.find(o => o.type === 'replace').rightText, 'fast');
  assert.equal(compare('color', 'colour', { mode: 'character' }).operations.find(o => o.type === 'insert').rightText, 'u');
});

test('line mode preserves line endings, trailing newlines and refines modified lines', () => {
  for (const [left, right] of [['a\r\nb\r\n', 'a\r\nc\r\n'], ['a\n', 'a'], ['a\nb\nc', 'a\nNEW\nb\nc'], ['\n\n', '\r\n\r\n']]) invariant(compare(left, right, { mode: 'line' }), left, right);
  const result = compare('今天下午去超市。\n原样\n', '今天晚上去超市。\n原样\n');
  assert.equal(result.mode, 'line');
  assert(result.operations.some(o => o.detail?.some(p => p.type === 'replace' && p.leftText === '下午')));
  assert(!compare('a\r\n', 'a\n').identical);
});

test('each ignore rule is explicit and preserves original text', () => {
  const cases = [
    ['Hello', 'hello', { ignoreCase: true }],
    ['a \t\u00a0b', 'ab', { ignoreSpaces: true }],
    ['a  \tb', 'a b', { collapseSpaces: true }],
    ['a\r\nb\rc\nd\u2028e', 'abcde', { ignoreNewlines: true }],
    [' \n a \t', 'a', { trim: true }],
    ['Hello   WORLD\n', 'hello world', { ignoreCase: true, collapseSpaces: true, trim: true }],
  ];
  for (const [left, right, opts] of cases) {
    assert(!compare(left, right).identical);
    const result = compare(left, right, opts); assert(result.identical); invariant(result, left, right); assert.equal(result.similarity, 100);
  }
  assert(!compare('a\nb', 'ab', { ignoreSpaces: true }).identical);
  assert(!compare('a b', 'ab', { collapseSpaces: true }).identical);
  assert(!compare('a b', 'ab', { ignoreNewlines: true }).identical);
});

test('Unicode graphemes, combining marks and expanded case mappings do not split', () => {
  for (const [left, right] of [['👨‍👩‍👧', '👨‍👩‍👦'], ['👍🏽', '👍🏻'], ['e\u0301', 'e'], ['🇨🇳', '🇺🇸']]) {
    const result = compare(left, right, { mode: 'character' });
    assert.equal(result.operations.length, 1); invariant(result, left, right);
  }
  const mapped = normalize('İ猫😀', { ...defaultOptions, ignoreCase: true });
  const tokens = tokenize(mapped, 'character');
  assert.deepEqual(tokens.map(t => [t.start, t.end]), [[0, 1], [1, 2], [2, 4]]);
  assert(compare('İ', 'i\u0307', { ignoreCase: true }).identical);
});

test('ignored-only strings and surviving differences never drop original whitespace', () => {
  for (const [left, right] of [[' \t', ''], ['', '  x'], [' \tx ', ''], ['a   b c', 'A b d'], ['  ', '\n']]) {
    const result = compare(left, right, { ignoreSpaces: true, ignoreCase: true }); invariant(result, left, right);
  }
});

test('line insertion keeps later anchors together and statistics count change groups', () => {
  const left = 'one\ntwo\nthree\n', right = 'one\nnew\ntwo\nthree\n';
  const result = compare(left, right, { mode: 'line' });
  assert.equal(result.statistics.insert, 1);
  assert(result.blocks.some(b => b.some(o => o.leftText.includes('three\n') && o.rightText.includes('three\n'))));
  assert.match(formatResult(result), /\[\+new\n\+\]/);
});

test('large inputs have bounded work and disclose a coarse comparison', () => {
  const left = 'a'.repeat(6000), right = 'b'.repeat(6000);
  const start = performance.now(); const result = compare(left, right, { mode: 'character' });
  assert(result.coarse); invariant(result, left, right);
  assert(performance.now() - start < 5000);
  const shared = 'x'.repeat(40_000);
  const precise = compare(shared + 'a' + shared, shared + 'b' + shared, { mode: 'character' });
  assert.equal(precise.differenceCount, 1); assert(!precise.coarse);
  assert.throws(() => compare('x'.repeat(MAX_LENGTH + 1), ''), /100,000/);
});

test('seeded property checks preserve both inputs for all modes and ignore combinations', () => {
  let seed = 20260927;
  const random = n => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) % n; };
  const alphabet = ['a', 'A', 'b', '猫', '😀', ' ', '\t', '\n', '\r\n', 'e\u0301', 'İ'];
  const text = () => Array.from({ length: random(25) }, () => alphabet[random(alphabet.length)]).join('');
  for (let i = 0; i < 400; i++) {
    const left = text(), right = text();
    const options = { mode: ['auto', 'character', 'word', 'line'][random(4)], ignoreCase: !!random(2), ignoreSpaces: !!random(2), collapseSpaces: !!random(2), ignoreNewlines: !!random(2), trim: !!random(2) };
    const result = compare(left, right, options);
    invariant(result, left, right);
    assert.equal(result.identical, normalize(left, options).text === normalize(right, options).text);
    const reversed = compare(right, left, options);
    invariant(reversed, right, left);
    assert.equal(result.identical, reversed.identical);
  }
});

// Independent small-string LCS oracle checks optimal alignment, not just reconstruction.
test('character diff matches an independent edit-distance oracle', () => {
  const strings = ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb', 'aba', 'bab', 'aabb'];
  for (const left of strings) for (const right of strings) {
    const dp = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
    for (let i = 1; i <= left.length; i++) for (let j = 1; j <= right.length; j++) dp[i][j] = left[i - 1] === right[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const result = compare(left, right, { mode: 'character' });
    assert.equal(result.operations.filter(o => o.type === 'equal').reduce((sum, o) => sum + o.leftText.length, 0), dp[left.length][right.length]);
  }
});

test('newline-heavy inputs keep display block count bounded', () => {
  const text = '\n'.repeat(MAX_LENGTH);
  const result = compare(text, text);
  assert(result.blocks.length <= 5000);
  invariant(result, text, text);
});
