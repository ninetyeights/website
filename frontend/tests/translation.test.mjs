import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/translation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { splitTranslation, translateDocument } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('Cloud chunks respect line, character and payload budgets without losing text', () => {
  const original = '\r\n\t  ' + 'First\r\n\u3000\n'.repeat(350) + '猫😀'.repeat(7000) + '\r\n\t\n';
  const parts = splitTranslation(original, 'google_cloud');
  assert.equal(parts.map(part => part.text).join(''), original);
  for (const part of parts.filter(part => !part.literal)) {
    assert(part.text.split(/\r\n|\r|\n/).filter(line => line.trim()).length <= 128);
    assert(Array.from(part.text).length <= 5000);
    assert(new URLSearchParams({ q: part.text }).toString().length - 2 <= 60000);
  }
});

test('both providers preserve boundary whitespace as literals', () => {
  for (const provider of ['google_web', 'google_cloud']) {
    const parts = splitTranslation('\n\u3000\t hello \r\n\n', provider);
    assert.deepEqual(parts, [
      { text: '\n\u3000\t ', literal: true },
      { text: 'hello', literal: false },
      { text: ' \r\n\n', literal: true },
    ]);
  }
});

test('many short lines remain batched and reassemble with original whitespace', async () => {
  const original = '\r\n\t ' + Array.from({ length: 260 }, (_, i) => `Line ${i}`).join('\r\n') + '\n\n';
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const { text } = JSON.parse(options.body);
    assert(text.split(/\r\n|\r|\n/).filter(line => line.trim()).length <= 128);
    return Response.json({ translatedText: text, detectedSourceLanguage: 'en', provider: 'google_cloud' });
  };
  try {
    const result = await translateDocument(original, 'google_cloud', new AbortController().signal, () => {});
    assert.equal(result.translatedText, original);
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('experimental transient failure retries only the failed request', async (t) => {
  let calls = 0;
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    if (++calls === 1) return Response.json({}, { status: 409 });
    return Response.json([[['你好', 'hello']], null, 'en']);
  });
  try {
    const result = await translateDocument('hello', 'google_web', new AbortController().signal, () => {});
    assert.equal(result.translatedText, '你好');
    assert.equal(calls, 2);
  } finally { fetchMock.mock.restore(); }
});

test('permanent errors and Cloud rate limits are not automatically retried', async (t) => {
  for (const [provider, status] of [['google_web', 400], ['google_cloud', 429]]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ message: '稍后重试', error: { code: 'translation_rate_limited', retryable: true } }, { status }));
    await assert.rejects(translateDocument('hello', provider, new AbortController().signal, () => {}));
    assert.equal(mock.mock.callCount(), 1);
    mock.mock.restore();
  }
});

test('cancellation during backoff prevents further requests', async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 429 }));
  await assert.rejects(translateDocument('hello', 'google_web', controller.signal, () => {}, () => controller.abort()));
  assert.equal(mock.mock.callCount(), 1);
  mock.mock.restore();
});

test('long Retry-After stops instead of silently retrying early', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 503, headers: { 'Retry-After': '120' } }));
  await assert.rejects(translateDocument('hello', 'google_web', new AbortController().signal, () => {}), /稍后再试/);
  assert.equal(mock.mock.callCount(), 1);
  mock.mock.restore();
});

test('experimental retries stop after three retries', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 503 }));
  await assert.rejects(translateDocument('hello', 'google_web', new AbortController().signal, () => {}), /已重试 3 次/);
  assert.equal(mock.mock.callCount(), 4);
  mock.mock.restore();
});

test('backend chunks respect two concurrent slots and retain source order', async (t) => {
  const original = Array.from({ length: 800 }, (_, i) => `line ${i}`).join('\n');
  let active = 0, maximum = 0;
  const mock = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    maximum = Math.max(maximum, ++active);
    const { text } = JSON.parse(options.body);
    await new Promise(resolve => setTimeout(resolve, text.startsWith('line 0') ? 30 : 1));
    active--;
    return Response.json({ translatedText: text, detectedSourceLanguage: 'en', provider: 'google_cloud' });
  });
  for (const provider of ['google_cloud', 'azure']) {
    maximum = 0;
    const result = await translateDocument(original, provider, new AbortController().signal, () => {});
    assert.equal(result.translatedText, original);
    assert.equal(maximum, 2);
  }
  mock.mock.restore();
});

test('browser-direct Google translation keeps five concurrent chunks', async (t) => {
  const original = 'x'.repeat(30000);
  let active = 0, maximum = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    maximum = Math.max(maximum, ++active);
    const text = new URL(url).searchParams.get('q');
    await new Promise(resolve => setTimeout(resolve, 10));
    active--;
    return Response.json([[[text, text]], null, 'en']);
  });
  const result = await translateDocument(original, 'google_web', new AbortController().signal, () => {});
  assert.equal(result.translatedText, original);
  assert.equal(maximum, 5);
});

test('HTTP failures retain category and status through document error wrapping', async (t) => {
  const cases = [
    [409, 'translation_conflict', true], [429, 'translation_rate_limited', true],
    [401, 'translation_access_denied', false], [403, 'translation_access_denied', false],
    [408, 'translation_timeout', true], [504, 'translation_timeout', true],
    [425, 'translation_not_ready', true], [413, 'translation_payload_too_large', false],
    [414, 'translation_payload_too_large', false], [400, 'translation_invalid_request', false],
    [422, 'translation_invalid_request', false], [404, 'translation_endpoint_unavailable', false],
    [405, 'translation_endpoint_unavailable', false], [410, 'translation_endpoint_unavailable', false],
    [500, 'translation_unavailable', true], [502, 'translation_unavailable', true],
    [503, 'translation_unavailable', true], [501, 'translation_unavailable', false],
    [418, 'translation_http_error', false],
  ];
  for (const [status, code, retryable] of cases) {
    const mock = t.mock.method(globalThis, 'fetch', async () => new Response('private upstream body', { status, headers: { 'Retry-After': '120' } }));
    await assert.rejects(translateDocument('hello', 'google_web', new AbortController().signal, () => {}), error => {
      assert.equal(error.code, code);
      assert.equal(error.status, status);
      assert.equal(error.retryable, retryable);
      assert.match(error.message, new RegExp(`HTTP ${status}`));
      assert(!error.message.includes('private upstream body'));
      return true;
    });
    assert.equal(mock.mock.callCount(), 1);
    mock.mock.restore();
  }
});

test('retry notices explain rate limiting and preserve valid whitespace segments', async (t) => {
  let attempts = 0;
  const notices = [];
  const mock = t.mock.method(globalThis, 'fetch', async () => ++attempts === 1
    ? Response.json({}, { status: 429 })
    : Response.json([[['你好'], ['\n'], ['世界']], null, 'en']));
  const result = await translateDocument('hello world', 'google_web', new AbortController().signal, () => {}, message => notices.push(message));
  assert.match(notices[0], /过于频繁.*HTTP 429/);
  assert.equal(result.translatedText, '你好\n世界');
  mock.mock.restore();
});

test('network, invalid JSON and empty responses have distinct retry notices', async (t) => {
  for (const [firstResponse, expected] of [
    [() => { throw new TypeError('private network detail'); }, /无法连接 Google/],
    [() => new Response('<html>private upstream body</html>'), /返回格式异常/],
    [() => Response.json([[['  ']], null, 'en']), /空译文/],
  ]) {
    let attempts = 0;
    const notices = [];
    const mock = t.mock.method(globalThis, 'fetch', async () => ++attempts === 1 ? firstResponse() : Response.json([[['你好']], null, 'en']));
    await translateDocument('hello', 'google_web', new AbortController().signal, () => {}, message => notices.push(message));
    assert.match(notices[0], expected);
    assert(!notices[0].includes('private'));
    assert.equal(attempts, 2);
    mock.mock.restore();
  }
});

test('Cloud error codes survive wrapping without automatic retry', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({
    message: '请联系管理员', error: { code: 'translation_configuration_error', retryable: false },
  }, { status: 503 }));
  await assert.rejects(translateDocument('hello', 'google_cloud', new AbortController().signal, () => {}), error => {
    assert.equal(error.code, 'translation_configuration_error');
    assert.equal(error.status, 503);
    return true;
  });
  assert.equal(mock.mock.callCount(), 1);
  mock.mock.restore();
});

test('Azure chunks retain whitespace and respect backend budgets', () => {
  const original = '\r\n\t ' + 'Line\r\n \n'.repeat(350) + '猫😀'.repeat(7000) + '\n\n';
  const parts = splitTranslation(original, 'azure');
  assert.equal(parts.map(part => part.text).join(''), original);
  for (const part of parts.filter(part => !part.literal)) {
    assert(Array.from(part.text).length <= 5000);
    assert(part.text.split(/\r\n|\r|\n/).filter(line => line.trim()).length <= 128);
  }
});

test('Azure uses the local API and preserves document order and metadata', async (t) => {
  const original = '\r\n\t ' + Array.from({ length: 260 }, (_, i) => 'Line ' + i).join('\r\n') + '\n\n';
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/tools/translate');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.provider, 'azure');
    return Response.json({ translatedText: body.text, detectedSourceLanguage: 'en', provider: 'azure' });
  });
  try {
    const result = await translateDocument(original, 'azure', new AbortController().signal, () => {});
    assert.equal(result.translatedText, original);
    assert.equal(result.provider, 'azure');
    assert.equal(result.detectedSourceLanguage, 'en');
    assert.equal(mock.mock.callCount(), 3);
  } finally { mock.mock.restore(); }
});

test('Azure errors are not automatically retried and do not fall back to Google', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, '/api/tools/translate');
    return Response.json({ message: '稍后重试', error: { code: 'translation_rate_limited', retryable: true } }, { status: 429 });
  });
  try {
    await assert.rejects(translateDocument('hello', 'azure', new AbortController().signal, () => {}), error => {
      assert.equal(error.code, 'translation_rate_limited');
      assert.equal(error.status, 429);
      return true;
    });
    assert.equal(mock.mock.callCount(), 1);
  } finally { mock.mock.restore(); }
});
