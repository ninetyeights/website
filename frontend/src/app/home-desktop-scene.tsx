import { MousePointer2, Move, Check } from 'lucide-react';
import styles from './home-desktop-scene.module.css';

/** A compact feature illustration for the homepage, separate from the project gallery. */
export function HomeDesktopScene() {
  return <div className={styles.scene}>
    <div className={styles.heading}><span>MAGIDESK / 你的桌面，随手掌控</span><span>◦ ◦ ◦</span></div>
    <div className={styles.ghost}/>
    <div className={`${styles.browser} ${styles.work}`}>
      <div className={styles.titlebar}><span className={styles.dots}/><span>Chrome · 工作空间</span></div>
      <div className={styles.address}>项目文档 / 今日计划</div>
      <div className={styles.document}><small>A LITTLE MORE FOCUS.</small><i/><i/></div>
      <span className={`${styles.badge} ${styles.workBadge}`}><b>林</b><span>工作 · 林</span></span>
    </div>
    <div className={`${styles.browser} ${styles.personal}`}>
      <div className={styles.titlebar}><span className={styles.dots}/><span>Edge · 个人空间</span></div>
      <div className={styles.address}>收藏 / 我的日常</div>
      <div className={styles.tiles}><span/><span/><span/></div>
      <span className={`${styles.badge} ${styles.personalBadge}`}><b>周</b><span>生活 · 周</span></span>
    </div>
    <div className={styles.cursor}><MousePointer2 size={26} fill="white"/><span>Alt + 左键拖动</span></div>
    <div className={styles.dragHint}><Move size={14}/><span>不用寻找标题栏</span></div>
    <div className={styles.badgeHint}><Check size={12}/><span>浏览器微标 · 多账号一眼分清</span></div>
  </div>;
}
