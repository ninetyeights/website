'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navigationItems } from '@/lib/navigation';

export function SiteHeader() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} pathname={pathname} />;
}

function HeaderContent({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  function links(mobile = false) {
    return navigationItems.map(({ href, label }) => {
      const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
      return (
        <Link key={href} href={href} aria-current={active ? 'page' : undefined}
          onClick={() => setOpen(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors motion-reduce:transition-none ${mobile ? 'flex min-h-11 items-center' : ''} ${active ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}>
          {label}
        </Link>
      );
    });
  }
  return (
    <header className="site-header glass-surface sticky top-0 z-40 shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}>
      <div className="page-container flex h-18 items-center justify-between gap-4">
        <Link href="/" aria-label="玖捌小站首页" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2.5">
          <Image src="/brand/jiuba-gray-cat-v1.png" alt="" width={44} height={44} className="size-11 object-contain" />
          <span className="text-lg font-semibold tracking-tight">玖捌小站</span>
        </Link>
        <nav aria-label="主导航" className="hidden items-center gap-1 lg:flex">{links()}</nav>
        <button ref={toggle} type="button" aria-label={open ? '收起菜单' : '展开菜单'} aria-expanded={open} aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
          className="flex size-11 items-center justify-center rounded-lg text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden">
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      <nav id="mobile-navigation" aria-label="移动端主导航" hidden={!open} className="max-h-[calc(100dvh-var(--site-header-height))] overflow-y-auto border-t lg:hidden">
        <div className="page-container grid gap-1 py-3">{links(true)}</div>
      </nav>
    </header>
  );
}
