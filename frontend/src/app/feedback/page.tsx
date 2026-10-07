import { withSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from 'next';
import { ExternalLink, MessageSquare } from 'lucide-react';

export const metadata: Metadata = withSocialMetadata({
  alternates: { canonical: '/feedback' },
  title: '反馈与建议 · 玖捌小站',
  description: '反馈网站、在线工具与桌面项目的使用问题，或分享你的功能需求。',
});

const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf4_YSI-I2opueuwHViundYlhbk5dm27qyLcJ6WXNzEvoDXag/viewform';

export default function FeedbackPage() {
  return <main className="page-container flex-1 py-10 md:py-16">
    <header className="mx-auto max-w-4xl space-y-4">
      <p className="flex items-center gap-2 text-sm font-medium text-primary"><MessageSquare size={18} aria-hidden="true"/>反馈与建议</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">哪里不顺手，告诉我。</h1>
      <p className="leading-7 text-muted-foreground">发现了 Bug，或有一个想要的功能？无论是网站、在线工具还是桌面项目，都欢迎在这里留下反馈。</p>
      <p className="text-sm leading-7 text-muted-foreground">可在详细说明中附上截图或录屏链接。联系方式选填，可留下邮箱或 Microsoft Teams 联系方式，方便跟进。</p>
    </header>
    <section aria-label="提交反馈" className="surface mx-auto mt-8 max-w-4xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary/30 px-4 py-4 md:px-6">
        <span className="text-xs leading-6 text-muted-foreground">表单由 Google Forms 提供；提交内容将交由 Google 表单处理。</span>
        <a href={formUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">独立打开表单<ExternalLink size={15} aria-hidden="true"/><span className="sr-only">（新标签页）</span></a>
      </div>
      <iframe src={formUrl + '?embedded=true'} title="玖捌小站反馈与建议表单" className="block h-[2200px] w-full border-0 bg-white sm:h-[1750px]" referrerPolicy="strict-origin-when-cross-origin"/>
    </section>
    <p className="mx-auto mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">表单未显示或提交遇到问题？请尝试上方的“独立打开表单”。截图和录屏链接请开放查看权限，并遮挡个人信息。</p>
  </main>;
}
