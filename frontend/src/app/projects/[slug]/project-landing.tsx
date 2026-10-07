import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowDown, Download } from 'lucide-react';
import type { Project } from '@/lib/projects';
import { ProjectFooter } from '@/components/project-footer';
import { heroComponents, storyComponents, projectIcons, DefaultHero, FeatureStory } from './project-content';
import styles from './landing.module.css';

export function ProjectLanding({ project }: { project: Project }) {
  const Icon = projectIcons[project.presentation?.icon ?? 'monitor'];
  const Hero = project.presentation?.hero ? heroComponents[project.presentation.hero] : DefaultHero;
  const Story = project.presentation?.story ? storyComponents[project.presentation.story] : FeatureStory;
  return (
    <main className={styles.landing} data-product={project.slug}>
      <nav className={styles.productNav} aria-label="产品导航">
        <Link href="/projects" className={styles.back}><ArrowLeft size={16} aria-hidden="true"/><span>全部项目</span></Link>
        <span className={styles.productName}><Image src={project.logo} alt="" width={26} height={26} unoptimized/>{project.name}</span>
        <a href="#download" className={styles.navDownload}>获取应用 <ArrowDown size={14} aria-hidden="true"/></a>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy} data-entrance>
          <p className={styles.eyebrow}>{project.category} / {project.platform}</p>
          <div className={styles.projectBrand}><Image src={project.logo} alt="" width={64} height={64} unoptimized priority/><h1 className={styles.name}>{project.name}</h1></div>
          <p className={styles.headline}>{project.tagline}</p>
          <p className={styles.intro}>{project.description}</p>
          <div className={styles.actions}>
            <a href="#download" className={styles.primary}>获取 {project.presentation?.actionName ?? project.name}<Download size={18} aria-hidden="true"/></a>
            <a href="#about" className={styles.secondary}>探索功能<ArrowDown size={16} aria-hidden="true"/></a>
          </div>
        </div>
        <div className={styles.heroArt} data-entrance>
          <Hero project={project}/>
        </div>
        <a href="#about" className={styles.scrollCue}>向下探索 <ArrowDown size={14} aria-hidden="true"/></a>
      </section>

      <div className={styles.platformStrip}><Icon size={20} aria-hidden="true"/><span>{project.platform}</span><span className={styles.stripDivider}/><span>{project.category}</span><span className={styles.stripDivider}/><span>{project.name}</span></div>

      <Story project={project}/>

      <section id="download" className={styles.download}>
        <p className={styles.eyebrow}>YOUR NEXT STEP</p>
        <h2>{project.presentation?.downloadTitle ?? `开始使用 ${project.name}。`}</h2>
        <p className={styles.downloadIntro}>获取 {project.name}，选择适合你的平台。</p>
        <div className={styles.downloadOptions}>{project.downloads.map(download=><div key={download.platform} className={styles.downloadOption}>
          <h3>{download.platform}</h3><p>{download.requirement}</p>
          {download.url ? <a href={download.url} className={styles.primary}><Download size={18} aria-hidden="true"/>下载 {download.platform} 版</a> : <><button disabled type="button" className={styles.pending}><Download size={18} aria-hidden="true"/>{download.platform} 版 · 即将开放</button><span className={styles.downloadNote}>下载链接将在发布后提供</span></>}
        </div>)}</div>
        <p className={styles.downloadNote}>下载入口匹配最新正式版；暂时无法获取发布包时会打开 Releases 页面。</p>
        <div className="mt-4 flex flex-wrap justify-center gap-5 text-sm text-primary"><a href={project.releases} className="underline underline-offset-4">全部版本与发布说明 ↗</a>{project.guide && <a href={project.guide} className="underline underline-offset-4">安装与使用说明 ↗</a>}</div>
      </section>
      <ProjectFooter name={project.name}/>
    </main>
  );
}
