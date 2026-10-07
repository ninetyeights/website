import { withSocialMetadata } from '@/lib/social-metadata';
import motionStyles from '../tool-motion.module.css';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CompareWorkbench } from './compare-workbench';

export const metadata = withSocialMetadata({
  alternates: { canonical: '/tools/text-compare' },
  title: '文字对比 · 玖捌小站',
  description: '在浏览器本地比较两段文字，定位新增、删除与修改，支持忽略格式差异。',
});

export default function TextComparePage() {
  return <main className="page-container space-y-6 py-6 md:py-10">
    <header className={`${motionStyles.header} flex items-start gap-3`}>
      <Link href="/tools" aria-label="返回全部工具" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-secondary"><ChevronLeft size={20} /></Link>
      <div><p className="text-xs tracking-widest text-muted-foreground">TEXT COMPARE</p><h1 className="mt-1 text-2xl font-semibold text-primary">文字对比</h1><p className="mt-2 text-sm text-muted-foreground">从一字之差，到整段变化。文本仅在本地浏览器中处理。</p></div>
    </header>
    <CompareWorkbench />
  </main>;
}
