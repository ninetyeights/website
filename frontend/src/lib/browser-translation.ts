import { splitTranslation } from './translation';

export type BrowserTranslationAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';
export type LocalTranslationTimings = { preparationMs: number; detectionMs: number; translationMs: number };
type DownloadMonitor = { addEventListener(type: 'downloadprogress', listener: (event: { loaded: number }) => void): void };
type LocalTranslator = { translate(text: string, options?: { signal: AbortSignal }): Promise<string>; destroy(): void };
type LocalDetector = { detect(text: string, options?: { signal: AbortSignal }): Promise<{ detectedLanguage: string; confidence: number }[]>; destroy(): void };
type DetectorFactory = {
  availability(): Promise<BrowserTranslationAvailability>;
  create(options: { signal: AbortSignal; monitor(monitor: DownloadMonitor): void }): Promise<LocalDetector>;
};
type TranslatorFactory = {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<BrowserTranslationAvailability>;
  create(options: { sourceLanguage: string; targetLanguage: string; signal: AbortSignal; monitor(monitor: DownloadMonitor): void }): Promise<LocalTranslator>;
};

export const browserSourceLanguages = [
  ['auto', '自动识别'],
  ['en', '英语'], ['ja', '日语'], ['ko', '韩语'], ['fr', '法语'], ['de', '德语'],
  ['es', '西班牙语'], ['ru', '俄语'], ['pt', '葡萄牙语'], ['it', '意大利语'],
  ['ar', '阿拉伯语'], ['bg', '保加利亚语'], ['bn', '孟加拉语'], ['cs', '捷克语'],
  ['da', '丹麦语'], ['el', '希腊语'], ['fi', '芬兰语'], ['he', '希伯来语'],
  ['hi', '印地语'], ['hr', '克罗地亚语'], ['hu', '匈牙利语'], ['id', '印度尼西亚语'],
  ['kn', '卡纳达语'], ['lt', '立陶宛语'], ['mr', '马拉地语'], ['nl', '荷兰语'],
  ['no', '挪威语'], ['pl', '波兰语'], ['ro', '罗马尼亚语'], ['sk', '斯洛伐克语'],
  ['sl', '斯洛文尼亚语'], ['sv', '瑞典语'], ['ta', '泰米尔语'], ['te', '泰卢固语'],
  ['th', '泰语'], ['tr', '土耳其语'], ['uk', '乌克兰语'], ['vi', '越南语'], ['zh-Hant', '繁体中文'],
].map(([value, label]) => ({ value, label }));

/** 只在安全上下文中访问浏览器原生接口，服务端渲染不会触发模型加载。 */
function factory(): TranslatorFactory | undefined {
  if (typeof window === 'undefined' || !window.isSecureContext) return;
  return (window as Window & { Translator?: TranslatorFactory }).Translator;
}

function detectorFactory(): DetectorFactory | undefined {
  if (typeof window === 'undefined' || !window.isSecureContext) return;
  return (window as Window & { LanguageDetector?: DetectorFactory }).LanguageDetector;
}

export async function browserTranslationAvailability(sourceLanguage: string): Promise<BrowserTranslationAvailability> {
  try {
    // 自动模式先检查识别能力；实际语言对需等识别结果出来后才能检查。
    if (sourceLanguage === 'auto') return factory() ? await detectorFactory()?.availability() ?? 'unavailable' : 'unavailable';
    return await factory()?.availability({ sourceLanguage, targetLanguage: 'zh' }) ?? 'unavailable';
  } catch { return 'unavailable'; }
}

/** 立即响应取消；浏览器若在取消后才返回模型实例，仍需释放该实例。 */
function abortable<T>(promise: Promise<T>, signal: AbortSignal, disposeLate?: (value: T) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    let cancelled = false;
    const cancel = () => { cancelled = true; reject(signal.reason); };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    promise.then(value => {
      signal.removeEventListener('abort', cancel);
      if (cancelled) disposeLate?.(value);
      else resolve(value);
    }, error => { signal.removeEventListener('abort', cancel); reject(error); });
  });
}

/** 识别和翻译都在本机执行，失败时不会把正文转交云端。 */
export async function translateInBrowser(
  text: string, sourceLanguage: string, signal: AbortSignal,
  onProgress: (done: number, total: number) => void, onStatus: (status: string) => void,
  onDetected?: (language: string) => void,
) {
  signal.throwIfAborted();
  const api = factory();
  if (!api) throw new Error('当前浏览器或设备不支持本地翻译，请选择其他翻译服务。');
  let translator: LocalTranslator | undefined;
  let detector: LocalDetector | undefined;
  const timings: LocalTranslationTimings = { preparationMs: 0, detectionMs: 0, translationMs: 0 };
  let translating = false;
  let phaseStarted = performance.now();
  const cancel = () => { translator?.destroy(); detector?.destroy(); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (sourceLanguage === 'auto') {
      const detectionApi = detectorFactory();
      if (!detectionApi) throw new Error('当前浏览器不支持自动识别，请手动选择源语言。');
      onStatus('正在准备语言识别模型…');
      detector = await abortable(detectionApi.create({ signal, monitor(monitor) {
        monitor.addEventListener('downloadprogress', event => {
          if (!signal.aborted) onStatus(`正在下载语言识别模型：${Math.round(Math.max(0, Math.min(1, event.loaded)) * 100)}%`);
        });
      } }), signal, late => late.destroy());
      timings.preparationMs += performance.now() - phaseStarted;
      signal.throwIfAborted();
      onStatus('正在自动识别源语言…');
      // 只取识别样本，避免识别超长正文拖慢页面；完整正文仍全部翻译。
      const sample = Array.from(text.trim().slice(0, 16000)).slice(0, 8000).join('');
      phaseStarted = performance.now();
      const candidates = await abortable(detector.detect(sample, { signal }), signal);
      timings.detectionMs += performance.now() - phaseStarted;
      signal.throwIfAborted();
      const best = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
      // 短文本和混合语言可能不可靠，不把低置信度结果当作确定语言。
      if (!best || !Number.isFinite(best.confidence) || best.confidence < 0.5 || !best.detectedLanguage || best.detectedLanguage === 'und') {
        throw new Error('无法可靠识别源语言，请补充文本或手动选择源语言。');
      }
      sourceLanguage = best.detectedLanguage;
      onDetected?.(sourceLanguage);
      detector.destroy(); detector = undefined;
      if (['zh', 'zh-CN', 'zh-Hans'].includes(sourceLanguage)) {
        onProgress(1, 1);
        return { translatedText: text, detectedSourceLanguage: sourceLanguage, provider: 'browser_local' as const, timings };
      }
      phaseStarted = performance.now();
      const available = await abortable(api.availability({ sourceLanguage, targetLanguage: 'zh' }), signal);
      timings.preparationMs += performance.now() - phaseStarted;
      if (available === 'unavailable') throw new Error('识别出的语言暂不支持本地翻译，请手动选择源语言或其他翻译服务。');
    }
    // 再次点击可复用已识别的中文结果，无需创建同语言翻译模型。
    if (['zh', 'zh-CN', 'zh-Hans'].includes(sourceLanguage)) {
      onProgress(1, 1);
      return { translatedText: text, detectedSourceLanguage: sourceLanguage, provider: 'browser_local' as const, timings };
    }
    onStatus('正在准备本地翻译；首次使用可能需要下载语言模型。');
    // 手动模式在点击事件中启动模型；自动识别下载耗时过长时，浏览器可能要求再次点击授权。
    phaseStarted = performance.now();
    translator = await abortable(api.create({
      sourceLanguage, targetLanguage: 'zh', signal,
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', event => {
          if (!signal.aborted) onStatus(`正在下载语言模型：${Math.round(Math.max(0, Math.min(1, event.loaded)) * 100)}%`);
        });
      },
    }), signal, late => late.destroy());
    timings.preparationMs += performance.now() - phaseStarted;
    signal.throwIfAborted();
    // 每行独立翻译，原始换行符、空行和缩进不交给模型处理。
    const parts = text.split(/(\r\n|\r|\n)/);
    const jobs = parts.map((line, index) => ({ line, index })).filter(({ line }) => line.trim());
    let done = 0;
    onStatus('正在本机逐行翻译，文本不会发送至翻译服务。');
    onProgress(0, jobs.length);
    phaseStarted = performance.now();
    translating = true;
    for (const { line, index } of jobs) {
      signal.throwIfAborted();
      // 超长单行分段处理，不合并相邻行，也不限制全文长度。
      const output: string[] = [];
      for (const chunk of splitTranslation(line)) {
        if (chunk.literal) { output.push(chunk.text); continue; }
        const translated = await abortable(translator.translate(chunk.text, { signal }), signal);
        signal.throwIfAborted();
        if (typeof translated !== 'string' || !translated.trim()) throw new Error('浏览器返回空译文或无效结果。');
        // 模型自行增加的换行收拢到当前行，保持原文的行数。
        output.push(translated.trim().replace(/\s*[\r\n]+\s*/g, ' '));
      }
      parts[index] = output.join('');
      onProgress(++done, jobs.length);
    }
    timings.translationMs = performance.now() - phaseStarted;
    return { translatedText: parts.join(''), detectedSourceLanguage: sourceLanguage, provider: 'browser_local' as const, timings };
  } catch (error) {
    if (signal.aborted) throw error;
    // 不展示模型异常正文，避免错误信息包含用户输入。
    if (error instanceof DOMException && error.name === 'NotAllowedError') throw new Error('浏览器未允许使用模型，请再次点击翻译。');
    if (error instanceof DOMException && error.name === 'NotSupportedError') throw new Error('当前设备不支持所选语言对。');
    if (!translating && error instanceof Error && !(error instanceof DOMException)) throw error;
    throw new Error('本地翻译失败，请重试或选择其他翻译服务。');
  } finally {
    signal.removeEventListener('abort', cancel);
    if (!signal.aborted) { translator?.destroy(); detector?.destroy(); }
  }
}
