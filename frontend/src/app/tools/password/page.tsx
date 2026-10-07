import { withSocialMetadata } from '@/lib/social-metadata';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import motionStyles from '../tool-motion.module.css';
import { PasswordWorkbench } from './password-workbench';

export const metadata = withSocialMetadata({
  alternates: { canonical: '/tools/password' },
  title: '密码生成 · 玖捌小站',
  description: '在浏览器本地生成随机密码、单词短语和 PIN，支持自定义字符、批量生成及理论随机熵分析。',
});
export default function PasswordPage() {
  return <main className="page-container space-y-6 py-6 md:py-10">
    <header className={`${motionStyles.header} flex items-start gap-3`}>
      <Link href="/tools" aria-label="返回全部工具" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-secondary"><ChevronLeft size={20} aria-hidden="true" /></Link>
      <div><p className="text-xs tracking-widest text-muted-foreground">PASSWORD GENERATOR</p><h1 className="mt-1 text-2xl font-semibold text-primary">密码生成</h1><p className="mt-2 text-sm text-muted-foreground">随机密码、单词短语与 PIN，按你的规则生成。</p></div>
    </header>
    <PasswordWorkbench />
  </main>;
}
