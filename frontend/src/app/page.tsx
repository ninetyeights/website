import { withSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Layers3, Link2, Music2 } from 'lucide-react';
import { projects as allProjects } from '@/lib/projects';
import { publishedTools as allTools } from '@/lib/tools';
import { getSiteCatalog } from '@/lib/site-catalog';
import { selectEnabled } from '@/lib/catalog-state';
import styles from './home.module.css';
import { projectScenes } from './projects/project-scenes';
import { HomeDesktopScene } from './home-desktop-scene';

export const metadata: Metadata = withSocialMetadata({
  alternates: { canonical: '/' },
  title: '玖捌小站',
  description: '发现实用工具，探索软件与作品，记录使用心得和日常发现。',
});

export default async function Home() {
  const catalog = await getSiteCatalog();
  const projects = selectEnabled(allProjects, catalog, 'project');
  const publishedTools = selectEnabled(allTools, catalog, 'tool');
  return <main className={styles.home}>
    <section className={styles.hero}>
      <div className={styles.heroCopy} data-entrance-group>
        <p className={styles.eyebrow} data-entrance><span/> NINETYEIGHTS / 玖捌小站</p>
        <h1 data-entrance>给日常，<br/>添一点<span>顺手。</span></h1>
        <p className={styles.intro} data-entrance>一些解决小问题的工具，<br/>一些让桌面更舒服的作品。都收在这里，等你来用。</p>
        <div className={styles.actions} data-entrance><Link className={styles.primary} href="#tools">发现实用工具 <ArrowRight size={17}/></Link><Link className={styles.secondary} href="#projects">探索作品 <ArrowUpRight size={17}/></Link></div>
        <p className={styles.heroNote} data-entrance>{publishedTools.length} 个在线工具 <span>·</span> {projects.length} 个桌面项目</p>
      </div>
      <div className={styles.stage} data-entrance>
        <div className={styles.orb} aria-hidden="true"/>
        <span className={styles.stageLabel}>YOUR EVERYDAY WORKSPACE</span>
        {projects.some(project => project.slug === 'magidesk') && <Link href="/projects/magidesk" className={styles.desktopPreview} aria-label="探索 MagiDesk 桌面工具">
          <div className={styles.desktopCanvas} aria-hidden="true"><HomeDesktopScene/></div>
          <span className={styles.sceneCaption}>MagiDesk · 账号一眼分清，窗口随手移动 <ArrowUpRight size={15}/></span>
        </Link>}
        {projects.some(project => project.slug === 'lyricdrop') && <Link href="/projects/lyricdrop" className={styles.lyricNote}><Music2 size={18}/><span><small>LyricDrop / 桌面歌词</small><strong>让喜欢的旋律，轻轻落下。</strong></span><ArrowUpRight size={14}/></Link>}
        {publishedTools.some(tool => tool.slug === 'link-extract') && <Link href="/tools/link-extract" className={styles.toolNote}><span className={styles.noteIcon}><Link2 size={19}/></span><div><small>手边的小工具</small><strong>把散落的链接，整理成行。</strong><span className={styles.sampleLinks}>https://… <i/> https://… <i/> https://…</span></div><ArrowUpRight size={14}/></Link>}
      </div>
    </section>
    <section id="tools" className={styles.section}>
      <div className={styles.sectionHead} data-entrance><div><p className={styles.eyebrow}>EVERYDAY TOOLS</p><h2>手边的事，顺手完成。</h2><p>处理文字、整理链接，或生成一个新密码。</p></div><Link href="/tools">全部工具 <ArrowUpRight size={17}/></Link></div>
      <div className={styles.toolGrid} data-entrance-group>{publishedTools.map(tool=><Link key={tool.slug} href={tool.href} className={styles.tool} data-entrance><span className={styles.toolIcon}><tool.icon size={23}/></span><div><h3>{tool.name}</h3><p>{tool.summary}</p></div><ArrowUpRight className={styles.cardArrow} size={18}/></Link>)}</div>
      {!publishedTools.length && <p className="text-muted-foreground" data-entrance>工具正在整理中，稍后再来看看。</p>}
    </section>
    <section id="projects" className={styles.section}>
      <div className={styles.sectionHead} data-entrance><div><p className={styles.eyebrow}>MADE FOR YOUR DESKTOP</p><h2>从自己的需要，做成作品。</h2><p>窗口、声音与歌词，让常用的桌面多一点可能。</p></div><Link href="/projects">全部项目 <ArrowUpRight size={17}/></Link></div>
      <div className={styles.projectGrid} data-entrance-group>{projects.map(project => {
        const scene = projectScenes[project.slug];
        const Scene = scene?.component;
        return <Link key={project.slug} href={'/projects/'+project.slug} className={styles.project} data-entrance>
          <div className={`${styles.projectArt} ${scene?.className ?? ''}`} aria-hidden="true"><div className={styles.sceneCanvas}>{Scene ? <Scene/> : <Image src={project.logo} alt="" width={76} height={76} unoptimized/>}</div></div>
          <div className={styles.projectCopy}><div className={styles.projectBrand}><Image src={project.logo} alt="" width={25} height={25} unoptimized/><span className={styles.category}>{project.category}</span></div><h3>{project.presentation?.actionName ?? project.name}</h3>{project.presentation?.actionName && <span className={styles.englishName}>{project.name}</span>}<p>{project.tagline}</p><span className={styles.projectLink}>了解作品 <ArrowUpRight size={17}/></span></div>
        </Link>;
      })}</div>
      {!projects.length && <p className="text-muted-foreground" data-entrance>作品正在整理中，稍后再来看看。</p>}
    </section>
    <footer className={styles.footer} data-entrance><div><Layers3 size={19}/><span>玖捌小站</span><span className={styles.footerNote}>把好用的东西，慢慢做好。</span></div><Link href="/feedback">反馈与建议 <ArrowRight size={15}/></Link></footer>
  </main>;
}
