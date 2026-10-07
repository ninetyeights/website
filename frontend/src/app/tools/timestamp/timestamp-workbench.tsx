'use client';

import { BatchConverter } from './batch-converter';
import motionStyles from '../tool-motion.module.css';
import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dateFields, formatTimestamp, formatInZone, parseDateString, parseZonedDate, zonedPreset, parseTimestamp, relativeTime, type DateFields, type Preset, type TimestampUnit } from '@/lib/timestamp';

const zoneOptions = [{ value: 'local', label: '本地时区' }, { value: 'UTC', label: 'UTC' }, { value: 'Asia/Shanghai', label: '北京 · Asia/Shanghai' }, { value: 'Asia/Tokyo', label: '东京 · Asia/Tokyo' }, { value: 'Asia/Kolkata', label: '印度 · Asia/Kolkata' }, { value: 'Europe/London', label: '伦敦 · Europe/London' }, { value: 'Europe/Berlin', label: '柏林 · Europe/Berlin' }, { value: 'America/New_York', label: '纽约 · America/New_York' }, { value: 'America/Los_Angeles', label: '洛杉矶 · America/Los_Angeles' }, { value: 'Australia/Sydney', label: '悉尼 · Australia/Sydney' }];

const unitOptions = [{ value: 'auto', label: '自动识别' }, { value: 'seconds', label: '秒' }, { value: 'milliseconds', label: '毫秒' }];

type Row = { label: string; value: string; id: string };
const presets: [Preset, string][] = [['now', '现在'], ['todayStart', '今天 00:00'], ['todayEnd', '今天 23:59'], ['tomorrow', '明天'], ['yesterday', '昨天'], ['monday', '本周一']];
const fields: [keyof DateFields, string, number, number][] = [['year', '年', 1, 9999], ['month', '月', 1, 12], ['day', '日', 1, 31], ['hour', '时', 0, 23], ['minute', '分', 0, 59], ['second', '秒', 0, 59], ['millisecond', '毫秒', 0, 999]];

export function TimestampWorkbench() {
  // Initialize browser-local time only after hydration; server timezone must not leak into inputs.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, []);
  return ready ? <Workbench /> : <p data-entrance-pending role="status" className="surface p-6 text-sm text-muted-foreground">正在读取本地时间…</p>;
}

function Workbench() {
  const [tab, setTab] = useState<'toDate' | 'toTimestamp'>('toDate');
  const [input, setInput] = useState('');
  const [zone, setZone] = useState('local');
  const [entry, setEntry] = useState<'fields' | 'paste'>('fields');
  const [dateInput, setDateInput] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>('auto');
  const [date, setDate] = useState<DateFields>(() => dateFields(new Date()));
  const [copied, setCopied] = useState(''), [notice, setNotice] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copySequence = useRef(0);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => () => { copySequence.current++; if (timeout.current) clearTimeout(timeout.current); }, []);

  async function copy(value: string, id: string, label: string) {
    const sequence = ++copySequence.current;
    if (timeout.current) clearTimeout(timeout.current);
    setCopied(''); setNotice('');
    try {
      await navigator.clipboard.writeText(value);
      if (sequence !== copySequence.current) return;
      setCopied(id); setNotice(`${label}已复制`);
      timeout.current = setTimeout(() => { setCopied(''); setNotice(''); }, 1500);
    } catch { if (sequence === copySequence.current) setNotice('复制失败，请选中结果后手动复制。'); }
  }
  const parsed = input.trim() ? parseTimestamp(input, unit) : null;
  const ts = parsed?.value ? formatInZone(parsed.value.milliseconds, zone) : null;
  const pasted = entry === 'paste' && dateInput.trim() ? parseDateString(dateInput, zone) : null;
  const dt = entry === 'fields' ? parseZonedDate(date, zone) : pasted?.value ? { value: pasted.value.milliseconds } : { value: undefined, error: pasted?.error };
  const dtResult = dt.value !== undefined ? formatTimestamp(dt.value) : null;
  const rows: Row[] = ts ? [
    { id: 'local', label: zone === 'local' ? '本地时间' : '所选时区时间', value: ts.local }, { id: 'iso', label: 'ISO 8601', value: ts.iso },
    { id: 'utc', label: 'UTC', value: ts.utc }, { id: 'rfc', label: 'RFC 2822', value: ts.rfc2822 },
    { id: 'weekday', label: '星期', value: ts.weekday }, { id: 'day', label: '年中天数', value: `第 ${ts.dayOfYear} 天` },
    { id: 'week', label: '年中周数', value: `${ts.weekYear} 年第 ${ts.week} 周（ISO）` }, { id: 'offset', label: '时区偏移', value: ts.timezone },
    { id: 'seconds', label: '秒时间戳', value: ts.seconds }, { id: 'milliseconds', label: '毫秒时间戳', value: ts.milliseconds },
  ] : [];
  const dateRows: Row[] = dtResult ? [
    { id: 'seconds', label: '秒时间戳', value: dtResult.seconds }, { id: 'milliseconds', label: '毫秒时间戳', value: dtResult.milliseconds },
    { id: 'iso', label: 'ISO 8601', value: dtResult.iso }, { id: 'utc', label: 'UTC', value: dtResult.utc },
  ] : [];

  return <div className="space-y-6">
    <section data-entrance aria-labelledby="current-time" className={`${motionStyles.primary} surface bg-linear-to-br from-card to-secondary/60 p-5 md:p-6`}>
      <LiveClock copied={copied} onCopy={copy} />
    </section>
    <div data-entrance className={`${motionStyles.controls} ${motionStyles.tabs} w-fit max-w-full bg-secondary p-1`} role="tablist" aria-label="转换方向">
      <span className={motionStyles.tabIndicator} data-second={tab === 'toTimestamp'} aria-hidden="true" />
      {(['toDate', 'toTimestamp'] as const).map((value, index) => <button key={value} id={`tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1} className={`${motionStyles.tab} min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary ${tab === value ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} onClick={() => setTab(value)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 'toDate' : event.key === 'End' ? 'toTimestamp' : index === 0 ? 'toTimestamp' : 'toDate';
        setTab(next); document.getElementById(`tab-${next}`)?.focus();
      }}>{value === 'toDate' ? '时间戳 → 日期' : '日期 → 时间戳'}</button>)}
    </div>
    <section data-entrance key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className={`${motionStyles.panel} surface space-y-5 p-5 md:p-6`}>
      <div><h2 className="text-lg font-semibold">{tab === 'toDate' ? '时间戳转日期' : '日期转时间戳'}</h2><p className="mt-1 text-xs text-muted-foreground">转换时区：{zone === 'local' ? timezone : zone}。ISO 8601 与 UTC 结果使用世界协调时。</p></div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor="conversion-zone">转换时区</label>
        <Select value={zone} items={zoneOptions} onValueChange={value => { if (value) setZone(value); }}>
          <SelectTrigger id="conversion-zone" className="max-w-full min-w-52"><SelectValue /></SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>{zoneOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">无时区日期按此解析；切换时区保留输入内容。</span>
      </div>
      {tab === 'toDate' ? <>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-[1_1_16rem] text-sm">时间戳<input className="field mt-2 font-mono" type="text" spellCheck={false} value={input} placeholder="输入秒或毫秒时间戳…" aria-invalid={!!parsed?.error} aria-describedby={parsed?.error ? 'timestamp-error' : 'timestamp-unit-hint'} onChange={event => setInput(event.target.value)} /></label>
          <div className="flex flex-col gap-2 text-sm">
            <label htmlFor="timestamp-unit">输入单位</label>
            <Select value={unit} items={unitOptions} onValueChange={value => { if (value) setUnit(value as TimestampUnit); }}>
              <SelectTrigger id="timestamp-unit" className="min-w-36"><SelectValue /></SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {unitOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={() => setInput(String(unit === 'milliseconds' ? Date.now() : Math.floor(Date.now() / 1000)))}>现在</Button>
        </div>
        <p id="timestamp-unit-hint" className="text-xs text-muted-foreground">自动识别：整数部分不超过 10 位按秒，其余按毫秒；有歧义时可手动选择单位。秒结果向下取整，毫秒结果保留完整精度。</p>
        {parsed?.error && <p id="timestamp-error" role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{parsed.error}</p>}
        {ts && parsed?.value && <div className="space-y-2"><p className="text-xs text-primary">当前按{parsed.value.unit === 'seconds' ? '秒' : '毫秒'}转换</p><ResultRows rows={rows} prefix="ts" copied={copied} onCopy={copy} /><RelativeRow milliseconds={parsed.value.milliseconds} copied={copied} onCopy={copy} /></div>}
        {!input.trim() && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">输入时间戳后自动转换，也可以点击「现在」试试。</p>}
      </> : <>
        <div className="flex flex-wrap gap-2">{presets.map(([value, label]) => <Button key={value} variant="outline" size="sm" onClick={() => { setDate(zonedPreset(value, Date.now(), zone)); setEntry('fields'); }}>{label}</Button>)}</div>
        <div className="flex gap-2" role="group" aria-label="日期输入方式">
          <Button size="sm" variant={entry === 'fields' ? 'secondary' : 'ghost'} aria-pressed={entry === 'fields'} onClick={() => setEntry('fields')}>分项填写</Button>
          <Button size="sm" variant={entry === 'paste' ? 'secondary' : 'ghost'} aria-pressed={entry === 'paste'} onClick={() => setEntry('paste')}>直接粘贴</Button>
        </div>
        {entry === 'paste' ? <div className="space-y-2">
          <label className="text-sm">日期字符串<input className="field mt-2 font-mono" value={dateInput} spellCheck={false} placeholder="2026-09-27 15:30:00 或 2026-09-27T15:30:00+08:00" onChange={event => setDateInput(event.target.value)} aria-invalid={!!pasted?.error} aria-describedby="date-string-help" /></label>
          <p id="date-string-help" className="text-xs text-muted-foreground">支持 YYYY-MM-DD、日期加时分秒及 ISO 8601。自带 Z 或时区偏移时优先使用，不受所选时区影响。</p>
          {pasted?.value && <p className="text-xs text-primary">解析依据：{pasted.value.source}</p>}
        </div> : <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">{fields.map(([key, label, min, max]) => <label key={key} className="min-w-0 text-center text-xs text-muted-foreground">{label}<input className="field mt-2 text-center font-mono" type="number" min={min} max={max} step={1} value={date[key]} onChange={event => setDate({ ...date, [key]: event.target.value })} /></label>)}</div>}
        <p className="text-xs text-muted-foreground">今天结束为 23:59:59.999；本周从周一开始。夏令时结束造成时间重复时，采用较早的一次。</p>
        {dt.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{dt.error}</p>}
        {dtResult && <ResultRows rows={dateRows} prefix="dt" copied={copied} onCopy={copy} />}
      </>}
    </section>
    <BatchConverter zone={zone} onCopy={copy} />
    <p role="status" aria-live="polite" className="min-h-5 text-sm text-primary">{notice}</p>
    <p data-entrance className="text-center text-xs text-muted-foreground">纯客户端处理 · 数据不会上传到服务器</p>
  </div>;
}

type CopyProps = { copied: string; onCopy: (value: string, id: string, label: string) => Promise<void> };
function ResultRows({ rows, prefix, copied, onCopy }: CopyProps & { rows: Row[]; prefix: string }) {
  return <dl className={`${prefix === 'clock' ? '' : motionStyles.result} overflow-hidden rounded-xl border`}>{rows.map(row => <div key={row.id} data-result={`${prefix}-${row.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b px-3 py-3 last:border-b-0 odd:bg-secondary/30 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
    <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
    <dd className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1"><code className="select-all whitespace-pre-wrap break-all font-mono text-[13px] tabular-nums">{row.value}</code></dd>
    <div className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1"><Button variant="ghost" size="sm" aria-label={`复制${prefix === 'clock' ? '当前' : ''}${row.label}`} onClick={() => onCopy(row.value, `${prefix}-${row.id}`, row.label)}>{copied === `${prefix}-${row.id}` ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied === `${prefix}-${row.id}` ? '已复制' : '复制'}</Button></div>
  </div>)}</dl>;
}

function useClock(interval: number, paused = false) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (paused) return; const timer = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(timer); }, [interval, paused]);
  return now;
}
function LiveClock(props: CopyProps) {
  const [paused, setPaused] = useState(false);
  const now = useClock(50, paused);
  const time = formatTimestamp(now);
  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 id="current-time" className="flex items-center gap-2 font-semibold text-primary"><Clock3 size={18} aria-hidden="true" />当前时间{paused && <span className="text-xs font-normal text-muted-foreground">（已暂停）</span>}</h2>
      <Button size="sm" variant="outline" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? '继续时钟' : '暂停时钟'}</Button>
    </div>
    <ResultRows {...props} prefix="clock" rows={[{ id: 'seconds', label: 'Unix 秒', value: time.seconds }, { id: 'milliseconds', label: 'Unix 毫秒', value: time.milliseconds }, { id: 'iso', label: 'ISO 8601', value: time.iso }, { id: 'local', label: '本地时间', value: time.local }]} />
  </>;
}
function RelativeRow({ milliseconds, ...props }: CopyProps & { milliseconds: number }) {
  const now = useClock(1000);
  return <ResultRows {...props} prefix="ts" rows={[{ id: 'relative', label: '相对时间', value: relativeTime(milliseconds, now) }]} />;
}
