export type TranslationProvider = 'google_web' | 'google_cloud' | 'azure';
export type TranslationResult = { translatedText: string; detectedSourceLanguage: string | null; provider: TranslationProvider };

// Keep encoded GET requests below common 8 KB URL limits; batch short lines together.
export function splitTranslation(text: string, provider: TranslationProvider = 'google_web'): { text: string; literal: boolean }[] {
  const byteLimit = provider !== 'google_web' ? 60000 : 7000;
  const characterLimit = provider !== 'google_web' ? 5000 : 4000;
  const parts: { text: string; literal: boolean }[] = [];
  let chunk = '';
  let bytes = 0;
  let characters = 0;
  let lines = 0;
  const encodedSize = (value: string) => new URLSearchParams({ q: value }).toString().length - 2;
  function flush() {
    if (!chunk) return;
    const leading = chunk.match(/^\s+/u)?.[0] || '';
    const remainder = chunk.slice(leading.length);
    const trailing = remainder.match(/\s+$/u)?.[0] || '';
    const body = remainder.slice(0, remainder.length - trailing.length);
    if (leading) parts.push({ text: leading, literal: true });
    if (body) parts.push({ text: body, literal: false });
    if (trailing) parts.push({ text: trailing, literal: true });
    chunk = ''; bytes = 0; characters = 0; lines = 0;
  }
  for (const line of text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) || []) {
    if (!line) continue;
    const size = encodedSize(line);
    const count = Array.from(line).length;
    if (provider !== 'google_web' && line.trim() && lines >= 128) flush();
    if (size <= byteLimit && count <= characterLimit) {
      if (bytes + size > byteLimit || characters + count > characterLimit) flush();
      chunk += line; bytes += size; characters += count;
      if (line.trim()) lines++;
    } else {
      flush();
      for (const character of line) {
        const size = encodedSize(character);
        if (bytes + size > byteLimit || characters >= characterLimit) flush();
        chunk += character; bytes += size; characters++;
        if (character.trim()) lines = 1;
      }
    }
  }
  flush();
  return parts;
}

export class TranslationFailure extends Error {
  constructor(message: string, public retryable = false, public retryAfter = 0, public code = 'translation_unknown', public status: number | null = null) {
    super(message);
    this.name = 'TranslationFailure';
  }
  withMessage(message: string): TranslationFailure {
    return new TranslationFailure(message, this.retryable, this.retryAfter, this.code, this.status);
  }
}

function webHttpFailure(response: Response): TranslationFailure {
  const status = response.status;
  const retryable = [408, 409, 425, 429, 500, 502, 503, 504].includes(status);
  let code = 'translation_http_error';
  let message = '翻译请求未成功，请稍后重试或切换服务。';
  if (status === 409) { code = 'translation_conflict'; message = '翻译请求发生冲突，请稍后重试。'; }
  else if (status === 429) { code = 'translation_rate_limited'; message = '翻译请求过于频繁，请稍后重试或切换服务。'; }
  else if (status === 401 || status === 403) { code = 'translation_access_denied'; message = 'Google 拒绝了本次访问，请切换翻译服务。'; }
  else if (status === 408 || status === 504) { code = 'translation_timeout'; message = '上游翻译请求超时，请稍后重试。'; }
  else if (status === 425) { code = 'translation_not_ready'; message = '翻译服务暂未接受本次请求，请稍后重试。'; }
  else if (status === 413 || status === 414) { code = 'translation_payload_too_large'; message = '本段文本超过上游请求长度限制，请缩短文本后重试。'; }
  else if (status === 400 || status === 422) { code = 'translation_invalid_request'; message = '翻译服务无法处理本次请求，请检查文本或切换服务。'; }
  else if (status === 404 || status === 405 || status === 410) { code = 'translation_endpoint_unavailable'; message = '当前翻译接口不可用，请切换服务。'; }
  else if (status >= 500) { code = 'translation_unavailable'; message = 'Google 翻译服务暂时出现故障，请稍后重试。'; }
  return new TranslationFailure(`${message}（HTTP ${status}）`, retryable, retryDelay(response.headers.get('Retry-After')), code, status);
}

function retryDelay(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value.trim())) return Number(value) * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? 0 : Math.max(0, date - Date.now());
}

function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

async function requestTranslation(text: string, provider: TranslationProvider, signal: AbortSignal): Promise<TranslationResult> {
  // One Cloud chunk is one upstream call (25s); allow 10s for transit and app work.
  const timeout = AbortSignal.timeout(35000);
  const combined = AbortSignal.any([signal, timeout]);
  try {
    const params = new URLSearchParams({ client: 'gtx', sl: 'auto', tl: 'zh-CN', dt: 't', q: text });
    const response = provider === 'google_web'
      ? await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, { signal: combined, credentials: 'omit', referrerPolicy: 'no-referrer' })
      : await fetch('/api/tools/translate', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ text, provider }), signal: combined });
    if (!response.ok && provider === 'google_web') throw webHttpFailure(response);
    const data = await response.json().catch(() => null);
    combined.throwIfAborted();
    if (!response.ok) throw new TranslationFailure(
      typeof data?.message === 'string' ? data.message : '翻译请求失败，请稍后重试。',
      false, retryDelay(response.headers.get('Retry-After')),
      typeof data?.error?.code === 'string' ? data.error.code : 'translation_http_error', response.status,
    );
    if (provider !== 'google_web') {
      if (typeof data?.translatedText !== 'string' || !data.translatedText.trim()) throw new TranslationFailure('译文格式异常，请重试。', false, 0, 'translation_invalid_response', response.status);
      return data;
    }
    if (!Array.isArray(data?.[0]) || !data[0].length || !data[0].every((part: unknown) => Array.isArray(part) && typeof part[0] === 'string')) throw new TranslationFailure('翻译服务返回格式异常，请稍后重试或切换服务。', true, 0, 'translation_invalid_response', response.status);
    const translatedText = data[0].map((part: string[]) => part[0]).join('');
    if (!translatedText.trim()) throw new TranslationFailure('翻译服务返回了空译文，请稍后重试或切换服务。', true, 0, 'translation_empty_response', response.status);
    return { translatedText, detectedSourceLanguage: typeof data[2] === 'string' ? data[2] : null, provider };
  } catch (error) {
    if (signal.aborted) throw error;
    if (timeout.aborted) throw new TranslationFailure('分段请求超时，请稍后重试。', provider === 'google_web', 0, 'translation_timeout');
    if (error instanceof TypeError) throw new TranslationFailure(provider === 'google_web' ? '无法连接 Google 翻译，请检查网络或切换服务。' : '无法连接本站翻译服务，请稍后重试。', provider === 'google_web', 0, 'translation_network_error');
    throw error;
  }
}

export async function translateDocument(text: string, provider: TranslationProvider, signal: AbortSignal, onProgress: (done: number, total: number) => void, onRetry?: (message: string) => void): Promise<TranslationResult> {
  const parts = splitTranslation(text, provider);
  const output = parts.map(part => part.literal ? part.text : '');
  const jobs = parts.map((part, index) => ({ ...part, index })).filter(part => !part.literal);
  const languages = new Set<string>();
  const stop = new AbortController();
  const combined = AbortSignal.any([signal, stop.signal]);
  let next = 0; let done = 0;
  let pauseUntil = 0;
  async function translatePart(text: string, number: number): Promise<TranslationResult> {
    for (let attempt = 0; ; attempt++) {
      combined.throwIfAborted();
      while (pauseUntil > Date.now()) await waitForRetry(Math.min(pauseUntil - Date.now(), 60000), combined);
      try { return await requestTranslation(text, provider, combined); }
      catch (error) {
        if (combined.aborted || !(error instanceof TranslationFailure) || !error.retryable) throw error;
        if (attempt >= 3) throw error.withMessage(`已重试 3 次仍未成功。${error.message}`);
        if (error.retryAfter > 60000) throw error.withMessage(`${error.message} 上游要求等待超过一分钟，已停止自动重试，请稍后再试。`);
        const delay = Math.max(error.retryAfter, 1000 * 2 ** attempt + Math.random() * 500);
        pauseUntil = Math.max(pauseUntil, Date.now() + delay);
        onRetry?.(`第 ${number} 段：${error.message} ${Math.ceil(delay / 1000)} 秒后重试（${attempt + 1}/3）`);
      }
    }
  }
  onProgress(0, jobs.length);
  async function worker() {
    while (next < jobs.length) {
      combined.throwIfAborted();
      const job = jobs[next++];
      try {
        const result = await translatePart(job.text, jobs.indexOf(job) + 1);
        combined.throwIfAborted();
        output[job.index] = result.translatedText;
        if (result.detectedSourceLanguage) languages.add(result.detectedSourceLanguage);
        onProgress(++done, jobs.length);
      } catch (error) {
        if (!combined.aborted) {
          stop.abort();
          const message = `第 ${jobs.indexOf(job) + 1}/${jobs.length} 段翻译失败：${error instanceof Error ? error.message : '请求失败'}`;
          throw error instanceof TranslationFailure ? error.withMessage(message) : new Error(message);
        }
        throw error;
      }
    }
  }
  const concurrency = provider === 'google_web' ? 5 : 2;
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return { translatedText: output.join(''), detectedSourceLanguage: languages.size > 1 ? '多种语言' : [...languages][0] || null, provider };
}
