import type { Project } from '@/lib/projects';
import { Music2 } from 'lucide-react';
import styles from './landing.module.css';

export function LyricDropHero({ project }: { project: Project }) {
  return (
    <div className={styles.concept}>
      <Music2 size={42} strokeWidth={1.3} aria-hidden="true"/>
      <div className={styles.lyricArt} aria-hidden="true"><span>音乐在播放</span><strong>让歌词，轻轻落下</strong><span>把桌面留给喜欢的节奏</span><div className={styles.wave}>{Array.from({length:21},(_,i)=><i key={i} style={{height: 12 + ((i * 17) % 42)}}/>)}</div></div>
      <p>{project.presentation?.conceptCaption}</p>
      <small>功能概念示意，非软件截图</small>
    </div>
  );
}
