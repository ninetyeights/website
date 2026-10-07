import { NextResponse, type NextRequest } from 'next/server';
import { getSiteCatalog } from '@/lib/site-catalog';
import { isEntryEnabled, type CatalogKind } from '@/lib/catalog-state';

export async function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split('/').filter(Boolean);
  const kind: CatalogKind = parts[0] === 'tools' ? 'tool' : 'project';
  try {
    const entries = await getSiteCatalog();
    if (!isEntryEnabled(entries, kind, parts[1])) {
      // Resolve through Next's normal 404 UI before streaming any detail content.
      return NextResponse.rewrite(new URL('/_content-disabled', request.url), {
        status: 404,
        headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
      });
    }
    return NextResponse.next();
  } catch {
    return new NextResponse('网站内容暂时无法加载，请稍后重试。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '5', 'X-Robots-Tag': 'noindex' },
    });
  }
}

export const config = { matcher: ['/tools/:slug', '/projects/:slug', '/downloads/:project/:platform'] };
