import Link from 'next/link';

export function SiteFooter() {
  return <footer data-entrance className="page-container flex h-12 shrink-0 items-center justify-end text-xs text-muted-foreground"><Link href="/privacy" className="inline-flex min-h-11 items-center px-2 hover:text-primary hover:underline">隐私说明</Link></footer>;
}
