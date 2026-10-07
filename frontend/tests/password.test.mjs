import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const wordsSource = readFileSync(new URL('../src/lib/password-words.ts', import.meta.url), 'utf8').replace('export const', 'const');
const source = readFileSync(new URL('../src/lib/password.ts', import.meta.url), 'utf8').replace("import { PASSWORD_WORDS } from './password-words';", wordsSource);
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { DEFAULT_PASSWORD_OPTIONS: defaults, analyzePasswordOptions: analyze, generatePasswords: generate, randomBelow, WORD_COUNT } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const options = patch => ({ ...defaults, ...patch });

test('unbiased sampler rejects out-of-range draws, accepts boundaries and fails closed', () => {
  let calls = 0;
  assert.equal(randomBelow(10n, bytes => { bytes.fill(calls++ ? 9 : 15); }), 9n);
  assert.equal(calls, 2);
  assert.equal(randomBelow(1n, () => assert.fail()), 0n);
  assert.equal(randomBelow(256n, bytes => bytes.fill(255)), 255n);
  assert.equal(randomBelow(257n, bytes => { bytes.fill(0); bytes[0] = 1; }), 256n);
  assert.throws(() => randomBelow(10n, bytes => bytes.fill(255)), /随机源异常/);
  assert.throws(() => randomBelow(0n, () => {}));
});

test('random passwords satisfy every selected group and exclude confusing characters', () => {
  for (const length of [8, 16, 128]) {
    const results = generate(options({ length, count: 100, excludeConfusing: true, customSymbols: '!?!?' }));
    assert.equal(results.length, 100);
    for (const value of results) {
      assert.equal(value.length, length); assert(!/[0O1lI]/.test(value));
      for (const pattern of [/[A-Z]/, /[a-z]/, /[2-9]/, /[!?]/]) assert(pattern.test(value));
      assert(/^[A-Za-z2-9!?]+$/.test(value));
    }
  }
});

test('conditional random combination count agrees with independent inclusion-exclusion', () => {
  const sizes = [26n, 26n, 10n, 1n];
  let expected = 0n;
  for (let mask = 0; mask < 16; mask++) {
    let omitted = 0, pool = 0n;
    for (let i = 0; i < sizes.length; i++) { if (mask & (1 << i)) omitted++; else pool += sizes[i]; }
    expected += (omitted % 2 ? -1n : 1n) * pool ** 8n;
  }
  assert.equal(analyze(options({ length: 8, customSymbols: '!!!' })).combinations, expected);
  assert.equal(analyze(options({ length: 8, customSymbols: '!', requireAll: false })).combinations, 63n ** 8n);
  assert.equal(analyze(options({ upper: false, lower: false, numbers: false, customSymbols: '!' })).bits, 0);
  assert.deepEqual(generate(options({ upper: false, lower: false, numbers: false, customSymbols: '!', count: 2 })), ['!'.repeat(16), '!'.repeat(16)]);
});

test('PIN constraints and exact combination count agree with exhaustive four-digit enumeration', () => {
  for (const avoidRepeat of [false, true]) for (const avoidSequential of [false, true]) {
    const o = options({ mode: 'pin', pinLength: 4, avoidRepeat, avoidSequential, count: 500 });
    const valid = value => [...value].every((digit, index) => !index || ((!avoidRepeat || digit !== value[index - 1]) && (!avoidSequential || Math.abs(Number(digit) - Number(value[index - 1])) !== 1)));
    let count = 0;
    for (let i = 0; i < 10000; i++) if (valid(String(i).padStart(4, '0'))) count++;
    assert.equal(analyze(o).combinations, BigInt(count));
    for (const value of generate(o)) { assert.match(value, /^\d{4}$/); assert(valid(value)); }
  }
  assert.equal(generate(options({ mode: 'pin' }), bytes => bytes.fill(0))[0], '000000');
});

test('word phrases preserve separators, random case and two-digit suffix including 00', () => {
  for (const separator of ['-', '.', '_', ' ']) {
    const o = options({ mode: 'words', wordCount: 6, separator, capitalize: true, addNumber: true, count: 50 });
    for (const value of generate(o)) {
      assert.match(value, /\d{2}$/);
      const words = value.slice(0, -2).split(separator);
      assert.equal(words.length, 6); assert(words.every(word => /^[A-Za-z][a-z]+$/.test(word)));
    }
    assert.equal(analyze(o).combinations, BigInt(WORD_COUNT) ** 6n * 64n * 100n);
    assert.equal(generate({ ...o, count: 1 }, bytes => bytes.fill(0))[0], Array(6).fill('able').join(separator) + '00');
  }
});

test('invalid and out-of-range options fail rather than clamp or silently weaken rules', () => {
  const invalid = [{ count: 0 }, { count: 501 }, { count: 1.5 }, { count: NaN }, { length: 7 }, { length: 129 }, { length: Infinity }, { upper: false, lower: false, numbers: false, symbols: false }, { customSymbols: '' }, { customSymbols: 'a!' }, { customSymbols: ' !' }, { customSymbols: '💡' }, { mode: 'pin', pinLength: 3 }, { mode: 'words', wordCount: 16 }, { mode: 'words', separator: '' }];
  for (const patch of invalid) { assert(analyze(options(patch)).error); assert.throws(() => generate(options(patch))); }
  assert.equal(analyze(options({ symbols: false, customSymbols: '' })).error, '');
  assert.equal(generate(options({ count: 500 })).length, 500);
});
