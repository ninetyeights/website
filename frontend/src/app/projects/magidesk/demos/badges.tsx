import type { CSSProperties } from 'react';
import s from '../magidesk.module.css';
import { Cursor, Window, type DemoProps } from './primitives';

export function BadgesDemo({ phase, variant }: DemoProps) {
  if (variant==='copy') return <BadgeCopyDemo phase={phase}/>;
  const size = variant==='avatar' ? [24,40,64,64][phase] : 40;
  const options = {
    badgeSize:size, badgeName:variant!=='avatar'||phase<3,
    badgeChromeX:variant==='position'&&phase>=1?20:0,
    badgeEdgeX:variant==='position'&&phase>=2?38:0,
    badgeBrowser:phase<2?'chrome':'edge',
    badgeShape:variant==='style'?['circle','rounded','hexagon','rounded'][phase]:'circle',
    badgeStyle:variant==='style'?['solid','gradient','split','solid'][phase]:'gradient',
    color:variant==='style'?['#2F53E6','#7A45E6','#a56500','#2F53E6'][phase]:'#2F53E6',
    badgeImage:variant==='style'&&phase===3,
  };
  const background = options.badgeStyle==='solid' ? options.color : options.badgeStyle==='split'
    ? `linear-gradient(135deg,${options.color} 50%,#ffb020 50%)`
    : `linear-gradient(135deg,${options.color},#b485ed)`;
  return <div className={s.badgeScene}>
    <div className={s.badgeSceneHeading}><strong>让每个窗口，都有自己的身份</strong><span>Chrome · 工作 / Edge · 个人</span></div>
    {(['chrome','edge'] as const).map((browser,index)=>{
      const offset=browser==='chrome'?options.badgeChromeX:options.badgeEdgeX;
      const active=variant==='position'&&options.badgeBrowser===browser;
      return <div key={browser} className={s.badgeBrowserWindow} data-browser={browser}>
        <Window rect={{x:0,y:0,w:100,h:100}} title={index?'Edge · 个人空间':'Chrome · 工作空间'} kind="browser"/>
        {<div data-sim-badge data-badge-browser={browser} data-has-name={options.badgeName} className={s.identityBadge} style={{'--badge-size':`${options.badgeSize}px`,right:`${offset}%`,background:index?'#137c77':options.color} as CSSProperties}>
          <span className={s.identityAvatar} data-shape={options.badgeShape} style={{background:index?'linear-gradient(135deg,#147e76,#78c9a8)':background}}>{!index&&options.badgeImage?<svg data-avatar-image viewBox="0 0 64 64" aria-label="示例图片头像"><rect width="64" height="64" fill="#c8e4ee"/><circle cx="46" cy="17" r="8" fill="#ffb020"/><path d="M0 56 25 20 52 64H0Z" fill="#6f66b0"/><path d="m23 64 26-35 15 20v15Z" fill="#344e75"/></svg>:index?'周':'林'}</span>
          {options.badgeName && <span className={s.identityName}>{index?'生活 · 周':'工作 · 林'}</span>}
        </div>}
        {active && <Cursor x={85-offset} y={8} pressed={phase===1||phase===2} label={browser==='chrome'?'调整 Chrome':'调整 Edge'}/>}
      </div>;
    })}
    <div className={s.badgeReadout}>
      <strong>{variant==='avatar'?`${options.badgeSize}px`:variant==='position'?(options.badgeBrowser==='chrome'?'Chrome':'Edge'):'你的头像，你的风格'}</strong>
      <span>{variant==='avatar'?(options.badgeName?'头像 + Profile 名称 · 宽度自适应':'仅显示头像 · 胶囊收缩'):variant==='position'?'独立调整位置，另一浏览器保持不变':options.badgeImage?'示例图片已应用为头像':'自动演示颜色、形状与背景样式'}</span>
    </div>
  </div>;
}

function BadgeCopyDemo({phase}:{phase:number}) {
  return <div className={s.badgeScene}>
    <div className={s.badgeSceneHeading}><strong>平时不挡操作，需要时一键复制</strong><span>鼠标穿透 → Ctrl + 点击 → 复制名称</span></div>
    <div className={s.badgeCopyBrowser}>
      <Window rect={{x:0,y:0,w:100,h:100}} title="Chrome · 工作空间" kind="browser">
        <div className={s.documentLabel}>{phase>=1?'项目文档 · 已切换标签页':'浏览器工作空间'}</div>
        <div className={s.skeleton}/><div className={s.skeletonShort}/>
      </Window>
      <div className={s.badgeUnderTab} data-under-tab={phase>=1}>项目文档 {phase>=1?'✓':''}</div>
      <div className={s.badgeCopyOverlay} data-pass-through={phase!==2} data-copy-badge>
        <span>林</span><strong>工作 · 林</strong>
      </div>
      <Cursor x={phase===0?22:48} y={phase===0?42:5} pressed={phase===1||phase===2} label={phase===2?'Ctrl + 点击头像':'点击下方标签页'}/>
      {phase===3 && <div className={s.badgeCopyToast} data-copy-result>✓ 已复制：工作 · 林 <small>功能演示</small></div>}
    </div>
    <div className={s.badgeReadout}><strong>{phase===2?'Ctrl 按住':'默认穿透'}</strong><span>{phase===2?'点击头像即可复制名称':'微标不拦截鼠标，浏览器操作照常'}</span></div>
  </div>;
}