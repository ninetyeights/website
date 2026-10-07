'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, Minus, Square, AppWindow, Globe, Music2, Video, AudioLines } from 'lucide-react';
import s from './audio-panels.module.css';

function Window({id,title,width,height,children}:{id:string;title:string;width:number;height:number;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);
 useEffect(()=>{const el=ref.current;if(!el)return;const ro=new ResizeObserver(([e])=>setScale(Math.min(1,e.contentRect.width/width)));ro.observe(el);return()=>ro.disconnect();},[width]);
 return <div ref={ref} className={s.frame} style={{maxWidth:width,height:height*scale}} data-capture={id}>
  <div className={s.window} style={{width,height,transform:'scale('+scale+')'}}>
   <div className={s.title}><span className={s.logo}>C</span>{title}<span aria-hidden="true" className={s.chrome}>{width>600&&<><Minus size={12}/><Square size={10}/></>}<X size={14}/></span></div>
   {children}
  </div>
 </div>;
}
const apps=[{name:'QuickStart',exe:'QuickStart.exe',icon:AppWindow,color:'#238cce'},{name:'Sample Browser',exe:'Browser.exe',icon:Globe,color:'#38a367'},{name:'Music Player',exe:'MusicPlayer.exe',icon:Music2,color:'#9062de'},{name:'Meet Room',exe:'MeetRoom.exe',icon:Video,color:'#dd7438'},{name:'Audio Studio',exe:'AudioStudio.exe',icon:AudioLines,color:'#348f97'}];
const options=['跟随系统','桌面音箱（示例）','有线耳机（示例）','虚拟通道 A（示例）'];
export function AppAudioPanel(){
 const [reset,setReset]=useState(0);const [status,setStatus]=useState('');
 return <Window id="app-audio" title="应用音频" width={906} height={510}>
  <div className={s.appBody}>
   <p>为应用指定输出和输入设备。“跟随系统”使用默认设备；切换音频方案时，以方案中的应用设备规则为准。</p>
   <div className={s.toolbar}><button onClick={()=>setStatus('示例应用列表已刷新')}>刷新</button><button className={s.danger} onClick={()=>{setReset(v=>v+1);setStatus('示例应用已恢复为跟随系统');}}>全部恢复为跟随系统</button></div>
   <div className={s.appRows} key={reset}>{apps.map((app,i)=><div className={s.appRow} key={app.name}>
    <app.icon size={28} style={{color:app.color}} aria-hidden="true"/>
    <div className={s.appIdentity}><strong>{app.name}</strong><small>{'C:\\DemoApps\\'+app.name+'\\'+app.exe}</small></div>
    <div className={s.volume}><span>输出音量</span><div><label><input type="checkbox"/>静音</label><input aria-label={app.name+'音量'} type="range" defaultValue={100}/><small>100%</small></div></div>
    <label className={s.selector}>输出<select aria-label={app.name+'输出'} defaultValue={reset===0&&i===1?options[3]:options[0]}>{options.map(o=><option key={o}>{o}</option>)}</select></label>
    <label className={s.selector}>输入<select aria-label={app.name+'输入'} defaultValue="跟随系统">{['跟随系统','桌面麦克风（示例）','语音通道（示例）'].map(o=><option key={o}>{o}</option>)}</select></label>
   </div>)}</div>
   <footer className={s.appFooter}><span role="status">{status}</span><button disabled>关闭</button></footer>
  </div>
 </Window>;
}
export function SchedulePanel(){
 const [selected,setSelected]=useState(-1);const [enabled,setEnabled]=useState([true,true]);const [status,setStatus]=useState('点击列表中的计划，体验启用与停用。');
 return <Window id="schedules" title="定时切换音频方案" width={806} height={574}>
  <div className={s.scheduleBody}>
   <p>按电脑本地时间执行；音频方案锁定时跳过。同一时间只执行列表中靠前的计划。<br/>手动试运行会立即切换音频方案。电脑关机时不执行，也不会唤醒电脑。</p>
   <label className={s.catchup}><input type="checkbox"/>启动或唤醒后，补执行最近应生效的计划</label>
   <p className={s.hint}>默认关闭，错过不补执行。开启后只补最近一条，不会补跑全部计划。</p>
   <div className={s.tableWrap}><table><thead><tr>{['状态','目标音频方案','时间 / 重复','下次执行','最近结果'].map(x=><th key={x}>{x}</th>)}</tr></thead>
   <tbody>{['专注办公','音乐时光'].map((name,i)=><tr key={name} data-selected={selected===i} onClick={()=>setSelected(i)}><td><button aria-label={'选择'+name+'计划'} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{enabled[i]?'启用':'停用'}</button></td><td>{name}</td><td>{i===0?'09:00 · 工作日':'18:30 · 每天'}</td><td>{enabled[i]?'等待下次执行':'—'}</td><td>尚未执行（示例）</td></tr>)}</tbody></table></div>
   <div className={s.toolbar}><button disabled>＋ 新建计划…</button><button disabled>编辑…</button><button disabled={selected<0} onClick={()=>{setEnabled(v=>v.map((x,i)=>i===selected?!x:x));setStatus('已更新示例计划状态，不会执行真实任务。');}}>启用 / 停用</button><button disabled={selected<0} onClick={()=>setStatus('示例试运行完成，不会切换实际设备。')}>立即执行 / 重试</button><button disabled>删除</button></div>
   <p role="status" className={s.warning}>{status}</p>
  </div>
 </Window>;
}
export function ProfilePanel(){
 const [name,setName]=useState('专注办公');const [color,setColor]=useState('#e348a6');const [status,setStatus]=useState('');
 return <Window id="profile-edit" title="音频方案设置" width={546} height={534}>
  <form className={s.profileBody} onSubmit={e=>{e.preventDefault();setStatus('示例方案已保存');}}>
   <label className={s.field}><span>名称:</span><input value={name} onChange={e=>setName(e.target.value)} aria-label="方案名称"/></label>
   <div className={s.field}><label htmlFor="demo-shortcut">快捷键:</label><input id="demo-shortcut" placeholder="点击设置快捷键" readOnly/><button type="button" disabled>清除</button></div>
   <label className={s.catchup}><input type="checkbox" defaultChecked/>切换后重启 Voicemeeter 音频引擎（未运行则跳过）</label>
   <div className={s.colors}><span>标签颜色:</span>{['#fff','#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6','#e348a6','#6b7280'].map(c=><button key={c} type="button" aria-label={'标签颜色 '+c} aria-pressed={color===c} onClick={()=>setColor(c)} style={{background:c}}/>)}</div>
   <div className={s.ruleHeading}><strong>应用设备规则</strong><button type="button" disabled>添加</button><span>按应用指定设备，应用稍后启动时会自动补设</span></div>
   <div className={s.rules}>{['Browser.exe','MusicPlayer.exe','MeetRoom.exe','GameDemo.exe'].map((app,i)=><div key={app}><span>{app}<small>→ {i%2===0?'桌面音箱':'有线耳机'}（示例）</small></span><button type="button" disabled>编辑</button><button type="button" disabled className={s.danger}>删除</button></div>)}</div>
   <div className={s.profileFooter}><span role="status">{status}</span><button type="button" disabled>取消</button><button type="submit" className={s.save}>保存</button></div>
  </form>
 </Window>;
}
