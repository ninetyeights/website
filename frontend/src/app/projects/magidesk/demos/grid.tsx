import s from '../magidesk.module.css';
import { Cursor, Target, Window, type DemoProps } from './primitives';

const screens = [{id:'3',cols:2,rows:2},{id:'2',cols:4,rows:3},{id:'1',cols:6,rows:4}];
export function GridDemo({ phase, variant }: DemoProps) {
  const all = variant === 'screens';
  const active = all ? '1' : '2';
  const {cols,rows} = screens.find(screen=>screen.id===active)!;


  const centered = variant === 'center';
  const selected = centered ? {x:25,y:20,w:50,h:60} : {x:0,y:0,w:200/cols,h:200/rows};
  if (phase===0) return <><Window rect={{x:38,y:30,w:50,h:55}}/><div className={s.quickShortcut}>Ctrl + Shift + G</div></>;
  return <div className={s.quickPanel} data-quick-panel data-scope={all?'all':'current'}>
    <header><strong>项目笔记<small>快速网格</small></strong><span aria-hidden="true">×</span></header>
    <div className={s.quickToolbar} aria-hidden="true">
      <span className={s.quickScope}>范围：{all?'所有屏':'当前屏'}</span>
      <span data-active={centered && phase>=2}>▣ 仅居中</span><span>▣ 大窗居中</span><span>▯ 窄幅居中</span>
    </div>
    <div className={s.quickSettings} aria-hidden="true">
      {all && <span>DISPLAY{active}⌄</span>}
      {[2,4,6].map(n=><span key={n} data-active={cols===n}>{n}×{n}</span>)}
      <span>行 ‹ {rows} ›</span><span>列 ‹ {cols} ›</span><span>间距 (px) ‹ 0 ›</span>
    </div>
    <div className={s.quickScreens} data-all={all}>
      {screens.filter(screen=>all||screen.id==='2').map(({id,cols,rows})=><div key={id} className={s.quickScreen} data-screen={id} data-cols={cols} data-rows={rows} data-active={active===id}>
        <div className={s.quickLandscape} aria-hidden="true"/>
        <div className={s.quickCells} style={{gridTemplateColumns:`repeat(${cols},1fr)`,gridTemplateRows:`repeat(${rows},1fr)`}}>
          {Array.from({length:cols*rows},(_,i)=><span key={i} data-selected={!centered && active===id && phase>=2 && i%cols<2 && Math.floor(i/cols)<2}/>)}
        </div>
        <span className={s.quickScreenLabel}>DISPLAY{id}{id==='2'?' · 当前屏':''} · {cols}×{rows}</span>
        {id===active && <>
          {phase===2 && <Target rect={selected}/>}
          {phase===3 && <Window rect={selected}/>}
          <Cursor x={phase>=2?selected.x+selected.w-3:3} y={phase>=2?selected.y+selected.h-3:8} pressed={phase===2} hidden={phase===3||centered} label="框选"/>
        </>}
      </div>)}
    </div>
    <footer>{phase===3?`已应用到 DISPLAY${active} · ${centered?'窗口保持大小并居中':'窗口填满框选范围'}`:centered?'选择「仅居中」，保持窗口大小':'拖动框选、松开应用 · Esc 取消'}</footer>
  </div>;
}
