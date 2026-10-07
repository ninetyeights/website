import { ZoneEditorDemo } from './zone-editor';
import s from '../magidesk.module.css';
import { Cursor, Target, Window, type DemoProps } from './primitives';
export function ZonesDemo({ phase, variant, options }: DemoProps) {
  if (variant === 'monitors') return <div className={s.monitors}>
    <div><span>显示器 1 · 两栏</span><div className={s.monitorScreen} data-monitor="1">
      <Target rect={{x:3,y:4,w:46,h:92}} active={phase>=1}/>
      <Target rect={{x:51,y:4,w:46,h:92}} active={false}/>
      <Window title="项目笔记" rect={phase>=2?{x:3,y:4,w:46,h:92}:{x:24,y:25,w:65,h:65}}/>
      <Cursor x={phase>=1?22:45} y={phase>=1?28:40} pressed={phase===1} hidden={phase>=2} label="Shift + 拖动"/>
    </div></div>
    <div><span>显示器 2 · 主辅布局</span><div className={s.monitorScreen} data-monitor="2">
      <Target rect={{x:3,y:4,w:59,h:92}} active={phase>=2}/>
      <Target rect={{x:64,y:4,w:33,h:44}} active={false}/>
      <Target rect={{x:64,y:52,w:33,h:44}} active={false}/>
      <Window title="浏览器" kind="browser" rect={phase===3?{x:3,y:4,w:59,h:92}:{x:25,y:27,w:65,h:65}}/>
      <Cursor x={phase>=2?28:45} y={phase>=2?29:42} pressed={phase===2} hidden={phase<2||phase===3} label="Shift + 拖动"/>
    </div></div>
    <p>{phase===3?'两个窗口分别填入各自屏幕的目标分区':phase>=2?'在显示器 2，将浏览器拖入主区域':'在显示器 1，将笔记窗口拖入左栏'}</p>
  </div>;
  if (variant === 'edit') return <ZoneEditorDemo phase={phase} variant={variant} options={options}/>;
  if (variant === 'layout') {
    const switched = phase >= 2;
    const rects = switched
      ? [{x:3,y:14,w:30,h:81},{x:35,y:14,w:30,h:81},{x:67,y:14,w:30,h:81}]
      : [{x:3,y:14,w:59,h:81},{x:64,y:14,w:33,h:39},{x:64,y:56,w:33,h:39}];
    return <>
      <div className={s.layoutName} data-layout-name>{switched ? '三栏布局' : '主辅布局'}</div>
      {phase >= 1 && rects.map((rect,i)=><Target key={i} rect={rect} active={switched && i===0} label={String(i+1)}/>)}
      <Window rect={phase===3 ? rects[0] : {x:phase>=1?13:34,y:phase>=1?27:35,w:46,h:55}}/>
      <Cursor x={phase>=1?33:54} y={phase>=1?37:45} pressed={phase===1||phase===2} label={phase===2?'Shift + 拖动 · 滚轮 ↓':'Shift + 拖动'}/>
      {phase===2 && <div className={s.wheelCue} data-wheel-cue><span>↕</span> 滚动鼠标滚轮 · 切换布局</div>}
    </>;
  }
  const three = options.layout === 'three';
  const rects = three ? [{x:3,y:5,w:30,h:90},{x:35,y:5,w:30,h:90},{x:67,y:5,w:30,h:90}] : [{x:3,y:5,w:59,h:90},{x:64,y:5,w:33,h:43},{x:64,y:51,w:33,h:44}];

  return <>{phase >= 1 && rects.map((rect,i)=><Target key={i} rect={rect} active={phase >= 2 && i === 0} label={`0${i+1}`}/>)}{<Window rect={phase === 3 ? rects[0] : {x:phase >= 2 ? 8 : 34,y:phase >= 2 ? 18 :  30,w:46,h:55}}/>}<Cursor x={phase >= 2 ? 25 : 56} y={phase >= 2 ?  40 : 58} pressed={phase === 1 || phase === 2} label='Shift + 拖动'/></>;
}



