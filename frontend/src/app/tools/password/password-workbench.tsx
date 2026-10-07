'use client';
import { trackToolSuccess } from '@/lib/analytics';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzePasswordOptions, DEFAULT_PASSWORD_OPTIONS, generatePasswords, WORD_COUNT, type PasswordMode, type PasswordOptions } from '@/lib/password';
import motionStyles from '../tool-motion.module.css';
import styles from './password.module.css';

const modes: { value: PasswordMode; label: string }[] = [{ value: 'random', label: '随机密码' }, { value: 'words', label: '单词短语' }, { value: 'pin', label: 'PIN 码' }];
const separators = [{ value: '-', label: '连字符 -' }, { value: '.', label: '句点 .' }, { value: '_', label: '下划线 _' }, { value: ' ', label: '空格' }];
const modeSettings: Record<PasswordMode, (keyof PasswordOptions)[]> = {
  random: ['length', 'upper', 'lower', 'numbers', 'symbols', 'customSymbols', 'excludeConfusing', 'requireAll'],
  words: ['wordCount', 'separator', 'capitalize', 'addNumber'],
  pin: ['pinLength', 'avoidRepeat', 'avoidSequential'],
};
export function PasswordWorkbench() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [result, setResult] = useState<{ passwords: string[] } | null>(null);
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(true);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const revealResult = useRef(false);
  const resetFeedback = useCallback(() => { sequence.current++; if (timer.current) clearTimeout(timer.current); setNotice(''); setError(''); }, []);
  const runGeneration = useCallback((next: PasswordOptions, reveal = false) => {
    if (generationTimer.current) clearTimeout(generationTimer.current);
    generationTimer.current = null;
    setPending(false); resetFeedback();
    try {
      const passwords = generatePasswords(next);
      revealResult.current = reveal;
      setResult({ passwords }); setTotal(value => value + passwords.length);
      if (reveal) trackToolSuccess('password');
      setNotice(`已生成 ${passwords.length} 条${modes.find(mode => mode.value === next.mode)!.label}。`);
    } catch (reason) { revealResult.current = false; setResult(null); setError(reason instanceof Error ? reason.message : '生成失败，请重试。'); }
  }, [resetFeedback]);
  useEffect(() => {
    const feedbackSequence = sequence;
    generationTimer.current = setTimeout(() => runGeneration(DEFAULT_PASSWORD_OPTIONS), 0);
    return () => {
      feedbackSequence.current++;
      if (timer.current) clearTimeout(timer.current);
      if (generationTimer.current) clearTimeout(generationTimer.current);
    };
  }, [runGeneration]);
  useEffect(() => {
    if (!result || !revealResult.current) return;
    revealResult.current = false;
    const heading = resultHeading.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const bounds = heading.getBoundingClientRect();
    if (bounds.top < 80 || bounds.bottom > window.innerHeight) {
      heading.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, [result]);
  const analysis = useMemo(() => analyzePasswordOptions(options), [options]);
  const modeIndex = modes.findIndex(mode => mode.value === options.mode);
  function update(patch: Partial<PasswordOptions>, debounce = false) {
    if (Object.entries(patch).every(([key, value]) => Object.is(options[key as keyof PasswordOptions], value))) return;
    revealResult.current = false;
    if (generationTimer.current) clearTimeout(generationTimer.current);
    generationTimer.current = null;
    const next = { ...options, ...patch };
    resetFeedback(); setOptions(next); setResult(null); setPending(false);
    if (analyzePasswordOptions(next).error) return;
    if (debounce) {
      setPending(true);
      generationTimer.current = setTimeout(() => runGeneration(next), 300);
    } else runGeneration(next);
  }
  function restoreDefaults() {
    const patch = Object.fromEntries(modeSettings[options.mode].map(key => [key, DEFAULT_PASSWORD_OPTIONS[key]]));
    update({ ...patch, count: DEFAULT_PASSWORD_OPTIONS.count });
  }
  function generate() {
    runGeneration(options, !result);
  }
  function clearResults() {
    if (generationTimer.current) clearTimeout(generationTimer.current);
    generationTimer.current = null; revealResult.current = false;
    resetFeedback(); setPending(false); setResult(null);
  }
  async function copy(text: string, label: string) {
    resetFeedback(); const request = sequence.current;
    try {
      await navigator.clipboard.writeText(text);
      if (request !== sequence.current) return;
      setNotice(`${label}已复制`);
      timer.current = setTimeout(() => setNotice(''), 1800);
    } catch { if (request === sequence.current) setNotice('复制失败，请显示结果并选中文本手动复制。'); }
  }
  function toggle(key: 'upper' | 'lower' | 'numbers' | 'symbols' | 'excludeConfusing' | 'requireAll' | 'capitalize' | 'addNumber' | 'avoidRepeat' | 'avoidSequential', label: string) {
    return <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input className="tool-checkbox" type="checkbox" checked={options[key]} onChange={event => update({ [key]: event.target.checked })} />{label}</label>;
  }
  const numeric = (key: 'length' | 'wordCount' | 'pinLength' | 'count', label: string, min: number, max: number, presets: number[], slider = true) => <div className="space-y-3">
    <div className="flex items-center justify-between gap-3"><label htmlFor={`pw-${key}`} className="text-sm font-medium">{label}<span className="ml-2 text-xs font-normal text-muted-foreground">{min}–{max}</span></label><input id={`pw-${key}`} type="number" min={min} max={max} step="1" className="field w-24 text-center font-mono" value={Number.isNaN(options[key]) ? '' : options[key]} onChange={event => update({ [key]: event.target.value === '' ? NaN : Number(event.target.value) }, true)} /></div>
    {slider && <input type="range" aria-label={`${label}滑块`} min={min} max={max} value={Number.isFinite(options[key]) ? Math.min(max, Math.max(min, options[key])) : min} onChange={event => update({ [key]: Number(event.target.value) }, true)} className={styles.slider} />}
    <div className="flex flex-wrap gap-2">{presets.map(value => <Button type="button" key={value} size="sm" variant={options[key] === value ? 'secondary' : 'ghost'} aria-pressed={options[key] === value} aria-label={`${label}设为 ${value}`} onClick={() => update({ [key]: value })}>{value}</Button>)}</div>
  </div>;
  return <div className="space-y-6">
    <form data-entrance onSubmit={event => { event.preventDefault(); generate(); }} noValidate className={`${motionStyles.controls} surface space-y-5 p-5 md:p-6`}>
      <div role="tablist" aria-label="密码模式" className={`${motionStyles.tabs} bg-secondary p-1`} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <span aria-hidden="true" className={motionStyles.tabIndicator} style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(${modeIndex * 100}%)` }} />
        {modes.map((mode, index) => <button type="button" key={mode.value} id={`tab-${mode.value}`} role="tab" aria-selected={options.mode === mode.value} aria-controls="password-settings" tabIndex={options.mode === mode.value ? 0 : -1} className={`${motionStyles.tab} min-h-11 rounded-lg px-2 text-sm font-medium ${options.mode === mode.value ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => update({ mode: mode.value })} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
          update({ mode: modes[next].value }); document.getElementById(`tab-${modes[next].value}`)?.focus();
        }}>{mode.label}</button>)}
      </div>
      <div id="password-settings" role="tabpanel" aria-labelledby={`tab-${options.mode}`} key={options.mode} className={`${motionStyles.panel} space-y-5`}>
        {options.mode === 'random' && <>
          {numeric('length', '密码长度', 8, 128, [8, 12, 16, 20, 24, 32, 48, 64, 128])}
          <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">字符类型</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{toggle('upper', '大写字母 A–Z')}{toggle('lower', '小写字母 a–z')}{toggle('numbers', '数字 0–9')}{toggle('symbols', '符号')}</div></fieldset>
          {options.symbols && <div><label htmlFor="pw-symbols" className="text-sm">自定义符号</label><input id="pw-symbols" className="field mt-2 font-mono" value={options.customSymbols} maxLength={128} spellCheck={false} autoComplete="off" onChange={event => update({ customSymbols: event.target.value }, true)} /><p className="mt-2 text-xs text-muted-foreground">支持英文半角标点，重复符号自动去重。</p></div>}
          <div className="flex flex-wrap gap-2">{toggle('excludeConfusing', '排除易混淆字符 0 O 1 l I')}{toggle('requireAll', '包含每种已选字符')}</div>
        </>}
        {options.mode === 'words' && <>
          {numeric('wordCount', '单词数量', 3, 15, [3, 4, 5, 6, 8, 10, 15])}
          <div className="flex flex-wrap items-center gap-3"><span id="separator-label" className="text-sm">单词分隔符</span><Select value={options.separator} items={separators} onValueChange={value => { if (value !== null) update({ separator: value }); }}><SelectTrigger aria-labelledby="separator-label" className="min-w-36"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{separators.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex flex-wrap gap-2">{toggle('capitalize', '随机首字母大写')}{toggle('addNumber', '尾部添加两位数字')}</div>
          <p className="text-xs text-muted-foreground">从 {WORD_COUNT} 个英文词中独立随机抽取，可能重复。大写选项对每个单词随机决定是否大写，尾数范围为 00–99。</p>
        </>}
        {options.mode === 'pin' && <>
          {numeric('pinLength', 'PIN 位数', 4, 12, [4, 6, 8, 10, 12])}
          <div className="flex flex-wrap gap-2">{toggle('avoidRepeat', '避免相邻重复')}{toggle('avoidSequential', '避免相邻递增或递减')}</div>
          <p className="text-xs text-muted-foreground">分别排除 00、11 等相邻重复，或 12、21 等相邻差 1 的数字；0 与 9 不视为连续。PIN 可由 0 开头。规则会减少组合数量，短 PIN 不适合作为独立账户密码。</p>
        </>}
      </div>
      <div className="border-t pt-5">{numeric('count', '生成数量', 1, 500, [1, 5, 10, 50, 100, 500], false)}</div>
      {analysis.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{analysis.error}</p>}
      {!analysis.error && analysis.combinations === BigInt(1) && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">当前规则只有一种可能结果，没有随机性。请增加可选字符；仅增加长度不会改善这一点。</p>}
      <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!!analysis.error}><RefreshCw size={16} aria-hidden="true" />重新生成</Button><span className="text-xs text-muted-foreground">设置自动生效；输入或拖动停止约 300 毫秒后更新，结果仅保留在当前页面。</span></div>
      <div className="flex flex-wrap items-center gap-3 border-t pt-4"><Button type="button" variant="outline" size="sm" onClick={restoreDefaults}>恢复当前模式默认设置</Button><p className="text-xs text-muted-foreground">恢复本模式规则及生成数量（1 条），保留其他模式设置。</p></div>
    </form>
    <section data-entrance className={`${motionStyles.primary} surface space-y-4 p-5 md:p-6`} aria-labelledby="password-result-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 ref={resultHeading} tabIndex={-1} id="password-result-title" className="scroll-mt-24 rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">生成结果</h2><Button variant="outline" size="sm" aria-pressed={hidden} onClick={() => setHidden(value => !value)}>{hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}{hidden ? '显示密码' : '隐藏密码'}</Button></div>
      {result ? <div className={`${motionStyles.result} space-y-4`}>
        <div className="rounded-xl border bg-secondary/40 p-4 md:p-6"><code data-testid="primary-password" className="block break-all text-center font-mono text-xl leading-relaxed select-all">{hidden ? '••••••••••••' : [...result.passwords[0]].map((char, i) => <span key={i} className={/[0-9]/.test(char) ? 'text-amber-800' : /[^a-zA-Z]/.test(char) ? 'text-violet-700' : undefined}>{char}</span>)}</code></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => copy(result.passwords[0], '第一条密码')}><Copy size={15} aria-hidden="true" />复制第一条</Button><Button variant="outline" onClick={generate}><RefreshCw size={15} aria-hidden="true" />再生成一组</Button>{result.passwords.length > 1 && <Button variant="outline" onClick={() => copy(result.passwords.join('\n'), '全部密码')}>复制全部 {result.passwords.length} 条</Button>}<Button variant="ghost" onClick={clearResults}>清空结果</Button></div>
        {result.passwords.length > 1 && <ol aria-label="批量密码" className="max-h-80 overflow-auto rounded-xl border">{result.passwords.map((password, index) => <li key={index} className="flex items-center gap-3 border-b p-3 last:border-0"><span className="w-7 shrink-0 text-xs text-muted-foreground">{index + 1}</span><code className="min-w-0 flex-1 break-all text-sm select-all">{hidden ? '••••••••••••' : password}</code><Button size="sm" variant="ghost" aria-label={`复制第 ${index + 1} 条`} onClick={() => copy(password, `第 ${index + 1} 条密码`)}><Copy size={14} aria-hidden="true" /></Button></li>)}</ol>}
      </div> : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"><p>{pending ? '正在等待输入完成，即将自动生成…' : analysis.error ? '请修正规则，恢复有效后会自动生成。' : '结果已清空。修改设置或点击「重新生成」可生成密码。'}</p>{pending && <Button className="mt-3" variant="ghost" onClick={clearResults}>清空结果</Button>}</div>}
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <p role="status" className="min-h-5 text-sm text-primary">{notice}</p>
    </section>
    <section data-entrance className="surface space-y-3 p-5 md:p-6" aria-labelledby="password-analysis-title">
      <div className="flex flex-wrap justify-between gap-2"><h2 id="password-analysis-title" className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} aria-hidden="true" />当前规则分析</h2><span className="text-sm text-primary">{analysis.error ? '配置待完善' : `${analysis.label} · ${analysis.bits.toFixed(1)} bits`}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.min(100, analysis.bits / 128 * 100)}%` }} /></div>
      <p className="text-xs leading-relaxed text-muted-foreground">理论随机熵按实际规则允许的组合数计算，用于比较本工具生成方案；不代表真实破解时间，也不是已有密码的强度检测。{options.mode === 'random' && !analysis.error ? `当前字符池为 ${analysis.poolSize} 种。` : ''}</p>
      <p data-entrance className="text-xs leading-relaxed text-muted-foreground">使用浏览器安全随机数，本页不会上传或持久保存密码。批量结果独立生成，可能重复。隐藏仅遮住屏幕显示；清空结果不会清除系统剪贴板。本次已生成 {total} 条。</p>
    </section>
  </div>;
}
