import Link from 'next/link';
import { withSocialMetadata } from '@/lib/social-metadata';

export const metadata = withSocialMetadata({
  title: '隐私说明 · 玖捌小站',
  description: '了解本站的访问统计、翻译服务、反馈表单与浏览器本地工具如何处理数据。',
  alternates: { canonical: '/privacy' },
});

const sections = [
  { title: '访问与操作统计', paragraphs: [
    '配置 Google Analytics 后，本站仅在指定的正式域名启用统计，本地开发访问不计入。统计可能包括访问页面、来源、访问时间与互动情况，以及浏览器、设备和大致地区等信息，并使用 Cookie 区分访问者与会话。',
    '本站自定义事件记录工具成功操作、项目下载、GitHub 链接点击和独立打开反馈表单，仅发送固定的工具名称、项目名称、平台或页面路径，不发送工具输入、提取结果、对比文本、翻译正文或生成的密码。本站关闭了 Google Signals 和广告个性化信号。',
    '访问统计可能包含页面网址和来源网址，请勿在 URL 参数中放入私人内容。',
  ], link: { href: 'https://support.google.com/analytics/answer/6004245?hl=zh-Hans', label: 'Google Analytics 数据说明' } },
  { title: '文本翻译', paragraphs: [
    '翻译原文会发送至你选择的服务。Google 翻译由浏览器直接请求 Google；Google Cloud 和微软 Azure Translator 通过本站后端转发至对应服务。长文本会分段发送，译文返回浏览器显示。',
    '本站不保存翻译原文或译文，后端记录请求状态、耗时等运行信息，并根据访问 IP 控制并发请求。第三方服务按各自的数据政策处理请求，请勿提交密码、密钥或不希望交给第三方的敏感内容。',
  ] },
  { title: '反馈表单', paragraphs: [
    '反馈页面嵌入 Google Forms，打开时浏览器会连接 Google。提交的反馈、附件链接及你填写的联系方式由 Google Forms 处理，并由网站维护者查看，用于了解问题和跟进反馈。联系方式选填，截图和录屏请遮挡私人信息。',
    '本站无法读取跨域表单中的填写内容，也不将其发送至本站统计事件。',
  ], link: { href: 'https://policies.google.com/privacy?hl=zh-CN', label: 'Google 隐私政策' } },
  { title: '在浏览器本地处理的工具', paragraphs: [
    '链接提取（含表格模式）、文字对比、时间戳转换和密码生成的输入、计算和结果均在浏览器内处理，不上传至本站服务器或第三方处理服务。',
    '复制时会写入系统剪贴板，导出时生成本地下载文件。加载页面仍需请求网站资源，启用统计时可能记录访问或固定的操作事件，但不包含输入和结果。',
  ] },
];

export default function PrivacyPage() {
  return <main className="page-container flex-1 py-10 md:py-16">
    <header data-entrance className="mx-auto max-w-3xl space-y-3">
      <p className="text-xs tracking-widest text-muted-foreground">PRIVACY</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">隐私说明</h1>
      <p className="leading-7 text-muted-foreground">哪些数据交由第三方处理，哪些内容留在你的浏览器中。</p>
      <p className="text-xs text-muted-foreground">更新日期：2026 年 10 月 7 日</p>
    </header>
    <div className="mx-auto mt-8 max-w-3xl space-y-6">{sections.map(section => <section data-entrance key={section.title} className="surface space-y-3 p-5 md:p-6">
      <h2 className="text-lg font-semibold">{section.title}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph} className="text-sm leading-7 text-muted-foreground">{paragraph}</p>)}
      {section.link && <a href={section.link.href} className="inline-block text-sm text-primary underline underline-offset-4" target="_blank" rel="noopener noreferrer">{section.link.label}</a>}
    </section>)}
      <p data-entrance className="text-sm leading-7 text-muted-foreground">有疑问可通过 <Link href="/feedback" className="text-primary underline underline-offset-4">反馈页面</Link> 联系网站维护者。</p>
    </div>
  </main>;
}
