import type { CSSProperties, ReactNode } from 'react';
import { FileText, Folder, Globe, Minus, Square, X, MousePointer2 } from 'lucide-react';
import type { DemoOptions } from '../content';
import s from '../magidesk.module.css';

export type DemoProps = { phase: number; variant: string; options: DemoOptions; onOption?: (patch: Partial<DemoOptions>) => void };
export type Rect = { x: number; y: number; w: number; h: number };
export function position({ x, y, w, h }: Rect): CSSProperties { return { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }; }
export function Window({ rect, title = '项目笔记', kind = 'notes', children, muted = false }: { rect: Rect; title?: string; kind?: 'notes' | 'browser' | 'files'; children?: ReactNode; muted?: boolean }) {
  return <div data-sim-window className={`${s.window} ${muted ? s.mutedWindow : ''}`} style={position(rect)} aria-hidden="true">
    <div className={s.windowTitle}><span>{kind === 'browser' ? <Globe size={12}/> : kind === 'files' ? <Folder size={12}/> : <FileText size={12}/>} {title}</span><span className={s.windowButtons}><Minus/><Square/><X/></span></div>
    {kind === 'browser' && <div className={s.addressBar}>⌕　搜索或输入网址</div>}
    <div className={s.windowContent}>{children ?? <><div className={s.documentLabel}>{kind === 'browser' ? '我的工作空间' : '给灵感，留一点空间。'}</div><div className={s.skeleton}/><div className={s.skeleton}/><div className={s.skeletonShort}/><div className={s.documentTiles}><span/><span/><span/></div></>}</div>
  </div>;
}
export function Cursor({ x, y, pressed = false, label = '左键', hidden = false }: { x: number; y: number; pressed?: boolean; label?: string; hidden?: boolean }) {
  return <div className={s.cursor} data-pressed={pressed} style={{ left: `${x}%`, top: `${y}%`, opacity: hidden ? 0 : 1 }} aria-hidden="true"><MousePointer2 size={25} fill="white" stroke="#172348" strokeWidth={1.6}/>{pressed && <span>{label}</span>}</div>;
}
export function Target({ rect, active = true, label }: { rect: Rect; active?: boolean; label?: string }) { return <div aria-hidden="true" className={s.target} data-active={active} style={position(rect)}>{label && <span>{label}</span>}</div>; }
export function Files({ names = ['设计稿.fig', '计划.md', '参考图.png'] }: { names?: string[] }) { return <div data-sim-files className={s.files}>{names.map(name => <span key={name}><FileText/>{name}</span>)}</div>; }

