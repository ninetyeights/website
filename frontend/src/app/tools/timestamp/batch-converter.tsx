'use client';

import { useState } from 'react';
import { Copy, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { convertTimestampBatch, formatBatchCopy, MAX_BATCH_LINES, type BatchDirection, type BatchRow, type TimestampUnit } from '@/lib/timestamp';
import motionStyles from '../tool-motion.module.css';

const directions = [{ value: 'toDate', label: '时间戳 → 日期' }, { value: 'toTimestamp', label: '日期 → 时间戳' }];
const units = [{ value: 'auto', label: '自动识别' }, { value: 'seconds', label: '秒' }, { value: 'milliseconds', label: '毫秒' }];
export function BatchConverter({ zone, onCopy }: { zone: string; onCopy: (value: string, id: string, label: string) => Promise<void> }) {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<BatchDirection>('toDate');
  const [unit, setUnit] = useState<TimestampUnit>('auto');
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [snapshot, setSnapshot] = useState<{ key: string; rows?: BatchRow[]; error?: string } | null>(null);
  const key = JSON.stringify([input, direction, unit, zone]);
  const current = snapshot?.key === key ? snapshot : null;
  const rows = current?.rows;
  const failures = rows?.filter(row => row.error).length ?? 0;
  const visible = rows?.filter(row => !onlyErrors || row.error);
  return <section data-entrance className="surface p-5 md:p-6" aria-labelledby="batch-title">
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <span><span id="batch-title" className="flex items-center gap-2 text-lg font-semibold"><ListOrdered size={18} aria-hidden="true" />批量转换</span><span className="mt-1 block text-xs text-muted-foreground">一次处理多行时间戳或日期，逐行检查并复制结果。</span></span>
        <span aria-hidden="true" className="text-primary transition-transform group-open:rotate-180 motion-reduce:transition-none">⌄</span>
      </summary>
      <div className={`${motionStyles.panel} mt-5 space-y-4`}>
        <p className="text-xs text-muted-foreground">使用上方转换时区：{zone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone}。带时区的日期字符串仍以自身时区为准。</p>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={direction} items={directions} onValueChange={value => { if (value) setDirection(value as BatchDirection); }}>
            <SelectTrigger aria-label="批量转换方向" className="min-w-40"><SelectValue /></SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>{directions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          {direction === 'toDate' && <Select value={unit} items={units} onValueChange={value => { if (value) setUnit(value as TimestampUnit); }}>
            <SelectTrigger aria-label="批量输入单位" className="min-w-36"><SelectValue /></SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>{units.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>}
        </div>
        <div><label htmlFor="batch-input" className="block text-sm">批量输入</label><textarea id="batch-input" className="field mt-2 min-h-40 resize-y font-mono" value={input} spellCheck={false} placeholder={direction === 'toDate' ? '1700000000\n1700000000123\n-1' : '2026-09-27 15:30:00\n2026-09-27T15:30:00Z'} onChange={event => setInput(event.target.value)} /></div>
        <p className="text-xs text-muted-foreground">每行一条，空行跳过并保留原行号。每批最多 {MAX_BATCH_LINES} 条；修改内容、方向或时区后需重新转换。</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { const result = convertTimestampBatch(input, direction, zone, unit); setSnapshot({ key, rows: result.value, error: result.error }); setOnlyErrors(false); }}>批量转换</Button>
          <Button variant="ghost" onClick={() => { setInput(''); setSnapshot(null); setOnlyErrors(false); }}>清空批量内容</Button>
          {rows && <Button variant="outline" onClick={() => onCopy(formatBatchCopy(rows), 'batch', '全部批量结果')}><Copy size={14} aria-hidden="true" />复制全部结果</Button>}
        </div>
        {current?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{current.error}</p>}
        {rows && <div className={`${motionStyles.result} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p role="status">共 {rows.length} 条 · 成功 {rows.length - failures} 条 · 失败 {failures} 条</p>
            <label className="flex items-center gap-2"><input type="checkbox" className="tool-checkbox" checked={onlyErrors} onChange={event => setOnlyErrors(event.target.checked)} />只看错误</label>
          </div>
          <div className="max-h-[32rem] overflow-auto rounded-xl border" tabIndex={0} role="region" aria-label="批量转换结果">
            <table className="w-full min-w-[42rem] text-left text-xs">
              <thead className="sticky top-0 bg-secondary"><tr>{['原行号', '原始输入', '转换结果'].map(label => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}</tr></thead>
              <tbody>{visible?.map(row => <tr key={row.line} className="border-t odd:bg-secondary/20">
                <td className="px-3 py-3 align-top">{row.line}</td>
                <td className="max-w-64 break-all px-3 py-3 align-top font-mono">{row.input}</td>
                <td className="px-3 py-3 font-mono">{row.error ? <span className="text-red-800">失败：{row.error}</span> : <div className="space-y-1"><p>{direction === 'toDate' ? row.local : `${row.seconds} 秒 / ${row.milliseconds} 毫秒`}</p><p className="text-muted-foreground">{row.iso}</p></div>}</td>
              </tr>)}</tbody>
            </table>
            {!visible?.length && <p className="p-6 text-sm text-muted-foreground">没有错误记录。</p>}
          </div>
          <p className="text-xs text-muted-foreground">复制内容包含所有行及错误说明，不受「只看错误」筛选影响。</p>
        </div>}
      </div>
    </details>
  </section>;
}
