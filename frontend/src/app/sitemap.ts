import type { MetadataRoute } from 'next';
import { projects } from '@/lib/projects';
import { publishedTools } from '@/lib/tools';
import { getSiteUrl } from '@/lib/site-url';
import { getSiteCatalog } from '@/lib/site-catalog';
import { selectEnabled } from '@/lib/catalog-state';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const catalog = await getSiteCatalog();
  const paths = ['/', '/projects', '/tools', '/feedback', '/privacy', ...selectEnabled(projects, catalog, 'project').map(project => `/projects/${project.slug}`), ...selectEnabled(publishedTools, catalog, 'tool').map(tool => tool.href)];
  return [...new Set(paths)].map(path => ({ url: `${base}${path === '/' ? '' : path}` }));
}
