import { withSocialMetadata } from '@/lib/social-metadata';
import Link from 'next/link';
import { ArrowUpRight, Copy, Languages, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { publishedTools } from '@/lib/tools';
import { getSiteCatalog } from '@/lib/site-catalog';
import { selectEnabled } from '@/lib/catalog-state';
import { ToolDirectory } from './tool-directory';

export const metadata = withSocialMetadata({
  alternates: { canonical: '/tools' },
  title: '工具 · 玖捌小站',
  description: '让日常工作更轻松的在线工具，打开即用，无需注册。',
});

const highlights = [
  { icon: ScanLine, label: '自动识别原文语言' },
  { icon: Languages, label: '长文自动分段翻译' },
  { icon: Copy, label: '译文一键复制' },
];

export default async function ToolsPage() {
  const tools = selectEnabled(publishedTools, await getSiteCatalog(), 'tool');
  return (
    <main className="page-container space-y-12 py-10 max-md:space-y-8 max-md:py-6">
      <section className="flex flex-wrap items-end justify-between gap-6" data-entrance-group>
        <div className="max-w-2xl space-y-3" data-entrance>
          <Badge variant="secondary">工具箱 · 持续补充</Badge>
          <h1 className="text-4xl leading-tight font-bold max-md:text-[28px]">
            趁手的小工具，打开就能用。
          </h1>
          <p className="text-muted-foreground">
            不用注册，也不用下载。把手边的文本、数据与日常琐事，交给一个个小而专的页面处理完。
          </p>
        </div>
        <dl className="surface flex items-center gap-6 px-6 py-4" data-entrance>
          <div>
            <dt className="text-xs text-muted-foreground">已上线</dt>
            <dd className="text-2xl font-semibold text-primary">
              {tools.length}
            </dd>
          </div>
        </dl>
      </section>
      {tools.some(tool => tool.slug === 'translate') && <section aria-labelledby="featured-tool" className="glass-stage" data-entrance-group>
        <div className="glass-surface grid items-center gap-8 rounded-2xl p-6 md:grid-cols-[1fr_auto] md:p-10">
          <div className="max-w-xl space-y-4" data-entrance>
            <Badge variant="secondary">现已可用 · 免费使用</Badge>
            <h2
              id="featured-tool"
              className="text-2xl leading-snug font-semibold md:text-[28px]"
            >
              文本翻译
            </h2>
            <p className="text-sm text-slate-600">
              粘贴任意语言的段落，自动识别原文并翻译成简体中文。长文会自动分段处理，译完一键复制。
            </p>
            <Link
              href="/tools/translate"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              开始翻译 <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid gap-3 md:w-56">
            {highlights.map((item) => (
              <li
                data-entrance
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-white bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm"
              >
                <span className="text-primary">
                  <item.icon size={18} aria-hidden="true" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </section>}
      <ToolDirectory slugs={tools.map(tool => tool.slug)} />
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-xs text-muted-foreground">
        <span>玖捌小站 · 工具</span>
        <span>小而实用，打开即用。</span>
      </footer>
    </main>
  );
}
