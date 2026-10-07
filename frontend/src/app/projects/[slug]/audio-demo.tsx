'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Headphones, Mic, Monitor, Cable, Volume2, GripHorizontal, LockKeyholeOpen, Minus, Square, X } from 'lucide-react';
import styles from './audio-demo.module.css';

const profiles = [
 {name:'专注办公', output:'桌面音箱 (示例输出设备)', input:'桌面麦克风 (示例输入设备)', recording:2},
 {name:'音乐时光', output:'有线耳机 (示例 USB 耳机)', input:'语音输入 (示例虚拟设备)', recording:3},
 {name:'无线出行', output:'无线耳机 (示例蓝牙设备)', input:'桌面麦克风 (示例输入设备)', recording:2},
];
const playback = [
 {name:'有线耳机',detail:'示例 USB 耳机',icon:Headphones},
 {name:'媒体音频',detail:'示例虚拟播放设备 A',icon:Cable},
 {name:'数字音频输出',detail:'示例数字音频设备',icon:Monitor},
 {name:'混音通道 B',detail:'示例虚拟播放设备 B',icon:Volume2},
 {name:'系统音频',detail:'示例虚拟播放设备 C',icon:Volume2},
];
const recording = [
 {name:'桌面采集',detail:'示例虚拟录音设备 A',icon:Cable},
 {name:'媒体采集',detail:'示例虚拟录音设备 B',icon:Cable},
 {name:'桌面麦克风',detail:'示例 USB 麦克风',icon:Mic},
 {name:'语音输入',detail:'示例混音总线 B1',icon:Volume2},
 {name:'直播输入',detail:'示例混音总线 B2',icon:Volume2},
];
export function AudioDemo(){
 const frame=useRef<HTMLDivElement>(null);
 const [scale,setScale]=useState(1);
 const [profile,setProfile]=useState(1);
 const [menu,setMenu]=useState(true);
 const [input,setInput]=useState(2);
 const [volumes,setVolumes]=useState([14,100,100,100,100]);
 const [muted,setMuted]=useState<number[]>([0]);
 const [notice,setNotice]=useState('点击配置，或拖动音量滑块体验');
 useEffect(()=>{const el=frame.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setScale(Math.min(1,entry.contentRect.width/764)));observer.observe(el);return()=>observer.disconnect();},[]);
 function selectProfile(index:number){if(index===2){setNotice('示例无线耳机未连接，未切换设备');return;}setProfile(index);setInput(profiles[index].recording);setNotice('已选择示例配置：'+profiles[index].name);}
 return <figure className={styles.demo} aria-label="音频切换助手整窗演示">
  <div ref={frame} className={styles.frame} style={{height:882*scale}} data-capture="main">
   <div className={styles.window} onKeyDown={e=>{if(e.key==='Escape')setMenu(false);}} style={{transform:'scale('+scale+')'}}>
    <div className={styles.titlebar}><span className={styles.logo}>C</span><span>音频切换助手</span><span className={styles.windowControls} aria-hidden="true"><Minus size={13}/><Square size={11}/><X size={15}/></span></div>
    <div className={styles.menubar} aria-hidden="true">文件　视图　工具　帮助</div>
    <div className={styles.content}>
     <div className={styles.upper}>
      <section className={styles.profiles} aria-label="示例配置">
       <div className={styles.sectionTitle}><span>音频方案</span><span className={styles.newLabel}>＋ 新建</span></div>
       {profiles.map((p,i)=><button key={p.name} type="button" onClick={()=>selectProfile(i)} aria-pressed={profile===i} className={styles.profile}>
        <GripHorizontal className={styles.grip} size={15}/><div className={styles.profileBody}>
         <strong>{profile===i&&<><i className={styles.pink}/><Check size={16}/></>}{p.name}</strong>
         <span>输出：{p.output} {i===2&&<em>未连接</em>}</span><span>输入：{p.input}</span>
        </div><span className={styles.profileTools} aria-hidden="true"><LockKeyholeOpen size={13}/> 编辑 <b>删除</b></span>
       </button>)}
      </section>
      <section className={styles.mixer} aria-label="Voicemeeter 示意">
       <div className={styles.sectionTitle}><span>● Voicemeeter Banana</span><LockKeyholeOpen size={13}/></div>
       <div className={styles.mixerPanel}>
        {['桌面音箱（示例）','(未设置)','(未设置)'].map((label,i)=><div key={i} className={styles.bus}><span>▶ A{i+1}</span><span>{label}</span></div>)}
        {['麦克风','桌面采集','媒体采集','语音输入','直播输入'].map((label,i)=><div key={label} className={styles.strip}><span>• {label}</span><button type="button" aria-label={label+'静音'} aria-pressed={muted.includes(i)} onClick={()=>setMuted(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i])}>静音</button><span className={muted.includes(i)?styles.muted:undefined}>{['示例 USB 麦克风','示例虚拟录音设备 A','示例虚拟录音设备 B','示例混音总线 B1','示例混音总线 B2'][i]}</span></div>)}
       </div>
      </section>
     </div>
     <div className={styles.lower}>
      <section className={styles.playback}><div className={styles.deviceHeading}>播放设备 <span aria-hidden="true">□ 显示已隐藏　□ 显示已禁用</span></div><div className={styles.playbackList}>
       {playback.map((d,i)=><div key={d.name} className={styles.output} data-selected={i===3} onContextMenu={e=>{e.preventDefault();setMenu(true);}}>
        <div className={styles.deviceTop}><d.icon size={40} strokeWidth={1.3} className={styles.deviceIcon}/><div><strong>{d.name}</strong>{d.detail&&<small>{d.detail}</small>}</div></div>
        <div className={styles.volume}><Volume2 size={14}/><input type="range" min="0" max="100" value={volumes[i]} aria-label={d.name+'音量'} onChange={e=>setVolumes(v=>v.map((old,j)=>i===j?Number(e.target.value):old))}/><span>{volumes[i]}%</span></div>
       </div>)}
      </div></section>
      <section><div className={styles.deviceHeading}>录音设备</div><div className={styles.inputs}>
       {recording.map((d,i)=><button key={d.name} type="button" className={styles.input} aria-pressed={input===i} onClick={()=>{setInput(i);setNotice('示例录音设备：'+d.name);}}>
        {i>2?<span className={styles.virtual}>B{i-2}</span>:<d.icon size={39} strokeWidth={1.4} className={styles.deviceIcon}/>}
        <span className={styles.inputText}><strong>{d.name}</strong>{d.detail&&<small>{d.detail}</small>}</span>{input===i&&<Check size={21} className={styles.activeCheck}/>}
       </button>)}
      </div></section>
     </div>
    </div>
    {menu && <div className={styles.contextMenu} aria-label="示例设备操作">{['设为默认设备','禁用此设备','测试播放','重命名…','隐藏此设备'].map((label,i)=><button type="button" key={label} onClick={()=>{setNotice('示例操作：'+label+'（不影响实际设备）');setMenu(false);}}><span aria-hidden="true">{['★','⊖','▷','✎','◉'][i]}</span>{label}</button>)}</div>}
   </div>
  </div>
  <p className={styles.notice} role="status">{notice}</p>
  <figcaption className={styles.caption}>配置与设备名称均为虚构示例，不会修改实际音频设备。菜单与编辑文字仅作外观展示。</figcaption>
 </figure>;
}
