import Image from 'next/image';
import { Headphones, Monitor, Music2 } from 'lucide-react';
import type { Project, ProjectIcon } from '@/lib/projects';
import { AudioDemo } from './audio-demo';
import { AudioStory } from './audio-story';
import { LyricDropHero } from './lyricdrop-hero';
import styles from './landing.module.css';

type ContentProps = { project: Project };

export const projectIcons = {
  monitor: Monitor,
  headphones: Headphones,
  music: Music2,
} satisfies Record<ProjectIcon, typeof Monitor>;

export function DefaultHero({ project }: ContentProps) {
  const Icon = projectIcons[project.presentation?.icon ?? 'monitor'];
  return project.screenshot ? (
    <figure className={styles.screenshot}>
      <Image src={project.screenshot.src} alt={project.screenshot.alt} width={764} height={906} sizes="(max-width: 900px) 90vw, 45vw" priority/>
      <figcaption>产品界面 · 以发布版本为准</figcaption>
    </figure>
  ) : (
    <div className={styles.concept}>
      <Icon size={42} strokeWidth={1.3} aria-hidden="true"/>
      <p>{project.name}</p>
      <small>功能概念示意，非软件截图</small>
    </div>
  );
}

export function FeatureStory({ project }: ContentProps) {
  // Derive the number of chapters from the features so new projects lose no content.
  const chapters = Array.from({ length: Math.ceil(project.features.length / 2) }, (_, index) => ({
    title: project.presentation?.chapters?.[index] ?? project.features[index * 2].title,
    features: project.features.slice(index * 2, index * 2 + 2),
  }));
  return (
    <section id="about" className={styles.story} aria-label="产品功能">
      {chapters.map((chapter, index) => (
        <article key={index} className={styles.chapter}>
          <div className={styles.chapterHeading}><span className={styles.chapterNumber}>{String(index + 1).padStart(2, '0')}</span><h2>{chapter.title}</h2></div>
          <div className={styles.chapterBody}>
            {chapter.features.map(feature => <div key={feature.title} className={styles.feature}><h3>{feature.title}</h3><p>{feature.description}</p></div>)}
          </div>
        </article>
      ))}
    </section>
  );
}

export const heroComponents = { audio: AudioDemo, lyrics: LyricDropHero };
export const storyComponents = { audio: AudioStory };
