import s from '../magidesk.module.css';
import { Cursor, Target, Window, type DemoProps } from './primitives';
export function SnapDemo({ phase, variant }: DemoProps) {
  const near = phase >= 2, screen = variant === 'screen', guide = variant === 'guides';
  const x = near ? (screen ? 2 : 18) : 5, y = near ? 20 : 35;
  return <><Window rect={{ x: 56, y: 20, w: 39, h: 60 }} title="参考窗口" kind="browser" muted/>{near && <><Target rect={screen ? {x:2,y:2,w:1,h:94} : guide ? {x:2,y:50,w:94,h:.4} : {x:56,y:8,w:.4,h:80}}/><span className={s.snapLabel}>{screen ? '工作区边缘' : guide ? '中线对齐' : '窗口边缘'}</span></>}<Window rect={{ x, y, w: 38, h: 60 }}/><Cursor x={x + 20} y={y + 28} pressed={phase === 1 || phase === 2} label="Alt + 左键"/></>;
}
