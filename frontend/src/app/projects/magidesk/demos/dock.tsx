import { Folder, FileText, Code, Image, Mail, Music, Calendar, Settings } from 'lucide-react';
import s from '../magidesk.module.css';
import { Cursor, Window, type DemoProps } from './primitives';

const items = [
  {name:'工作账号',text:'林',color:'#2f53e6'}, {name:'个人账号',text:'周',color:'#7a45e6'},
  {name:'文件',icon:Folder,color:'#bb7b13'}, {name:'笔记',icon:FileText,color:'#4f7ca7'},
  {name:'编辑器',icon:Code,color:'#4a69ad'}, {name:'相册',icon:Image,color:'#a060ac'},
  {name:'邮件',icon:Mail,color:'#398895'}, {name:'音乐',icon:Music,color:'#bc6081'},
  {name:'日历',icon:Calendar,color:'#b47755'}, {name:'设置',icon:Settings,color:'#6b7893'},
];
function DockIcon({index}:{index:number}) {
 const item=items[index], Icon=item.icon;
 return <span className={s.demoDockIcon} style={{background:item.color}} title={item.name}>{Icon?<Icon/>:item.text}<i/></span>;
}
export function DockDemo({phase,variant}:DemoProps) {
 const reserved=variant==='mode'&&phase>=2;
 const wrap=variant==='overflow'&&phase===1;
 const scrolling=variant==='overflow'&&phase>=2;
 const groupStyle=['gap','line','label','border'][phase];
 const caption=variant==='mode'?(reserved?'顶部任务栏 · 已预留工作区':'顶部悬浮 Dock · 不预留空间'):
   variant==='overflow'?(wrap?'自动换行 · 随项目增高':scrolling?'横向滚动 · 查看超出项目':'项目增多，依然井然有序'):
   variant==='groups'?['留白','分隔线','分组名称','圆角面板'][phase]:'';
 return <>
   <Window rect={{x:7,y:reserved?24:9,w:86,h:reserved?69:78}} title="项目笔记" kind="notes"/>
   {reserved && <div className={s.dockTopReserve}>顶部任务栏预留空间</div>}
   <div className={s.demoDock} data-dock-mode={reserved?'taskbar':'floating'} data-wrap={wrap} data-scroll={scrolling} data-top={true}>
     {variant==='groups'?<div className={s.dockGroups} data-group-style={groupStyle}>{['工作','生活'].map((name,i)=><div className={s.dockGroup} key={name}><small>{name}</small><div>{[i*3,i*3+1,i*3+2].map(index=><DockIcon key={index} index={index}/>)}</div></div>)}</div>:
       <div className={s.dockViewport}><div className={s.dockTrack} data-wrapped={wrap} data-scrolled={scrolling} data-scrolling={scrolling&&phase===2}>{items.slice(0,variant==='overflow'&&phase>=1?10:6).map((_,index)=><DockIcon key={index} index={index}/>)}</div></div>}
   </div>
   <div className={s.dockDemoCaption}>{caption}</div>
   <Cursor x={phase>=2?70:50} y={15} hidden={variant!=="overflow"||phase===0} label="滚轮 →"/>
   {scrolling && <span className={s.dockScrollHint}>← 向后浏览，再滚回开头 →</span>}
 </>;
}
