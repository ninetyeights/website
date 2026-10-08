import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function moduleUrl(path, dependency) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8');
  if (dependency) source = source.replace("'./translation'", JSON.stringify(dependency));
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  return 'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64');
}
const { browserTranslationAvailability, translateInBrowser } = await import(moduleUrl('../src/lib/browser-translation.ts', moduleUrl('../src/lib/translation.ts')));
const noOp = () => {};
function setup(translate, createExtra = {}) {
  const state = { calls: [], destroyed: 0 };
  globalThis.window = { isSecureContext: true, Translator: {
    availability: async () => 'available',
    create: async options => {
      options.monitor({ addEventListener: (_, callback) => callback({ loaded: 0.5 }) });
      return { translate: async text => { state.calls.push(text); return translate(text); }, destroy: () => state.destroyed++ };
    }, ...createExtra,
  } };
  return state;
}

test('line-by-line translation and preserves separators, blank lines and indentation', async () => {
  const state = setup(text => ({ hello: '你好', world: '世界', bye: '再见' })[text]);
  try {
    const result = await translateInBrowser('  hello \r\n\r\n\tworld\rbye\n', 'en', new AbortController().signal, noOp, noOp);
    assert.equal(result.translatedText, '  你好 \r\n\r\n\t世界\r再见\n');
    assert.deepEqual(state.calls, ['hello', 'world', 'bye']);
    assert.equal(state.destroyed, 1);
  } finally { delete globalThis.window; }
});

test('long documents are complete, use bounded chunks and never fetch text', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail('must not fetch');
  const state = setup(text => text);
  try {
    const text = '\r\n\t ' + 'hello world\n'.repeat(500) + '😀'.repeat(5000) + '\n\n';
    const result = await translateInBrowser(text, 'en', new AbortController().signal, noOp, noOp);
    assert.equal(result.translatedText, text);
    assert.ok(state.calls.length > 500);
    assert.ok(state.calls.every(text => Array.from(text).length <= 4000 && !/[\r\n]/.test(text)));
  } finally { delete globalThis.window; globalThis.fetch = previousFetch; }
});

test('request errors never expose upstream text', async () => {
  setup(() => { throw new TypeError('PRIVATE_SOURCE'); });
  try {
    await assert.rejects(translateInBrowser('PRIVATE_SOURCE', 'en', new AbortController().signal, noOp, noOp), error => {
      assert.ok(!error.message.includes('PRIVATE_SOURCE'));
      return true;
    });
  } finally { delete globalThis.window; }
});

test('cancel during download disposes late model and never translates', async () => {
  let resolveCreate, destroyed = 0;
  setup(() => assert.fail('cancelled'), { create: () => new Promise(resolve => { resolveCreate = resolve; }) });
  try {
    const controller = new AbortController();
    const pending = translateInBrowser('hello', 'en', controller.signal, noOp, noOp);
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    resolveCreate({ translate: () => assert.fail('cancelled'), destroy: () => destroyed++ });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(destroyed, 1);
  } finally { delete globalThis.window; }
});

test('automatic detection and phase timings still work; Chinese passes through', async () => {
  const pause = () => new Promise(resolve => setTimeout(resolve, 20));
  setup(async () => { await pause(); return '你好'; }, { create: async () => { await pause(); return { translate: async () => { await pause(); return '你好'; }, destroy: noOp }; } });
  window.LanguageDetector = { availability: async () => 'available', create: async () => { await pause(); return { detect: async () => { await pause(); return [{ detectedLanguage: 'en', confidence: 0.99 }]; }, destroy: noOp }; } };
  try {
    assert.equal(await browserTranslationAvailability('auto'), 'available');
    const result = await translateInBrowser('hello', 'auto', new AbortController().signal, noOp, noOp);
    assert.equal(result.detectedSourceLanguage, 'en');
    assert.ok(result.timings.preparationMs >= 30 && result.timings.detectionMs >= 10 && result.timings.translationMs >= 10);
    window.LanguageDetector.create = async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.2 }], destroy: noOp });
    await assert.rejects(translateInBrowser('hi', 'auto', new AbortController().signal, noOp, noOp), /无法可靠识别/);
    const chinese = await translateInBrowser('你好\n世界', 'zh', new AbortController().signal, noOp, noOp);
    assert.equal(chinese.translatedText, '你好\n世界');
  } finally { delete globalThis.window; }
});

test('capability check does not download; missing detector permits manual selection', async () => {
  setup(noOp, { create: () => assert.fail('must not download') });
  try {
    assert.equal(await browserTranslationAvailability('auto'), 'unavailable');
    assert.equal(await browserTranslationAvailability('en'), 'available');
    window.isSecureContext = false;
    assert.equal(await browserTranslationAvailability('en'), 'unavailable');
  } finally { delete globalThis.window; }
});
