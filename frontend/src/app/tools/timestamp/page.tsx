import { withSocialMetadata } from '@/lib/social-metadata';
import motionStyles from '../tool-motion.module.css';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TimestampWorkbench } from './timestamp-workbench';

export const metadata = withSocialMetadata({
  alternates: { canonical: '/tools/timestamp' },
  title: '时间戳转换 · 玖捌小站',
  description: 'Unix 时间戳与日期互转，支持秒与毫秒、实时时钟、多种日期格式和快捷日期，全部在浏览器本地处理。',
});

export default function TimestampPage() {
  return <main className="page-container space-y-6 py-6 md:py-10">
    <header className={`${motionStyles.header} flex items-start gap-3`}>
      <Link href="/tools" aria-label="返回全部工具" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-secondary"><ChevronLeft size={20} aria-hidden="true" /></Link>
      <div><p className="text-xs tracking-widest text-muted-foreground">UNIX TIMESTAMP</p><h1 className="mt-1 text-2xl font-semibold text-primary">时间戳转换</h1><p className="mt-2 text-sm text-muted-foreground">Unix 时间戳与日期互转，实时掌握每一刻。</p></div>
    </header>
    <TimestampWorkbench />
  </main>;
}
