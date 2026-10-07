import Link from 'next/link';
import styles from '@/app/projects/[slug]/landing.module.css';

/** Shared closing navigation for individual project pages. */
export function ProjectFooter({ name }: { name: string }) {
  return <footer className={styles.footer}><span>{name} · 玖捌小站</span><Link href="/feedback">反馈与建议</Link><Link href="/projects">探索其他项目 ↗</Link></footer>;
}
