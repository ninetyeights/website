'use client';
import { trackToolSuccess } from '@/lib/analytics';

import { useEffect, useRef, useState, type Ref } from 'react';
import { ArrowDown, ArrowUp, ArrowLeftRight, Copy, ScanText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { defaultOptions, formatResult, MAX_LENGTH, type CompareOptions, type CompareResult, type Mode, type Operation } from '@/lib/text-diff/compare';
import styles from './compare.module.css';
import motionStyles from '../tool-motion.module.css';

const modeNames = { auto: '自动', character: '字符', word: '单词', line: '行' };
const modeOptions = Object.entries(modeNames).map(([value, label]) => ({ value, label }));
const ignores = [
  ['ignoreCase', '忽略大小写', '按 Unicode 小写形式比较'],
  ['ignoreSpaces', '忽略空格', '忽略空格、制表符等横向空白，保留换行'],
  ['collapseSpaces', '忽略多余空格', '连续横向空白视为一个空格'],
  ['ignoreNewlines', '忽略换行', '移除换行后比较，不额外插入空格'],
  ['trim', '忽略首尾空白', '忽略整段文本开头和结尾的空白'],
] as const;
type View = 'split' | 'inline';

export function CompareWorkbench() {
  const [left, setLeft] = useState(''), [right, setRight] = useState('');
  const [options, setOptions] = useState<CompareOptions>(defaultOptions);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [active, setActive] = useState(0), [view, setView] = useState<View>('split');
  const [sync, setSync] = useState(true);
  const worker = useRef<Worker | null>(null);
  const panelLeft = useRef<HTMLDivElement>(null), panelRight = useRef<HTMLDivElement>(null);
  const resultRoot = useRef<HTMLDivElement>(null);
  const lastScrolled = useRef<'left' | 'right'>('left');
  const scrollFrame = useRef<number | null>(null);
  const scrolling = useRef(false);
  const copySequence = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { copySequence.current++; if (copyTimer.current) clearTimeout(copyTimer.current); worker.current?.terminate(); if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current); }, []);

  // Measure natural block content, then apply the same row height to both sides.
  // Synchronized offsets now represent aligned diff anchors, even after insertions.
  useEffect(() => {
    if (!result || view !== 'split') return;
    const root = resultRoot.current;
    if (!root) return;
    const align = () => {
      const a = panelLeft.current?.querySelectorAll<HTMLElement>('[data-block]');
      const b = panelRight.current?.querySelectorAll<HTMLElement>('[data-block]');
      a?.forEach((row, i) => {
        const other = b?.[i];
        if (!other) return;
        const height = Math.max(row.firstElementChild!.getBoundingClientRect().height, other.firstElementChild!.getBoundingClientRect().height);
        row.style.minHeight = other.style.minHeight = `${Math.ceil(height) + 1}px`;
      });
    };
    const observer = new ResizeObserver(align);
    root.querySelectorAll('[data-content]').forEach(node => observer.observe(node));
    align();
    return () => observer.disconnect();
  }, [result, view]);

  function invalidate() {
    copySequence.current++;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    worker.current?.terminate(); worker.current = null;
    setBusy(false); setResult(null); setActive(0); setNotice('');
  }
  function runCompare() {
    invalidate();
    if (left.length > MAX_LENGTH || right.length > MAX_LENGTH) { setNotice('每侧最多支持 100,000 个字符，请分段比较。'); return; }
    setBusy(true);
    try {
      const task = new Worker(new URL('../../../lib/text-diff/compare.worker.ts', import.meta.url));
      worker.current = task;
      task.onmessage = (event: MessageEvent<{ result?: CompareResult; error?: string }>) => {
        if (worker.current !== task) return;
        if (event.data.result) { setResult(event.data.result); trackToolSuccess('text-compare'); }
        else setNotice(event.data.error || '比较失败，请重试。');
        setBusy(false); task.terminate(); worker.current = null;
      };
      task.onerror = () => {
        if (worker.current !== task) return;
        setNotice('比较未能完成，请重试或缩短文本。'); setBusy(false); task.terminate(); worker.current = null;
      };
      task.postMessage({ left, right, options });
    } catch { setBusy(false); setNotice('浏览器无法启动本地比较，请刷新后重试。'); }
  }
  async function copy(text: string, label: string) {
    if (!text) return;
    const request = ++copySequence.current;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(text);
      if (request !== copySequence.current) return;
      setNotice(`${label}已复制`);
      copyTimer.current = setTimeout(() => { if (request === copySequence.current) setNotice(''); }, 2000);
    } catch { if (request === copySequence.current) setNotice('复制失败，请选中文本后手动复制。'); }
  }
  function navigate(delta: number) {
    if (!result?.differenceCount) return;
    const next = (active + delta + result.differenceCount) % result.differenceCount;
    setActive(next);
    resultRoot.current?.querySelectorAll<HTMLElement>(`[data-difference="${next}"]`).forEach(el => {
      const panel = el.closest<HTMLElement>('[data-panel]');
      if (panel) panel.scrollTop += el.getBoundingClientRect().top - panel.getBoundingClientRect().top - 28;
    });
  }
  function syncScroll(side: 'left' | 'right') {
    if (scrolling.current) return;
    lastScrolled.current = side;
    if (!sync) return;
    const from = side === 'left' ? panelLeft.current : panelRight.current;
    const to = side === 'left' ? panelRight.current : panelLeft.current;
    if (!from || !to || Math.abs(from.scrollTop - to.scrollTop) < 1) return;
    scrolling.current = true;
    to.scrollTop = from.scrollTop;
    scrollFrame.current = requestAnimationFrame(() => { scrolling.current = false; });
  }

  return <div className="space-y-5">
    <section data-entrance className={`${motionStyles.primary} surface overflow-hidden`} aria-label="输入文本">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <p className="text-sm font-medium">粘贴两段文字，找出不同</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={!left && !right} onClick={() => { invalidate(); setLeft(right); setRight(left); }}><ArrowLeftRight size={15} />交换</Button>
          <Button variant="ghost" size="sm" disabled={!left && !right} onClick={() => { invalidate(); setLeft(''); setRight(''); }}><Trash2 size={15} />清空</Button>
        </div>
      </div>
      <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
        {(['left', 'right'] as const).map(side => <div key={side} className="min-w-0 p-5">
          <div className="mb-3 flex items-center justify-between"><label htmlFor={`compare-${side}`} className="text-sm font-medium">{side === 'left' ? '原始文本' : '对比文本'}</label><Button size="sm" variant="ghost" disabled={!(side === 'left' ? left : right)} aria-label={`复制${side === 'left' ? '原始文本' : '对比文本'}`} onClick={() => copy(side === 'left' ? left : right, side === 'left' ? '原始文本' : '对比文本')}><Copy size={14} />复制</Button></div>
          <textarea id={`compare-${side}`} className={`${styles.input} field`} spellCheck={false} value={side === 'left' ? left : right} placeholder={side === 'left' ? '在这里粘贴原始内容…' : '在这里粘贴修改后的内容…'} onChange={event => { invalidate(); (side === 'left' ? setLeft : setRight)(event.target.value); }} />
          <p className={`mt-2 text-right text-xs ${(side === 'left' ? left : right).length > MAX_LENGTH ? 'text-red-700' : 'text-muted-foreground'}`}>{(side === 'left' ? left : right).length.toLocaleString()} / 100,000 字符</p>
        </div>)}
      </div>
      <div className="space-y-4 border-t bg-secondary/25 p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="compare-mode">对比粒度</label>
            <Select value={options.mode} items={modeOptions} onValueChange={value => { if (value) { invalidate(); setOptions({ ...options, mode: value as Mode }); } }}>
              <SelectTrigger id="compare-mode" className="min-w-28"><SelectValue /></SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {modeOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runCompare} disabled={busy}><ScanText size={17} />{busy ? '正在比较…' : '开始比较'}</Button>
          {busy && <Button variant="ghost" onClick={invalidate}>取消比较</Button>}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3">{ignores.map(([key, label, title]) => <label key={key} title={title} className="flex items-center gap-2 text-sm"><input type="checkbox" className="tool-checkbox" checked={options[key]} disabled={key === 'collapseSpaces' && options.ignoreSpaces} onChange={event => { invalidate(); setOptions({ ...options, [key]: event.target.checked }); }} />{label}</label>)}</div>
      </div>
    </section>
    <p data-entrance role="status" className="text-sm text-primary">{notice || (busy ? '正在本地计算，文本不会上传。' : result ? result.identical ? result.exactIdentical ? '内容相同' : '按当前忽略规则，内容相同（原始文本存在格式或大小写差异）' : `发现 ${result.differenceCount} 处差异` : '准备好后点击「开始比较」。修改输入或规则后，请重新比较。')}</p>
    {result && <section className={`${motionStyles.result} surface overflow-hidden`} aria-label="对比结果">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
        <div><h2 className="font-semibold">对比结果</h2><p className="mt-1 text-xs text-muted-foreground">{modeNames[result.mode]}级 · {result.differenceCount} 处差异 · <span className="text-green-800">+ {result.statistics.insert} 新增</span> · <span className="text-red-800">− {result.statistics.delete} 删除</span> · {result.statistics.replace} 修改</p></div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={view === 'split' ? 'secondary' : 'ghost'} aria-pressed={view === 'split'} onClick={() => setView('split')}>左右对照</Button>
          <Button size="sm" variant={view === 'inline' ? 'secondary' : 'ghost'} aria-pressed={view === 'inline'} onClick={() => setView('inline')}>合并视图</Button>
          <Button size="sm" variant="ghost" onClick={() => copy(formatResult(result), '对比结果')}><Copy size={14} />复制结果</Button>
        </div>
      </div>
      {result.coarse && <p role="note" className="border-b bg-amber-50 px-5 py-3 text-sm text-amber-900">文本差异较多，部分区域已合并显示；细分差异数量不完整。可分段比较以查看更精细的差异。</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 text-sm">
        <div className="flex items-center gap-2"><Button size="icon-sm" variant="ghost" aria-label="上一个差异" disabled={!result.differenceCount} onClick={() => navigate(-1)}><ArrowUp size={16} /></Button><span aria-live="polite">差异 {result.differenceCount ? active + 1 : 0} / {result.differenceCount}</span><Button size="icon-sm" variant="ghost" aria-label="下一个差异" disabled={!result.differenceCount} onClick={() => navigate(1)}><ArrowDown size={16} /></Button></div>
        {view === 'split' && <label className="flex items-center gap-2"><input type="checkbox" className="tool-checkbox" checked={sync} onChange={event => { setSync(event.target.checked); if (event.target.checked) { const from = lastScrolled.current === 'left' ? panelLeft.current : panelRight.current; const to = lastScrolled.current === 'left' ? panelRight.current : panelLeft.current; if (from && to) to.scrollTop = from.scrollTop; } }} />同步滚动</label>}
        <span className="text-xs text-muted-foreground">红色 / − 删除 · 绿色 / + 新增</span>
      </div>
      <div key={view} ref={resultRoot} className={`${motionStyles.view} ${view === 'split' ? styles.split : ''}`}>
        {view === 'split' ? <>
          <ResultColumn side="left" result={result} active={active} panelRef={panelLeft} onScroll={() => syncScroll('left')} />
          <ResultColumn side="right" result={result} active={active} panelRef={panelRight} onScroll={() => syncScroll('right')} />
        </> : <div data-panel="inline" role="region" aria-label="合并对比结果" tabIndex={0} className={styles.panel}>{result.blocks.map((block, index) => <div key={index} className={styles.content}>{block.map((op, i) => <DiffText key={i} op={op} active={active} />)}</div>)}</div>}
      </div>
      {result.identical && <p className="border-t p-5 text-sm text-primary">✓ {result.exactIdentical ? '两段文本完全一致。' : '忽略所选差异后，两段文本一致。左右视图保留各自原文。'}</p>}
    </section>}
  </div>;
}

function DiffText({ op, side, active }: { op: Operation; side?: 'left' | 'right'; active: number }) {
  if (op.type === 'equal') return <>{side === 'left' ? op.leftText : op.rightText}</>;
  const parts = op.detail ?? [op];
  return <span data-difference={op.difference} className={op.difference === active ? styles.active : undefined} aria-label={`差异 ${(op.difference ?? 0) + 1}：${op.type === 'replace' ? '修改' : op.type === 'insert' ? '新增' : '删除'}`}>
    {parts.map((part, i) => part.type === 'equal' ? <span key={i}>{side === 'left' ? part.leftText : part.rightText}</span> : <span key={i}>
      {side !== 'right' && part.leftText && <del className={styles.deleted}>{part.leftText}</del>}
      {side !== 'left' && part.rightText && <ins className={styles.inserted}>{part.rightText}</ins>}
      {side && !(side === 'left' ? part.leftText : part.rightText) && <span className={styles.placeholder} aria-label="此侧无内容">∅</span>}
    </span>)}
  </span>;
}

function ResultColumn({ side, result, active, panelRef, onScroll }: { side: 'left' | 'right'; result: CompareResult; active: number; panelRef: Ref<HTMLDivElement>; onScroll: () => void }) {
  return <div className={styles.column}>
    <div className={styles.columnTitle}>{side === 'left' ? '原始文本' : '对比文本'}</div>
    <div ref={panelRef} data-panel={side} role="region" aria-label={side === 'left' ? '原文对比结果' : '新文对比结果'} tabIndex={0} className={styles.panel} onScroll={onScroll}>
      {result.blocks.map((block, index) => <div key={index} data-block={index} className={styles.block}><div data-content className={styles.content}>{block.map((op, i) => <DiffText key={i} op={op} side={side} active={active} />)}</div></div>)}
    </div>
  </div>;
}
