import { withSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { projects as allProjects } from '@/lib/projects';
import { getSiteCatalog } from '@/lib/site-catalog';
import { selectEnabled } from '@/lib/catalog-state';
import { projectScenes } from './project-scenes';
import styles from './projects.module.css';

export const metadata: Metadata = withSocialMetadata({
  alternates: { canonical: '/projects' },
  title: '项目 · 玖捌小站',
  description: '探索 MagiDesk、AudioDeviceSwitcher 与 LyricDrop，查看产品介绍和下载信息。',
});

export default async function ProjectsPage() {
  const projects = selectEnabled(allProjects, await getSiteCatalog(), 'project');
  return (
    <main className={`page-container ${styles.page}`}>
      <header className={styles.header} data-entrance>
        <div><p className={styles.eyebrow}>INDEPENDENT SOFTWARE / 独立作品</p><h1>让日常，多一点顺手。</h1></div>
        <p className={styles.headerNote}>从桌面的秩序，到耳边的声音。<br/>一些小应用，照顾日常里的小细节。</p>
      </header>
      <div className={styles.gallery}>
        {projects.map((project, index) => {
          const scene = projectScenes[project.slug];
          const Scene = scene?.component;
          return <Link key={project.slug} href={`/projects/${project.slug}`} data-entrance className={`${styles.project} ${scene?.featured ? styles.featured : ''} ${scene?.className ?? styles.generic}`}>
            <div className={styles.copy}>
              <div className={styles.brand}><Image src={project.logo} alt="" width={30} height={30} unoptimized/><span>{project.name}</span><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span></div>
              <p className={styles.category}>{project.category} / {project.platform}</p>
              <h2>{scene?.headline ?? project.tagline}</h2>
              <p className={styles.description}>{scene?.description ?? project.description}</p>
              <span className={styles.visit}>探索 {project.presentation?.actionName ?? project.name}<ArrowUpRight size={18} aria-hidden="true"/></span>
            </div>
            <div className={styles.visual} aria-hidden="true">{Scene ? <Scene/> : <Image src={project.logo} alt="" width={120} height={120} unoptimized/>}</div>
          </Link>;
        })}
      </div>
      {!projects.length && <p className="py-16 text-center text-muted-foreground" data-entrance>作品正在整理中，稍后再来看看。</p>}
      <p className={styles.footer}>从一个小想法开始，让它成为每天用得上的工具。</p>
    </main>
  );
}
