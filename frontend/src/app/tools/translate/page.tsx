import { withSocialMetadata } from '@/lib/social-metadata';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TranslationWorkbench } from './translation-workbench';

export const metadata = withSocialMetadata({
  alternates: { canonical: '/tools/translate' },
  title: '文本翻译 · 玖捌小站',
  description: '自动识别原文语言，翻译为简体中文。',
});

export default function TranslationPage() {
  return (
    <main className="translation-stage page-container relative isolate flex flex-col gap-6 py-6 lg:h-[calc(100dvh-var(--site-header-height)-3rem)] lg:min-h-[34rem] lg:shrink-0">
      <div className="translation-decoration pointer-events-none fixed inset-x-0 bottom-0 top-[var(--site-header-height)] -z-10 overflow-hidden" aria-hidden="true">
        <div className="translation-decoration-right translation-language-motif translation-language-motif-target">
          <span className="translation-motif-orbit" />
          <span className="translation-motif-card">译</span>
          <span className="translation-motif-dot" />
          <span className="translation-motif-ticks" />
        </div>
        <div className="translation-decoration-left translation-language-motif translation-language-motif-source">
          <span className="translation-motif-orbit" />
          <span className="translation-motif-card">Aa</span>
          <span className="translation-motif-dot" />
          <span className="translation-motif-ticks" />
        </div>
      </div>
      <header className="flex shrink-0 items-center gap-3">
        <Link
          href="/tools"
          aria-label="返回全部工具"
          title="返回全部工具"
          className="group inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ChevronLeft size={20} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
        </Link>
        <div className="flex min-w-0 items-baseline gap-4">
          <h1 className="shrink-0 text-xl font-semibold tracking-tight text-[#153f33] md:text-2xl">
            文本翻译
          </h1>
          <p className="hidden truncate text-[13px] text-muted-foreground md:block">让不同语言，在这里读懂。</p>
        </div>
      </header>
      <TranslationWorkbench />
    </main>
  );
}
