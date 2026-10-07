import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: '开发标准 · 玖捌小站', robots: { index: false, follow: false } };

export default function UiLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  return children;
}
