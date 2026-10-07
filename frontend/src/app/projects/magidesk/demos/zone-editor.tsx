import { zoneResetSequence } from '../content';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Cursor, Window, position, type DemoProps, type Rect } from './primitives';
import s from '../magidesk.module.css';

function grid(rows: number, columns: number): Rect[] {
  return Array.from({length:rows*columns}, (_,index) => ({
    x: Math.floor(index/rows)*100/columns, y: index%rows*100/rows,
    w: 100/columns, h: 100/rows,
  }));
}
const uneven: Rect[] = [
  {x:0,y:0,w:28,h:64},{x:0,y:64,w:28,h:36},
  {x:28,y:0,w:44,h:64},{x:28,y:64,w:44,h:36},
  {x:72,y:0,w:28,h:64},{x:72,y:64,w:28,h:36},
];

/** An illustrative 1440×900 work area, not measurements of the visitor's display. */
export function ZoneEditorDemo({phase,options}: DemoProps) {
  const action=options.zoneEdit;
  const resetGrid=zoneResetSequence[phase];
  const changed=phase>=2;
  const linking=action==='global'||action==='local';
  const linked=action==='global'?changed:action==='local'&&!changed;
  const topCut=changed?64:48;
  const bottomCut=action==='global'&&changed?64:48;
  let cells: Rect[];
  if(action==='cut') {
    // Keep both elements mounted so they share the same transition start frame.
    const cut=phase===0?100:changed?64:50;
    cells=[{x:0,y:0,w:cut,h:100},{x:cut,y:0,w:100-cut,h:100}];
  } else if(action==='reset') cells=grid(resetGrid.rows,resetGrid.columns);
  else if(action==='even') cells=changed?[{x:0,y:0,w:36,h:50},{x:0,y:50,w:36,h:50},{x:36,y:0,w:36,h:50},{x:36,y:50,w:36,h:50},...uneven.slice(4)]:uneven;
  else cells=[{x:0,y:0,w:topCut,h:50},{x:0,y:50,w:bottomCut,h:50},{x:topCut,y:0,w:100-topCut,h:50},{x:bottomCut,y:50,w:100-bottomCut,h:50}];
  const showMenu=linking&&phase===1;
  const showReset=action==='reset'&&phase>=1;
  const cursor=linking?{x:changed?64:48,y:43}:action==='cut'?{x:changed?64:50,y:45}:action==='even'?(phase===0?{x:1,y:17}:phase===1?{x:71,y:97}:{x:38,y:8}):phase<=1?{x:85,y:8}:{x:77,y:30};
  const summary=action==='global'?'同列分割线一起移动':action==='local'?'只移动上段，下段保持原位':action==='even'?'选中 4 个分区已均分 · 右侧分区保持不变':action==='reset'?`${resetGrid.rows} 行 × ${resetGrid.columns} 列 · 数字改变即重置`:'局部切割 · 拖动调整比例';
  return <div className={s.zoneEditor} data-editor-action={action} data-editor-phase={phase} data-linked={linked} aria-hidden="true">
    <div className={s.editorBackdrop}><Window rect={{x:40,y:28,w:57,h:65}} title="MagiDesk · 窗口分区"/></div>
    <div className={s.editorShade}/>
    <div className={s.editorCanvas} data-zone-count={cells.length} data-dense={cells.length>24}>
      {cells.map((rect,index)=><div key={index} data-zone-cell data-zone-selected={action==="even" && phase>=1 && index<4} className={s.zoneCell} style={position(rect)}><strong>{index+1}</strong><span>{Math.round(rect.w*14.4)} × {Math.round(rect.h*9)}</span></div>)}
      {action==='even' && <div data-zone-marquee className={s.editorMarquee} style={{left:'1%',top:'17%',width:phase>=1?'70%':0,height:phase>=1?'80%':0,opacity:phase===1?1:0}}/>}
      {action==='cut'&&phase===0 && <div className={s.editorCutPreview}/>}
      {linking && <><div className={s.editorDivider} data-divider="top" data-linked={linked} style={{left:`${topCut}%`,top:0,height:'50%'}}/><div className={s.editorDivider} data-divider="bottom" data-linked={linked} style={{left:`${bottomCut}%`,top:'50%',height:'50%'}}/></>}
    </div>
    <div className={s.editorToolbar}><strong>Zone 编辑器</strong><span data-highlight={action==='even'&&phase>=2}>平均分配</span><span>切割: 局部</span><span data-highlight={showReset}>重置网格…</span></div>
    {showReset && <div className={s.editorPopover} data-reset-popover><strong>重置网格</strong><div className={s.editorNumbers}><span>行</span><b data-reset-rows data-highlight={phase===3}>{resetGrid.rows}</b><i><ChevronUp/><ChevronDown/></i><span>列</span><b data-reset-columns data-highlight={phase===2}>{resetGrid.columns}</b><i><ChevronUp/><ChevronDown/></i></div><p>局部切割：独立分割线不自动联动</p><p>数字改变即重置布局，范围为 1–12。</p></div>}
    {showMenu && <div className={s.editorContextMenu} data-divider-menu><span data-highlight={action==='global'}>设为全局联动（同列 / 同行）</span><span data-highlight={action==='local'}>取消联动（各段局部移动）</span></div>}
    {changed && <span className={s.editorResult}>{summary}</span>}
    <Cursor x={cursor.x} y={cursor.y} pressed={phase===1||phase===2} label={action==='even'?(phase===1?'左键框选':'点击平均分配'):linking?(phase===1?'右键':'左键拖动'):action==='cut'?(phase===1?'左键切割':'拖动分割线'):'左键'}/>
    <span className={s.editorScale}>示例工作区 1440 × 900</span>
  </div>;
}






