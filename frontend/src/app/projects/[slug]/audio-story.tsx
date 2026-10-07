import type { Project, ProjectShowcase } from '@/lib/projects';
import { VoicemeeterShowcase } from './voicemeeter-showcase';
import { AppAudioPanel, SchedulePanel, ProfilePanel } from './audio-panels';
import styles from './landing.module.css';

const audioPanels = {
  appAudio: AppAudioPanel,
  schedule: SchedulePanel,
  profile: ProfilePanel,
} satisfies Record<ProjectShowcase['panel'], typeof AppAudioPanel>;

export function AudioStory({ project }: { project: Project }) {
  return (
    <section id="about" className={styles.story} aria-label="产品功能">
      {project.presentation?.showcases?.map((item, index) => {
        const Panel = audioPanels[item.panel];
        return (
          <article key={item.title} className={styles.showcase}>
            <div className={styles.showcaseCopy}><span className={styles.chapterNumber}>{String(index + 1).padStart(2, '0')}</span><h2>{item.title}</h2><p>{item.text}</p><p>{item.detail}</p></div>
            <div className={styles.showcasePanel}><Panel/><p className={styles.panelCaption}>界面复刻 · 虚构示例数据</p></div>
          </article>
        );
      })}
      <VoicemeeterShowcase/>
    </section>
  );
}
