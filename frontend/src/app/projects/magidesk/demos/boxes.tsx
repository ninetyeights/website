import { FileText, Folder, ChevronDown, ChevronUp } from 'lucide-react';
import s from '../magidesk.module.css';
import { Cursor, Files, type DemoProps } from './primitives';

export function BoxesDemo({ phase, variant }: DemoProps) {
 const closed=variant==='collapse'&&phase===1;
 const mapped=false;
 const classified=variant==='classify'&&phase>=2;
 const secondPage=false;
 const names=variant==='classify'
   ? (phase===3?['参考图.png','封面.jpg']:classified?['计划.md','说明.txt']:['计划.md','参考图.png','归档.zip'])
   :secondPage?['配色.png','图标.svg','调研.md']:['计划.md','参考图.png','说明.txt'];
 return <div className={s.boxesScene}>
   <div className={s.boxesHeading}>资料各有归处，桌面留给当下</div>
   <div className={s.boxesPair}>
     <section className={s.desktopBox} data-box="design" data-collapsed={closed}>
       <div className={s.boxTitle}><span><Folder size={14}/>设计资料</span>{closed?<ChevronDown size={14}/>:<ChevronUp size={14}/>}</div>
       <div className={s.boxContents}>
         <div className={s.boxPath}>{classified?'规则分类 · 仅分类显示':`文件盒子 · 第 ${secondPage?2:1} 页`}</div>
         {classified && <div className={s.boxTabs} data-classification-tabs>{['文档','图片','其他'].map((label,i)=><span key={label} data-active={phase===3?i===1:i===0}>{label}</span>)}</div>}
         <Files names={variant==='organize'&&phase===3?['设计稿.fig',...names]:names}/>
         {variant==='pages' && <div className={s.boxTabs}><span data-active={!secondPage}>1</span><span data-active={secondPage}>2</span></div>}
       </div>
     </section>
     <section className={s.desktopBox} data-box="project">
       <div className={s.boxTitle}><span><Folder size={14}/>{mapped?'项目目录':'工作文档'}</span><ChevronUp size={14}/></div>
       <div className={s.boxPath}>{mapped?'映射：文档 / 项目资料':'文件盒子 · 常用资料'}</div>
       {(!mapped||phase>=2) && <Files names={mapped?['需求.md','原型.png','进度.txt']:['会议.md','清单.txt','预算.csv']}/>}
       {mapped&&phase>=2 && <div className={s.boxMappingNote}>目录内容直接呈现 · 文件留在原处</div>}
     </section>
   </div>
   {variant==='organize' && <div className={s.looseFile} style={{left:phase>=2?'74%':'12%',top:phase>=2?'26%':'78%',opacity:phase===3?0:1}}><FileText/><span>设计稿.fig</span></div>}
   {mapped&&phase===1 && <div className={s.boxRulePanel}>映射文件夹<strong>文档 / 项目资料</strong><span>选择此目录 → 显示目录内容</span></div>}
   {variant==='classify'&&phase===1 && <div className={s.boxRulePanel}>生成分类分页<strong>文档：.md、.txt</strong><strong>图片：.png、.jpg</strong><span>未匹配项 → 其他 · 不移动文件</span></div>}
   {variant==='classify'&&phase===3 && <div className={s.boxesFootnote}>已按规则分类显示，实际文件路径不变</div>}
   <Cursor x={variant==='organize'?(phase>=2?76:14):mapped?70:86} y={variant==='organize'?(phase>=2?30:83):variant==='classify'?25:12} pressed={phase===1||phase===2} hidden={phase===3} label={variant==='organize'?'左键拖入盒子':variant==='classify'?'应用分类规则':closed?'点击展开':'点击'}/>
 </div>;
}
