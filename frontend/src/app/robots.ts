import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/livewire', '/api/', '/analytics/', '/downloads/', '/ui$', '/ui/', '/blog$', '/bookmarks$', '/extensions$', '/software$'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
