'use client';
import { useEffect, useRef, useState } from 'react';
import { Move, Magnet, PanelsTopLeft, Grid2X2, CircleUserRound, AppWindow, FolderOpen, RotateCcw, ArrowUpRight, Pin, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { features, defaultOptions, zoneEditorActions, type ZoneEditAction, type DemoOptions, type FeatureId, type Feature } from './content';
import { useDemoPlayback, useReducedMotion } from './use-demo-playback';
import { DragDemo } from './demos/drag';
import { SnapDemo } from './demos/snap';
import { ZonesDemo } from './demos/zones';
import { GridDemo } from './demos/grid';
import { BadgesDemo } from './demos/badges';
import { DockDemo } from './demos/dock';
import { BoxesDemo } from './demos/boxes';
import s from './magidesk.module.css';
const icons = {drag:Move,snap:Magnet,zones:PanelsTopLeft,grid:Grid2X2,badges:CircleUserRound,dock:AppWindow,boxes:FolderOpen};
const demos = {drag:DragDemo,snap:SnapDemo,zones:ZonesDemo,grid:GridDemo,badges:BadgesDemo,dock:DockDemo,boxes:BoxesDemo};

function Player({feature,variant,options,hero=false,onOption}: {feature:Feature;variant:string;options:DemoOptions;hero?:boolean;onOption?:(patch:Partial<DemoOptions>)=>void}) {
  const {ref,phase,reduced,running}=useDemoPlayback(hero?1:2);
  const capability=(feature.id==='zones' && variant==='edit' ? zoneEditorActions.find(item=>item.id===options.zoneEdit) : feature.capabilities.find(item=>item.id===variant))!;
  const Demo=demos[feature.id];
  const keys=feature.id==='drag'?[options.modifier,variant==='resize'?'右键拖动':'左键拖动']:feature.id==='badges'&&variant==='copy'&&phase!==2?['鼠标穿透']:capability.keys;
  return <div ref={ref} className={s.player} data-phase={phase} data-running={running} data-reduced={reduced} data-demo={`${feature.id}:${variant}`}>
    <div className={s.desktopHeader}><span><i/> MAGIDESK WORKSPACE</span><span>功能演示 · 非软件截图</span></div>
    <div className={s.desktop} data-editor={feature.id==="zones" && variant==="edit"}><div className={s.wallpaperMark}>Make room<br/>for your ideas.</div><div className={s.workarea}><Demo phase={phase} variant={variant} options={options} onOption={onOption}/></div><div className={s.taskbar} aria-hidden="true"><span>⊞</span><span>⌕</span><span className={s.taskApp}/><span className={s.taskApp}/><span className={s.tray}>⌃　◒　 ▰</span></div></div>
    <div className={s.playbackCaption}><div className={s.keycaps}>{keys.map(key=><kbd key={key} data-lit={phase===1||phase===2}>{key}</kbd>)}</div><p aria-live="polite" aria-atomic="true">{capability.steps[phase]}</p><span className={s.phaseLabel}>{reduced?'静态结果':phase===3?'演示完成':running?`0${phase+1} / 04`:'等待播放'}</span></div>
  </div>;
}
export function HeroDesktop() {
  const reduced=useReducedMotion();
  const [replay,setReplay]=useState(0);
  return <div className={s.heroDesktop}><Player key={replay} feature={features[0]} variant="move" options={defaultOptions} hero/><div className={s.heroDesktopFoot}><span><MousePointer2 size={14}/> 一次拖动，少一点打断。</span><Button variant="ghost" size="sm" disabled={reduced} title={reduced ? "已启用减少动态效果，展示静态结果" : undefined} onClick={()=>setReplay(n=>n+1)} aria-label="重播首屏演示"><RotateCcw size={14}/>{reduced ? "静态演示" : "重播"}</Button></div></div>;
}
function Choices({label,value,items,onChange}: {label:string;value:string;items:{value:string;label:string}[];onChange:(value:string)=>void}) {
  return <fieldset className={s.choices}><legend>{label}</legend>{items.map(item=><button type="button" key={item.value} aria-pressed={value===item.value} onClick={()=>onChange(item.value)}>{item.label}</button>)}</fieldset>;
}
function Options({feature,variant,options,onChange}:{feature:FeatureId;variant:string;options:DemoOptions;onChange:(patch:Partial<DemoOptions>)=>void}) {
  if(feature==='zones'&&variant==='edit') return <>
    <Choices label="编辑操作" value={options.zoneEdit} items={zoneEditorActions.map(item=>({value:item.id,label:item.name}))} onChange={zoneEdit=>onChange({zoneEdit:zoneEdit as ZoneEditAction})}/>
  </>;
  return null;
}
export function FeatureExplorer() {
  const reduced=useReducedMotion();
  const [selected,setSelected]=useState<FeatureId>('drag');
  const [variant,setVariant]=useState('move');
  const [pinned,setPinned]=useState(false);
  const [options,setOptions]=useState(defaultOptions);
  const [replay,setReplay]=useState(0);
  const hoverTimer=useRef<ReturnType<typeof setTimeout> | null>(null);
  const feature=features.find(item=>item.id===selected)!;
  const capability=(feature.id==='zones' && variant==='edit' ? zoneEditorActions.find(item=>item.id===options.zoneEdit) : feature.capabilities.find(item=>item.id===variant))!;
  function cancelHover(){if(hoverTimer.current) clearTimeout(hoverTimer.current);hoverTimer.current=null;}
  useEffect(()=>()=>{if(hoverTimer.current) clearTimeout(hoverTimer.current);},[]);
  function choose(id:FeatureId,lock:boolean){cancelHover();if(id!==selected){setSelected(id);setVariant(features.find(item=>item.id===id)!.capabilities[0].id);setOptions(defaultOptions);setReplay(n=>n+1);}if(lock)setPinned(true);}
  function changeOptions(patch:Partial<DemoOptions>){setOptions(current=>({...current,...patch}));setReplay(n=>n+1);}
  return <div className={s.explorer}>
    <div className={s.featureList} role="group" aria-label="主功能"><div className={s.featureNavLabel}><strong>选择主功能</strong><span>7 种桌面工具</span></div>
      {features.map((item,index)=>{const Icon=icons[item.id];return <button key={item.id} type="button" className={s.featureButton} aria-pressed={selected===item.id} onPointerEnter={event=>{cancelHover();if(event.pointerType==='mouse'&&!pinned&&item.id!==selected)hoverTimer.current=setTimeout(()=>choose(item.id,false),200);}} onPointerLeave={cancelHover} onClick={()=>choose(item.id,true)}><Icon size={21}/><span><strong>{item.name}</strong><small>{item.short}</small></span><span className={s.featureNumber}>{selected===item.id?<ArrowUpRight size={17}/>:String(index+1).padStart(2,'0')}</span></button>;})}
      <div className={s.selectionHint}>{pinned?<><Pin size={13}/>已固定 · 点击其他功能切换<Button variant="ghost" size="sm" onClick={()=>setPinned(false)}>恢复悬停预览</Button></>:<><MousePointer2 size={13}/>悬停预览，点击固定选择</>}</div>
    </div>
    <div className={s.featurePanel}>
      <div className={s.panelHeading}><div><span className={s.eyebrow}>TRY IT / 交互体验</span><h3>{feature.name}</h3></div><Button variant="outline" size="sm" disabled={reduced} title={reduced ? "已启用减少动态效果，展示静态结果" : undefined} onClick={()=>setReplay(n=>n+1)} aria-label="重播当前演示"><RotateCcw size={14}/>{reduced ? "静态演示" : "重播"}</Button></div>
      <div className={s.demoControls}><div className={s.capabilities} role="group" aria-label={`${feature.name}子能力`}>{feature.capabilities.map(item=><button type="button" key={item.id} aria-pressed={variant===item.id} onPointerEnter={event=>{if(event.pointerType==='mouse')setVariant(item.id);}} onFocus={()=>setVariant(item.id)} onClick={()=>setVariant(item.id)}>{item.name}</button>)}</div>
      <div className={s.options}><Options feature={selected} variant={variant} options={options} onChange={changeOptions}/></div>
      <p className={s.capabilityDescription}>{capability.description}</p></div>
      <Player key={`${selected}:${variant}:${replay}`} feature={feature} variant={variant} options={options} onOption={changeOptions}/>
      
      <p className={s.demoNote}>网页模拟操作，不会控制你的桌面或读取本机文件。</p>
    </div>
  </div>;
}






