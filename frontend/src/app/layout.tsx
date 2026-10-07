import { withSocialMetadata } from '@/lib/social-metadata';
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { PageEntrance } from "@/components/page-entrance";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getSiteUrl } from "@/lib/site-url";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = withSocialMetadata({
  metadataBase: new URL(getSiteUrl()),
  title: "玖捌小站",
  description: "发现实用工具，探索软件与作品，记录使用心得和日常发现。",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-dvh flex-col antialiased"><SiteHeader /><PageEntrance>{children}<SiteFooter /></PageEntrance><GoogleAnalytics /></body>
    </html>
  );
}
