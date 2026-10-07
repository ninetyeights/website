import { withSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUpRight, Download, Code2, Monitor, SlidersHorizontal, PanelBottom, Check } from 'lucide-react';
import { ProjectFooter } from '@/components/project-footer';
import { FeatureExplorer, HeroDesktop } from './experience';
import { features, product } from './content';
import s from './magidesk.module.css';

export const metadata: Metadata = withSocialMetadata({
  alternates: { canonical: '/projects/magidesk' },
  title: 'MagiDesk · 让窗口、账号和桌面，各就其位。',
  description: 'MagiDesk 是 Fluent 风格的 Windows 桌面增强工具箱。体验窗口拖动、边缘吸附、窗口分区、快速网格、浏览器微标、Dock 与桌面盒子，下载公开测试版。',
  openGraph: { title: 'MagiDesk · 让窗口、账号和桌面，各就其位。', description: '一个托盘应用，装下更顺手的 Windows 桌面。窗口管理、浏览器账号与桌面整理，按需开启。', type: 'website', locale: 'zh_CN' },
});
export default function MagiDeskPage() {
  return <main className={s.page}>
    <nav className={s.productNav} aria-label="MagiDesk 产品导航"><Link href="/projects" className={s.back}><ArrowLeft size={15}/>全部项目</Link><a href="#magidesk" className={s.wordmark}><Image src="/projects/magidesk/logo.svg" alt="" width={26} height={26}/>MagiDesk</a><a href={product.github} className={s.sourceLink} aria-label="MagiDesk GitHub 仓库"><Code2 size={16}/><span>GitHub</span><ArrowUpRight size={14}/></a></nav>
    <section className={s.hero} id="magidesk" aria-labelledby="hero-title">
      <div className={s.heroCopy}><p className={s.releasePill}><span/> Windows 桌面工具箱 <i/> 公开测试版</p><div className={s.heroBrand}><Image src="/projects/magidesk/logo.svg" alt="MagiDesk Logo" width={52} height={52} priority/><span>MagiDesk</span></div><h1 id="hero-title">让窗口、账号和桌面，<br/><em>各就其位。</em></h1><p className={s.intro}>少一点拖来拖去，多一点井然有序。<br/>把窗口管理、浏览器账号与桌面整理，<br className={s.desktopBreak}/>收进一个 Fluent 风格的托盘应用。</p><div className={s.actions}><a className={s.primary} href={product.download}><Download size={17}/>下载测试版<ArrowUpRight size={15}/></a><a className={s.secondary} href="#experience">体验功能<ArrowDown size={16}/></a></div><p className={s.heroMeta}>优先支持 Windows 11 x64 <span>·</span> 简体中文界面</p></div>
      <div className={s.heroVisual}><div className={s.visualLabel}><span>YOUR DESKTOP, REIMAGINED</span><span>01 — MOVE</span></div><HeroDesktop/><div className={s.visualAnnotation}><span className={s.annotationLine}/><span>从窗口内部开始，不必再找标题栏。</span></div></div>
    </section>
    <div className={s.valuesStrip}><span><Check size={15}/> 一个托盘，按需开启</span><span><Check size={15}/> 窗口、账号、文件各有位置</span><span><Check size={15}/> 个人项目，持续迭代</span></div>
    <section className={s.experienceSection} id="experience" aria-labelledby="experience-title"><header className={s.sectionHeader}><div><p className={s.eyebrow}>A LITTLE ORDER. A LOT OF FLOW.</p><h2 id="experience-title">顺手与否，<br className={s.mobileBreak}/>试一下就知道。</h2></div><p>七种工具，共用一个更从容的桌面。<br/>选一个功能，看看它如何工作。</p></header><FeatureExplorer/></section>
    <section className={s.detailsSection} aria-labelledby="details-title"><div className={s.detailsIntro}><p className={s.eyebrow}>MADE TO FIT YOUR DAY</p><h2 id="details-title">你的习惯，<br/>不必从头适应。</h2><p>默认只开启窗口拖动。<br/>其他能力，等需要时再打开。</p><div className={s.trayIllustration} aria-hidden="true"><span>⌃</span><Image src="/projects/magidesk/logo.svg" alt="" width={30} height={30}/><span>◒</span><span>▰</span></div><span className={s.trayLabel}>轻轻收起，留在托盘。</span></div><div className={s.detailRows}><article><SlidersHorizontal/><div><h3>设置跟着习惯走</h3><p>自定义拖动修饰键、吸附距离与目标，为浏览器账号选择头像、颜色与显隐。浅色和深色外观跟随系统，配置支持备份与回退。</p></div></article><article><Monitor/><div><h3>不止一块屏幕，也能各得其所</h3><p>为每个显示器分配布局、设置快速网格密度。支持 Per-Monitor-v2 高 DPI；显示器热插拔、远程桌面重连仍需更多实机验证。</p></div></article><article><PanelBottom/><div><h3>关掉主窗口，工具仍在身边</h3><p>默认关闭到托盘，双击图标重新打开，从托盘菜单退出。开机自启与自动检查更新均可按需设置；自动检查更新默认关闭。</p></div></article></div></section>
    <section className={s.referenceSection} aria-label="完整功能说明"><details><summary>查看全部功能说明 <span>+</span></summary><div className={s.referenceGrid}>{features.map(feature=><article key={feature.id}><h3>{feature.name}</h3><p>{feature.description}</p><ul>{feature.capabilities.map(item=><li key={item.id}><strong>{item.name}：</strong>{item.description}</li>)}</ul></article>)}</div></details></section>
    <section className={s.downloadSection} id="download" aria-labelledby="download-title"><div className={s.downloadCopy}><p className={s.eyebrow}>A BETTER PLACE TO START</p><h2 id="download-title">给桌面一点秩序。<br/>给自己一点余地。</h2><p>从一次顺手的拖动开始，<br/>慢慢找到自己的桌面节奏。</p><a href={product.download} className={s.primary}><Download size={18}/>下载最新版 · Windows x64<ArrowUpRight size={16}/></a><p className={s.releaseNote}>自动获取最新发布的 Windows x64 安装包（含测试版）。</p></div><div className={s.startGuide}><h3>三步，开始使用</h3><ol><li><span>01</span><div><strong>选择适合设备的下载包</strong><p>优先支持 Windows 11 x64。安装版和便携版均自带 .NET 运行时；便携版完整解压后运行 MagiDesk.exe。</p></div></li><li><span>02</span><div><strong>试试 Alt + 拖动</strong><p>首次只启用窗口拖动。Alt + 左键移动，Alt + 右键缩放；在应用左侧按需开启其他工具。</p></div></li><li><span>03</span><div><strong>把它留在托盘</strong><p>关闭主窗口收起到托盘，双击重新打开。桌面盒子启用前，请先阅读发布说明中的恢复方式。</p></div></li></ol><p className={s.betaNote}>测试版说明：Windows 10、ARM64 尚未全面实机验收。安装程序目前没有 Windows Authenticode 签名。</p><div className={s.guideLinks}><a href={product.releases}>其他架构与便携包 ↗</a><a href={product.guide}>发布使用说明 ↗</a><a href={product.issues}>反馈问题 ↗</a><a href={product.github}>GitHub ↗</a></div></div></section>
    <ProjectFooter name="MagiDesk"/>
  </main>;
}


