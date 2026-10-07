import { withSocialMetadata } from '@/lib/social-metadata';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import motionStyles from '../tool-motion.module.css';
import { LinkWorkbench } from './link-workbench';

export const metadata = withSocialMetadata({
  alternates: { canonical: '/tools/link-extract' }, title: '链接提取 · 玖捌小站', description: '从文本、网页、HTML 和 Markdown 中本地提取链接，支持原版表格模式、去重、筛选、复制和导出。' });
export default function LinkExtractPage() {
  return <main className="page-container space-y-6 py-6 md:py-10">
    <header className={`${motionStyles.header} flex items-start gap-3`}>
      <Link href="/tools" aria-label="返回全部工具" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-secondary"><ChevronLeft size={20} aria-hidden="true" /></Link>
      <div><p className="text-xs tracking-widest text-muted-foreground">LINK EXTRACTOR</p><h1 className="mt-1 text-2xl font-semibold text-primary">链接提取</h1><p className="mt-2 text-sm text-muted-foreground">从文字、网页和表格中整理链接，保留你需要的字段。</p></div>
    </header>
    <LinkWorkbench />
  </main>;
}
