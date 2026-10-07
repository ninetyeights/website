'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractLinkTable, tableValues, formatTable, tableClipboardHtml, type LinkTable } from '@/lib/link-table';
import type { LinkOptions, OutputFields } from '@/lib/link-extract';

export function TableOutput({ input, options, fields }: { input: string; options: LinkOptions; fields: OutputFields }) {
  const key = JSON.stringify([input, options]);
  const [snapshot, setSnapshot] = useState<{ key: string; table?: LinkTable; error?: string } | null>(null);
  const [notice, setNotice] = useState<{ key: string; text: string } | null>(null);
  const [pagination, setPagination] = useState({ key, page: 0 });
  const sequence = useRef(0);
  useEffect(() => {
    if (!input) return;
    const timer = setTimeout(() => {
      try { setSnapshot({ key, table: extractLinkTable(input, options) }); }
      catch (error) { setSnapshot({ key, error: error instanceof Error ? error.message : '表格解析失败。' }); }
    }, 250);
    return () => clearTimeout(timer);
  }, [input, options, key]);
  useEffect(() => () => { sequence.current++; }, []);
  const current = input && snapshot?.key === key ? snapshot : null, table = current?.table;
  const values = table ? tableValues(table, fields, options.fallback) : [];
  const text = formatTable(values), feedbackKey = JSON.stringify([key, fields]);
  const totalPages = Math.max(1, Math.ceil(values.length / 50));
  const currentPage = pagination.key === feedbackKey ? Math.min(pagination.page, totalPages - 1) : 0;
  const setPage = (page: number) => setPagination({ key: feedbackKey, page });
  const available = values.length > 0 && (values[0]?.length ?? 0) > 0;
  async function copy() {
    const request = ++sequence.current;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }), 'text/html': new Blob([tableClipboardHtml(values)], { type: 'text/html' }) })]);
          if (request === sequence.current) setNotice({ key: feedbackKey, text: '已复制完整表格，可粘贴到表格软件。' });
          return;
        } catch { /* Some browsers only permit plain-text clipboard writes. */ }
      }
      await navigator.clipboard.writeText(text);
      if (request === sequence.current) setNotice({ key: feedbackKey, text: '已复制 Tab 分隔文本；含单元格内换行时，建议使用 CSV 导入。' });
    } catch { if (request === sequence.current) setNotice({ key: feedbackKey, text: '复制失败，请手动复制输出框内容，或下载 CSV。' }); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob(['\uFEFF', formatTable(values, true)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'extracted-table.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-3">
    {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{current.error}</p>}
    <p role="status" className="text-xs text-muted-foreground">{!current && input ? '正在还原表格…' : table ? `${table.cells.length} 行 × ${table.width} 原始列 · 输出 ${values[0]?.length ?? 0} 列 · 跳过 ${table.skipped} 个无效链接 · ${table.merged} 个合并区域` : '粘贴一个连续表格选区即可开始。'}</p>
    <p className="text-xs leading-relaxed text-muted-foreground">保留空位和重复链接，不去重、不筛选、不压缩行列。多个链接留在原单元格内换行；多字段按每个原始列依次展开。合并区域只在左上角填内容，其余留空。最多 10000 行、256 原始列，展开并补齐空位后最多 50000 个单元格；输入最多 200 万个字符。</p>
    {!Object.values(fields).some(Boolean) && <p role="alert" className="text-sm text-red-800">请至少选择一个输出字段。</p>}
    <label htmlFor="table-output" className="block text-sm">可复制表格（Tab 分列，换行分行）</label>
    <textarea id="table-output" className="field min-h-40 resize-y whitespace-pre font-mono text-sm" wrap="off" readOnly value={text} />
    <div className="flex flex-wrap gap-2"><Button disabled={!available} onClick={copy}>复制完整表格</Button><Button disabled={!available} variant="outline" onClick={download}>导出表格 CSV</Button></div>
    <p role="status" className="min-h-5 text-sm text-primary">{notice?.key === feedbackKey ? notice.text : ''}</p>
    {available && <>
      <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium">表格预览</h3><div className="flex items-center gap-2"><Button size="sm" variant="ghost" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>上一页</Button><span className="text-xs">{currentPage + 1}/{totalPages}</span><Button size="sm" variant="ghost" disabled={currentPage + 1 === totalPages} onClick={() => setPage(currentPage + 1)}>下一页</Button></div></div>
      <div role="region" aria-label="表格预览" tabIndex={0} className="max-h-96 overflow-auto rounded-xl border"><table className="w-full border-collapse text-left text-xs"><tbody>{values.slice(currentPage * 50, (currentPage + 1) * 50).map((row, r) => <tr key={r}><th scope="row" className="border bg-secondary p-2">{currentPage * 50 + r + 1}</th>{row.map((cell, c) => <td key={c} className="min-w-28 max-w-64 whitespace-pre-wrap break-words border p-2 align-top">{cell || <span className="text-muted-foreground" aria-label="空单元格">—</span>}</td>)}</tr>)}</tbody></table></div>
      <p className="text-xs text-muted-foreground">预览每页 50 行；复制及导出包含完整选区，不添加标题行。公式起始字符会加单引号保护。纯文本只有显示文字时，无法恢复背后的超链接。</p>
    </>}
  </div>;
}
