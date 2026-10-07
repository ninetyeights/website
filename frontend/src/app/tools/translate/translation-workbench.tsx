'use client';
import { trackToolSuccess } from '@/lib/analytics';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, Clock3, Copy, Eraser, Languages, Link2, Link2Off, Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { translateDocument } from '@/lib/translation';

type Provider = 'google_web' | 'google_cloud' | 'azure';
type Result = { translatedText: string; detectedSourceLanguage: string | null; provider: Provider; elapsedMs: number };

const providerOptions: { value: Provider; label: string }[] = [
  { value: 'google_web', label: 'Google 翻译' },
  { value: 'google_cloud', label: 'Google Cloud' },
  { value: 'azure', label: '微软 Azure Translator' },
];

const panel = 'surface translation-panel flex h-[30rem] min-w-0 flex-col overflow-hidden lg:h-auto lg:min-h-0';
const panelHeader = 'flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-6';
const actionBar = 'flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-card px-4 py-3 md:px-6';

const subscribeToPlatform = () => () => {};
function shortcutLabel() {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌘ + Enter' : 'Ctrl + Enter';
}
const serverShortcutLabel = () => null;

// The pipeline always targets Simplified Chinese, so the direction is stated as
// plain text in the panel headers rather than as a control nobody can change.
function languageName(code: string | null): string | null {
  if (!code) return null;
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(code)) return code;
  try {
    return new Intl.DisplayNames(['zh-CN'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function TranslationProgress({ done, total, retryStatus }: { done: number; total: number; retryStatus: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((performance.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const percent = total ? Math.round(done / total * 100) : 0;
  return (
    <div className="flex h-full min-h-56 flex-col items-center justify-center px-2 py-4">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 size={28} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      </div>
      <p role="status" className="text-base font-semibold text-foreground">{total ? '正在翻译，请稍候' : '正在准备翻译'}</p>
      <div className="mt-4 w-full max-w-72">
        <div className="mb-2 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
          <span>{total ? `已完成 ${done} / ${total} 段` : '正在整理文本…'}</span>
          <span className="text-2xl font-semibold text-primary tabular-nums">{percent}<span className="ml-0.5 text-sm">%</span></span>
        </div>
        <div role="progressbar" aria-label="翻译进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={total ? percent : undefined}
          aria-valuetext={total ? `已完成 ${done} / ${total} 段` : '正在准备翻译'}
          className="relative h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
        <p aria-live="off" className="mt-3 text-center text-xs text-muted-foreground tabular-nums">已用时 {seconds} 秒</p>
      </div>
      <p role="status" className="mt-4 max-w-sm text-center text-xs leading-5 text-muted-foreground">
        {retryStatus || (done === 0 ? '正在等待首段译文返回，无需重复点击。' : '正在继续处理剩余文本，可以随时取消。')}
      </p>
    </div>
  );
}

export function TranslationWorkbench() {
  const shortcut = useSyncExternalStore(subscribeToPlatform, shortcutLabel, serverShortcutLabel);
  const [text, setText] = useState('');
  const [provider, setProvider] = useState<Provider>('google_web');
  const [providers, setProviders] = useState(() => providerOptions.filter(item => item.value === 'google_web'));
  useEffect(() => {
    const request = new AbortController();
    fetch('/api/tools/translate/providers', { signal: request.signal, cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load translation providers');
        return response.json();
      })
      .then(data => {
        if (!request.signal.aborted && Array.isArray(data?.providers)) {
          setProviders(providerOptions.filter(item => item.value === 'google_web' || data.providers.includes(item.value)));
        }
      })
      .catch(() => {});
    return () => request.abort();
  }, []);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const sourceArea = useRef<HTMLTextAreaElement | null>(null);
  const targetArea = useRef<HTMLDivElement | null>(null);
  const pendingScroll = useRef(new WeakMap<HTMLElement, number>());
  const lastScrolled = useRef<'source' | 'target'>('source');
  function syncFrom(side: 'source' | 'target', force = false) {
    const origin = side === 'source' ? sourceArea.current : targetArea.current;
    const destination = side === 'source' ? targetArea.current : sourceArea.current;
    if (!origin || !destination) return;
    const expected = pendingScroll.current.get(origin);
    pendingScroll.current.delete(origin);
    if (!force && expected !== undefined && Math.abs(origin.scrollTop - expected) < 1) return;
    lastScrolled.current = side;
    if (readingMode || (!syncScroll && !force) || !result) return;
    const range = origin.scrollHeight - origin.clientHeight;
    if (range <= 0) return;
    const top = Math.max(0, Math.min(1, origin.scrollTop / range)) * Math.max(0, destination.scrollHeight - destination.clientHeight);
    if (Math.abs(destination.scrollTop - top) < 1) return;
    destination.scrollTop = top;
    pendingScroll.current.set(destination, destination.scrollTop);
  }
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [retryStatus, setRetryStatus] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const controller = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(() => () => { revision.current++; controller.current?.abort(); }, []);
  useEffect(() => {
    if (!busy) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [busy]);
  function invalidate() {
    revision.current++;
    controller.current?.abort();
    controller.current = null;
    setBusy(false); setResult(null); setError(''); setCopyStatus(''); setRetryStatus('');
  }
  async function translate() {
    if (!text.trim() || controller.current) return;
    const request = new AbortController();
    controller.current = request;
    const current = ++revision.current;
    setBusy(true); setError(''); setResult(null); setCopyStatus(''); setRetryStatus('');
    setProgress({ done: 0, total: 0 });
    const started = performance.now();
    try {
      // Give the browser a chance to show the busy state before splitting long input.
      await new Promise(resolve => setTimeout(resolve, 0));
      request.signal.throwIfAborted();
      const data = await translateDocument(text, provider, request.signal, (done, total) => {
        if (current === revision.current) setProgress({ done, total });
      }, message => { if (current === revision.current) setRetryStatus(message); });
      if (current === revision.current) {
        setResult({ ...data, elapsedMs: performance.now() - started });
        trackToolSuccess('translate');
      }
    } catch (failure) {
      if (current === revision.current) setError(request.signal.aborted ? '请求超时，请稍后重试。' : failure instanceof Error ? failure.message : '连接失败，请稍后重试。');
    } finally {
      if (current === revision.current) { controller.current = null; setBusy(false); }
    }
  }
  async function copy() {
    if (!result) return;
    const current = revision.current;
    try {
      await navigator.clipboard.writeText(result.translatedText);
      if (current === revision.current) setCopyStatus('已复制');
    } catch {
      if (current === revision.current) setCopyStatus('复制失败，请选中译文手动复制。');
    }
  }
  const detected = result && languageName(result.detectedSourceLanguage);
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <div className={`relative grid items-stretch gap-6 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] ${readingMode ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        {!readingMode && <button
          type="button"
          aria-label="同步滚动"
          aria-pressed={syncScroll}
          title={syncScroll ? '同步滚动已开启，点击解除' : '同步滚动已关闭，点击开启'}
          onClick={() => {
            pendingScroll.current = new WeakMap();
            if (!syncScroll) syncFrom(lastScrolled.current, true);
            setSyncScroll(!syncScroll);
          }}
          className={`absolute left-1/2 top-1/2 z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${syncScroll ? 'border-primary/20 bg-secondary text-primary hover:bg-card' : 'border-border bg-card text-muted-foreground hover:bg-secondary'}`}
        >
          {syncScroll ? <Link2 size={16} aria-hidden="true" /> : <Link2Off size={16} aria-hidden="true" />}
        </button>}
        <section data-entrance className={panel} style={readingMode ? { display: 'none' } : undefined}>
          <div className={panelHeader}>
            <label htmlFor="translation-source" className="truncate text-sm font-medium">
              原文<span className="font-normal text-muted-foreground"> · 自动识别语言</span>
            </label>
            <Select
              value={provider}
              onValueChange={value => { invalidate(); setProvider(value as Provider); }}
              items={providers}
            >
              <SelectPrimitive.Label className="sr-only">翻译服务</SelectPrimitive.Label>
              <SelectTrigger
                size="sm"
                className="shrink-0 text-xs text-muted-foreground hover:bg-muted"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false} className="min-w-44">
                {providers.map(item => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <textarea
            ref={sourceArea}
            onScroll={() => syncFrom('source')}
            id="translation-source"
            value={text}
            onChange={event => { invalidate(); setText(event.target.value); }}
            onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); void translate(); } }}
            placeholder="在这里输入或粘贴需要翻译的文本…"
            className="translation-scroll min-h-0 w-full flex-1 resize-none overflow-y-auto bg-transparent p-4 text-base leading-7 outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-primary md:p-6"
          />
          <div className={actionBar}>
            <span className="text-xs text-muted-foreground tabular-nums">
              {busy
                ? progress.total ? `正在翻译 ${progress.done} / ${progress.total} 段` : '正在翻译…'
                : `${Array.from(text).length.toLocaleString()} 字符`}
            </span>
            <div className="flex items-center gap-2">
              {busy && (
                <Button variant="outline" onClick={invalidate}>
                  <X aria-hidden="true" />取消
                </Button>
              )}
              <Button variant="ghost" disabled={!text} onClick={() => { invalidate(); setText(''); }}>
                <Eraser aria-hidden="true" />清空
              </Button>
              <Button className="translation-submit min-w-28" disabled={!text.trim() || busy} onClick={() => void translate()}>
                {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Languages aria-hidden="true" />}
                {busy ? '翻译中…' : '翻译'}
              </Button>
            </div>
          </div>
        </section>
        <section data-entrance aria-busy={busy} className={panel}>
          <div className={panelHeader}>
            <h2 className="truncate text-sm font-medium">
              译文<span className="font-normal text-muted-foreground"> · 简体中文</span>
            </h2>
            <div className="flex min-w-0 items-center gap-2">
              {detected && <span className="hidden truncate text-xs text-muted-foreground sm:block">识别语言：{detected}</span>}
              <Button variant="ghost" size="icon" disabled={!result}
                aria-label={readingMode ? '恢复双栏' : '展开译文'}
                aria-pressed={readingMode}
                title={readingMode ? '恢复双栏' : '展开译文，专注阅读'}
                onClick={() => { pendingScroll.current = new WeakMap(); setReadingMode(!readingMode); }}>
                {readingMode ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
              </Button>
            </div>
          </div>
          <div
            aria-hidden="true"
            className={`h-0.5 shrink-0 bg-secondary ${result ? 'translation-progress-complete' : busy ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${result ? 100 : percent}%` }} />
          </div>
          <div ref={targetArea} onScroll={() => syncFrom('target')} tabIndex={0} role="region" aria-label="译文内容" className="translation-scroll min-h-0 flex-1 overflow-y-auto p-4 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary md:p-6">
            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
            ) : busy ? (
              <TranslationProgress done={progress.done} total={progress.total} retryStatus={retryStatus} />
            ) : result ? (
              <p className="translation-result whitespace-pre-wrap break-words text-base leading-7">{result.translatedText}</p>
            ) : (
              <div role="status" className="tool-empty flex h-full min-h-48 flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                <div className={`translation-symbol flex size-20 items-center justify-center rounded-2xl border border-primary/10 bg-secondary/70 text-primary shadow-sm ${busy ? 'translation-working' : ''}`}><Languages size={32} strokeWidth={1.5} aria-hidden="true" /></div>
                <span>{busy ? '正在翻译…' : '译文会显示在这里'}</span>
                {busy
                  ? retryStatus && <span className="text-xs">{retryStatus}</span>
                  : <span className="text-xs">{shortcut ? `按 ${shortcut} 快速翻译` : '支持键盘快捷翻译'}</span>}
              </div>
            )}
          </div>
          <div className={actionBar}>
            <span role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {result && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock3 size={14} aria-hidden="true" />
                  耗时 {(result.elapsedMs / 1000).toFixed(2)} 秒
                  <Check size={14} className="translation-complete-check text-primary" aria-hidden="true" />
                  <span className="sr-only">翻译完成</span>
                </span>
              )}
              {copyStatus && <span>{copyStatus}</span>}
            </span>
            <Button variant="outline" disabled={!result} onClick={() => void copy()}>
              {copyStatus === '已复制' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              复制译文
            </Button>
          </div>
        </section>
      </div>
      <p data-entrance className="shrink-0 text-xs text-muted-foreground">
        文本将发送至{provider === 'azure' ? '微软 Azure Translator' : 'Google 翻译'}服务处理，本站不保存翻译正文。
      </p>
    </div>
  );
}
