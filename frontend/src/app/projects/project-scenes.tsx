import type { ComponentType } from 'react';
import { Headphones, Speaker, Volume2, Mic, Music2, Play, SkipForward, PanelTop, LayoutGrid, MousePointer2, Check } from 'lucide-react';
import styles from './projects.module.css';

function DesktopScene() {
  return <div className={styles.desktop}>
    <div className={styles.desktopTop}><span>我的工作空间</span><span>◦ ◦ ◦</span></div>
    <div className={`${styles.window} ${styles.notes}`}><div className={styles.windowBar}><span className={styles.dots}/><span>灵感笔记</span></div><div className={styles.noteContent}><small>TODAY, A LITTLE MORE FOCUS.</small><strong>把想法，<br/>放在对的位置。</strong><i/><i/><i/></div></div>
    <div className={`${styles.window} ${styles.browser}`}><div className={styles.windowBar}><span className={styles.dots}/><span>工作 · 浏览器</span></div><div className={styles.browserContent}><span/><div><i/><i/><i/></div></div></div>
    <div className={`${styles.window} ${styles.layout}`}><LayoutGrid size={18}/><span>窗口已归位</span><Check size={14}/></div>
    <div className={styles.cursor}><MousePointer2 size={23} fill="white"/><span>Shift + 拖动</span></div>
    <div className={styles.dock}><PanelTop size={19}/><LayoutGrid size={19}/><span>M</span><span className={styles.avatar}>C</span><span className={styles.avatar}>W</span></div>
    <span className={styles.sceneLabel}>A LITTLE ORDER. A LOT OF FLOW.</span>
  </div>;
}

function AudioScene() {
  return <div className={styles.audioScene}>
    <div className={styles.audioPanel}><div className={styles.audioTop}><span><span className={styles.statusDot}/>当前音频方案</span><span>Ctrl + Alt + 1</span></div><div className={styles.audioTitle}><Headphones size={26}/><div><strong>专注时刻</strong><small>输出与输入，一起到位</small></div><Check size={18}/></div><div className={styles.device}><Headphones size={19}/><span>耳机<small>Headphones</small></span><span className={styles.selected}>正在使用</span></div><div className={`${styles.device} ${styles.speaker}`}><Speaker size={19}/><span>桌面音箱<small>Speakers</small></span><span className={styles.deviceArrow}>↗</span></div><div className={styles.volume}><Volume2 size={16}/><div><i/></div><span>68</span></div></div>
    <div className={styles.micBadge}><Mic size={15}/><span>麦克风已就绪</span><span className={styles.statusDot}/></div>
  </div>;
}

function LyricsScene() {
  return <div className={styles.lyricsScene}>
    <div className={styles.orbit}/><span className={styles.lyricPrevious}>把忙碌留在昨天</span><strong className={styles.lyricCurrent}>让喜欢的旋律<br/>轻轻落在眼前</strong><span className={styles.lyricNext}>这一刻，跟着节奏慢一点</span>
    <div className={styles.player}><span className={styles.album}><Music2 size={23}/></span><div><strong>属于你的播放时刻</strong><span>本地音乐 · 桌面歌词</span></div><Play size={17} fill="currentColor"/><SkipForward size={17}/></div>
    <div className={styles.wave}>{Array.from({length: 30}, (_, i) => <i key={i} style={{height: `${8 + ((i * 13) % 27)}px`}}/>)}</div>
  </div>;
}

type ProjectScene = { component: ComponentType; className: string; featured?: boolean; headline: string; description: string };

export const projectScenes: Partial<Record<string, ProjectScene>> = {
  magidesk: { component: DesktopScene, className: styles.magidesk, featured: true, headline: '给桌面一点秩序。\n给自己一点余地。', description: '窗口各就其位，账号一眼分清。把那些反复的小操作，收进一个顺手的桌面工具箱。' },
  audiodeviceswitcher: { component: AudioScene, className: styles.audio, headline: '声音，切到对的地方。', description: '从耳机到音箱，从工作到娱乐。保存你的设备组合，用一个快捷键切换日常场景。' },
  lyricdrop: { component: LyricsScene, className: styles.lyrics, headline: '让歌词，轻轻落下。', description: '音乐在耳边，歌词在桌面。一个轻巧的播放器，陪你听歌，也陪你慢下来。' },
};
