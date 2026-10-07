'use client';
import { trackToolSuccess } from '@/lib/analytics';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_LINK_OPTIONS, extractLinks, formatLinks, type LinkOptions, type OutputFields, type OutputFormat } from '@/lib/link-extract';
import motionStyles from '../tool-motion.module.css';
import { TableOutput } from './table-output';

const inputFormats = [{ value: 'auto', label: '自动识别' }, { value: 'text', label: '普通文本' }, { value: 'html', label: 'HTML / 网页粘贴' }, { value: 'markdown', label: 'Markdown' }];
const tableModes = [{ value: 'all', label: '全部链接' }, { value: 'first', label: '每行第一个' }, { value: 'last', label: '每行最后一个' }];
const outputFormats = [{ value: 'links', label: '每行一个链接' }, { value: 'columns', label: '自选字段（制表符）' }, { value: 'markdown', label: 'Markdown 链接' }, { value: 'csv', label: 'CSV 表格' }];
const sample = '<table>\n<tr><td><a href="https://example.com/users/123/?from=list#info">用户甲</a></td><td><a href="/groups/456/">小组甲</a></td></tr>\n<tr><td><a href="https://example.com/articles/2">文章</a></td><td><a href="https://example.com/articles/2">重复链接</a></td></tr>\n<tr><td>没有超链接的行内文字</td></tr>\n</table>';
function Choice({ label, value, items, onChange }: { label: string; value: string; items: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="flex min-w-0 flex-col gap-2"><span className="block text-xs leading-5 text-muted-foreground">{label}</span><div className="min-w-0"><Select value={value} items={items} onValueChange={value => { if (value !== null) onChange(value); }}><SelectTrigger aria-label={label} className="w-full min-w-0"><SelectValue /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div></div>;
}
export function LinkWorkbench() {
  const [input, setInput] = useState('');
  const [layout, setLayout] = useState<'list' | 'table'>('list');
  const [options, setOptions] = useState<LinkOptions>(DEFAULT_LINK_OPTIONS);
  const [snapshot, setSnapshot] = useState<{ key: string; data?: ReturnType<typeof extractLinks>; error?: string } | null>(null);
  const [format, setFormat] = useState<OutputFormat>('links');
  const [fields, setFields] = useState<OutputFields>({ title: true, href: true, pathEnd: false });
  const [query, setQuery] = useState(''), [domain, setDomain] = useState('all');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState(''), [pasteNotice, setPasteNotice] = useState('');
  const copySequence = useRef(0);
  const key = JSON.stringify([input, options]);
  useEffect(() => {
    if (layout === 'table' || !input.trim()) return;
    const timer = setTimeout(() => {
      try { setSnapshot({ key, data: extractLinks(input, options) }); trackToolSuccess('link-extract'); }
      catch (reason) { setSnapshot({ key, error: reason instanceof Error ? reason.message : '无法提取，请检查输入内容。' }); }
    }, 250);
    return () => clearTimeout(timer);
  }, [input, options, key, layout]);
  useEffect(() => () => { copySequence.current++; }, []);
  const current = snapshot?.key === key ? snapshot : null;
  const data = input.trim() ? current?.data : undefined;
  const domains = useMemo(() => [...new Set(data?.results.map(row => row.domain) ?? [])].sort(), [data]);
  const selectedDomain = domains.includes(domain) ? domain : 'all';
  const filtered = useMemo(() => data?.results.filter(row => (selectedDomain === 'all' || row.domain === selectedDomain) && `${row.title} ${row.href} ${row.pathEnd}`.toLowerCase().includes(query.trim().toLowerCase())) ?? [], [data, selectedDomain, query]);
  const output = formatLinks(filtered, format, fields);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 100)), activePage = Math.min(page, pageCount - 1);
  function invalidate() { copySequence.current++; setNotice(''); setPage(0); }
  function changeInput(value: string) { invalidate(); setInput(value); setPasteNotice(''); }
  function update(patch: Partial<LinkOptions>) { invalidate(); setOptions(previous => ({ ...previous, ...patch })); }
  function preset(legacy: boolean) {
    setLayout('list');
    invalidate(); setDomain('all'); setQuery('');
    setOptions({ ...DEFAULT_LINK_OPTIONS, ...(legacy ? { table: 'last' as const, fallback: true, dedupe: false } : {}) });
    setFormat(legacy ? 'columns' : 'links'); setFields({ title: !legacy, href: true, pathEnd: false });
  }
  function switchLayout(next: 'list' | 'table') {
    if (layout === next) return;
    invalidate(); setLayout(next); setQuery(''); setDomain('all');
    setOptions(previous => ({ ...previous, table: 'all', fallback: false, dedupe: next !== 'table', format: previous.format === 'markdown' && next === 'table' ? 'auto' : previous.format }));
    if (next === 'table') setFields({ title: false, href: true, pathEnd: false });
  }
  function toggle(option: 'fallback' | 'dedupe' | 'www' | 'contacts' | 'trimSlash' | 'removeQuery' | 'removeHash', label: string) {
    return <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" className="tool-checkbox" checked={options[option]} onChange={event => update({ [option]: event.target.checked })} />{label}</label>;
  }
  async function copy(text: string) {
    const sequence = ++copySequence.current; setNotice('');
    try { await navigator.clipboard.writeText(text); if (sequence === copySequence.current) setNotice('已复制。'); }
    catch { if (sequence === copySequence.current) setNotice('复制失败，请在输出框中选中文本手动复制。'); }
  }
  function download() {
    const csv = formatLinks(filtered, 'csv', fields);
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'extracted-links.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`已导出当前筛选的 ${filtered.length} 条记录。`);
  }
  return <div className="space-y-6">
    <section data-entrance className={`${motionStyles.controls} surface space-y-4 p-5 md:p-6`} aria-label="提取设置">
      <div className="flex flex-wrap gap-2" role="group" aria-label="输出布局"><Button aria-pressed={layout === 'list'} variant={layout === 'list' ? 'secondary' : 'outline'} onClick={() => switchLayout('list')}>链接列表</Button><Button aria-pressed={layout === 'table'} variant={layout === 'table' ? 'secondary' : 'outline'} onClick={() => switchLayout('table')}>保留表格布局</Button><Button variant="ghost" onClick={() => changeInput(sample)}>填入示例</Button></div>
      {layout === 'list' ? <><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => preset(false)}>通用提取预设</Button><Button size="sm" variant="outline" onClick={() => preset(true)}>每行取最后一个（原版预设）</Button></div><p className="text-xs leading-relaxed text-muted-foreground">列表按记录输出；原版预设每行只取最后一个链接，不保留原表格列位置。单列纯文本可手动切换「保留表格布局」。</p></> : <p className="text-xs leading-relaxed text-muted-foreground">按单元格处理，保留行列与空位。自动识别表格粘贴后使用此布局；不规则 HTML、多表格和不连续选区暂不拼接。</p>}
      <div className="grid gap-4 sm:grid-cols-2"><Choice label="输入格式" value={options.format} items={layout === 'table' ? inputFormats.filter(item => item.value !== 'markdown') : inputFormats} onChange={value => update({ format: value as LinkOptions['format'] })} /><Choice label={layout === 'table' ? '单元格内多个链接' : '表格提取方式'} value={options.table} items={layout === 'table' ? [{ value: 'all', label: '全部保留（单元格内换行）' }, { value: 'first', label: '只取第一个' }, { value: 'last', label: '只取最后一个' }] : tableModes} onChange={value => update({ table: value as LinkOptions['table'] })} /></div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">{layout === 'list' && toggle('dedupe', '按完整地址去重')}{toggle('fallback', layout === 'table' ? '无链接单元格保留文字' : '无链接行保留文字')}{toggle('www', '识别 www 地址并补全 https://')}{toggle('contacts', '包含 mailto / tel')}</div>
      <div><label htmlFor="link-base" className="text-sm">基础网址（可选，用于解析相对地址）</label><input id="link-base" className="field mt-2" placeholder="https://example.com/folder/" value={options.base} onChange={event => update({ base: event.target.value })} /></div>
      <details><summary className="cursor-pointer text-sm text-primary">链接整理与输出字段</summary><div className="mt-3 space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-x-5">{toggle('trimSlash', '去掉路径末尾斜线')}{toggle('removeQuery', '移除查询参数（? 后）')}{toggle('removeHash', '移除锚点（# 后）')}</div>
        <p className="text-xs text-muted-foreground">整理可能改变链接含义，默认全部关闭。列表按整理后的完整地址去重；表格布局始终保留各单元格位置和重复链接。</p>
        <div className="flex flex-wrap gap-5">{(['title', 'href', 'pathEnd'] as const).map(field => <label key={field} className="flex items-center gap-2 text-sm"><input type="checkbox" className="tool-checkbox" checked={fields[field]} onChange={event => { invalidate(); setFields(previous => ({ ...previous, [field]: event.target.checked })); }} />{{ title: '链接文字（标题）', href: '链接', pathEnd: '路径末段（原 ID）' }[field]}</label>)}</div>
        <p className="text-xs text-muted-foreground">字段用于制表符和 CSV 输出。表格布局中每个原始列固定展开为所选字段数，普通文字放在第一个子列。路径末段不推断用户或小组身份。</p>
      </div></details>
    </section>
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <section data-entrance className={`${motionStyles.primary} surface min-w-0 space-y-3 p-5 md:p-6`} aria-labelledby="link-input-label">
        <div className="flex items-center justify-between gap-3"><label id="link-input-label" htmlFor="link-input" className="font-semibold">输入内容</label><Button size="sm" variant="ghost" onClick={() => { changeInput(''); setDomain('all'); setQuery(''); }}>清空内容</Button></div>
        <textarea id="link-input" className="field min-h-80 resize-y font-mono text-sm" value={input} spellCheck={false} placeholder="粘贴文字、网页选区、HTML 或 Markdown…" onChange={event => changeInput(event.target.value)} onPaste={event => {
          const html = event.clipboardData.getData('text/html');
          if (html && ['auto', 'html'].includes(options.format)) {
            event.preventDefault(); const el = event.currentTarget;
            changeInput(input.slice(0, el.selectionStart) + html + input.slice(el.selectionEnd));
            if (/<table\b/i.test(html)) switchLayout('table');
            setPasteNotice('已保留网页剪贴板中的 HTML 链接，以下显示的是源码，不会执行网页内容。');
          } else if (event.clipboardData.getData('text/plain').includes('\t')) switchLayout('table');
        }} />
        <p className="text-xs text-muted-foreground">{pasteNotice || '自动提取，编辑停止约 250 毫秒后更新。需要只粘贴文字时，先选择「普通文本」。'} </p>
        <p className="text-xs text-muted-foreground">共 {input.length.toLocaleString()} 字符</p>
      </section>
      <section data-entrance className={`${motionStyles.primary} surface min-w-0 space-y-3 p-5 md:p-6`} aria-labelledby="link-output-title">
        <h2 id="link-output-title" className="font-semibold">提取结果</h2>
        {layout === 'table' ? <TableOutput input={input} options={options} fields={fields} /> : <>
        {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{current.error}</p>}
        <p role="status" className="text-xs text-muted-foreground">{!input.trim() ? '粘贴内容即可开始。' : !current ? '正在提取…' : data ? `提取 ${data.found} 条 · 重复 ${data.duplicates} 条 · 跳过 ${data.skipped} 条 · 未解析相对地址 ${data.results.filter(row => row.relative).length} 条 · 当前显示 ${filtered.length} 条` : '请检查输入内容或提取设置。'}</p>
        <p className="text-xs text-muted-foreground">跳过项包括空地址、不支持的协议和无效地址；本工具不访问链接检查是否可用。</p>
        <div className="grid items-start gap-3 sm:grid-cols-2"><div className="flex min-w-0 flex-col gap-2"><label htmlFor="link-search" className="block text-xs leading-5 text-muted-foreground">搜索结果</label><input id="link-search" className="field h-10 max-md:h-11" value={query} onChange={event => { invalidate(); setQuery(event.target.value); }} placeholder="链接、文字或路径末段" /></div><Choice label="域名筛选" value={selectedDomain} items={[{ value: 'all', label: '全部域名 / 类型' }, ...domains.map(value => ({ value, label: value }))]} onChange={value => { invalidate(); setDomain(value); }} /></div>
        <Choice label="输出格式" value={format} items={outputFormats} onChange={value => { invalidate(); setFormat(value as OutputFormat); }} />
        <label className="sr-only" htmlFor="link-output">可复制输出</label><textarea id="link-output" className="field min-h-40 resize-y font-mono text-sm" value={output} readOnly />
        {['columns', 'csv'].includes(format) && !Object.values(fields).some(Boolean) && <p role="alert" className="text-sm text-red-800">请在「链接整理与输出字段」中至少选择一个输出字段。</p>}
        <div className="flex flex-wrap gap-2"><Button disabled={!filtered.length || !output} onClick={() => copy(output)}><Copy size={15} aria-hidden="true" />复制当前结果</Button><Button variant="outline" disabled={!filtered.length || !Object.values(fields).some(Boolean)} onClick={download}><Download size={15} aria-hidden="true" />导出 CSV</Button></div>
        <p className="text-xs text-muted-foreground">复制与导出包含当前筛选的全部记录，不受下方分页影响。</p>
        <p role="status" className="min-h-5 text-sm text-primary">{notice}</p>
        </>}
      </section>
    </div>
    {layout === 'list' && data && <section className={`${motionStyles.result} surface min-w-0 space-y-4 p-5 md:p-6`} aria-label="链接明细">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">链接明细 · {filtered.length} 条</h2><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>上一页</Button><span className="text-xs">{activePage + 1} / {pageCount}</span><Button size="sm" variant="outline" disabled={activePage + 1 >= pageCount} onClick={() => setPage(activePage + 1)}>下一页</Button></div></div>
      {!filtered.length && <p className="text-sm text-muted-foreground">{data.results.length ? '没有匹配筛选条件的记录。' : '没有找到链接。请检查输入格式，或使用示例。'}</p>}
      <ol className="divide-y">{filtered.slice(activePage * 100, (activePage + 1) * 100).map((row, index) => <li key={`${activePage}-${index}`} className="flex min-w-0 items-start gap-3 py-4"><span className="pt-1 text-xs text-muted-foreground">{activePage * 100 + index + 1}</span><div className="min-w-0 flex-1 space-y-1"><p className="break-all text-sm font-medium">{row.title || '（无链接文字）'}</p><code className="block break-all text-sm select-all">{row.href}</code><p className="break-all text-xs text-muted-foreground">{row.source} · {row.domain} · 出现 {row.count} 次{row.pathEnd && ` · 路径末段：${row.pathEnd}`}</p>{row.original !== row.href && <p className="break-all text-xs text-muted-foreground">原地址：{row.original}</p>}</div><Button size="sm" variant="ghost" aria-label={`复制第 ${activePage * 100 + index + 1} 条链接`} onClick={() => copy(row.href)}><Copy size={14} aria-hidden="true" /></Button></li>)}</ol>
    </section>}
    <p data-entrance className="text-xs leading-relaxed text-muted-foreground">全部在浏览器本地处理，不上传、不抓取网页。网页文字来自粘贴内容，不联网补全标题。默认不提取图片、脚本等资源，不执行粘贴的 HTML，也不自动打开结果。</p>
  </div>;
}
