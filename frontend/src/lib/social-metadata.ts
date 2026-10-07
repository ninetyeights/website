import type { Metadata } from 'next';

export function withSocialMetadata(metadata: Metadata): Metadata {
  const title = typeof metadata.title === 'string' ? metadata.title : '玖捌小站';
  const description = metadata.description || '发现实用工具，探索软件与作品，记录使用心得和日常发现。';
  const path = typeof metadata.alternates?.canonical === 'string' ? metadata.alternates.canonical : '/';
  const key = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
  const image = { url: `/social/${key}.png`, width: 1200, height: 630, alt: title };
  return {
    ...metadata,
    openGraph: { type: 'website', locale: 'zh_CN', siteName: '玖捌小站', title, description, url: path, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
