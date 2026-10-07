type Release = { draft: boolean; prerelease: boolean; published_at: string; assets: { name: string; browser_download_url: string }[] };
const products: Record<string, { repo: string; preview: boolean; files: Record<string, RegExp> }> = {
  magidesk: { repo: 'MagiDesk', preview: true, files: { windows: /^MagiDesk-.*-win-x64-Setup-.*\.exe$/i } },
  audiodeviceswitcher: { repo: 'AudioDeviceSwitcher', preview: false, files: { windows: /^AudioDeviceSwitcher-Setup-.*\.exe$/i } },
  lyricdrop: { repo: 'LyricDrop', preview: false, files: { macos: /^LyricDrop-.*\.dmg$/i, windows: /^LyricDrop-Windows-.*-win-x64\.zip$/i } },
};

/** One bounded entry per supported repository, with shared in-flight requests. */
export function createDownloadResolver(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  const cache = new Map<string, { releases?: Release[]; fetchedAt?: number; retryAt: number; pending?: Promise<void> }>();
  return async (project: string, platform: string): Promise<Response> => {
    const product = Object.hasOwn(products, project) ? products[project] : undefined;
    const pattern = product && Object.hasOwn(product.files, platform) ? product.files[platform] : undefined;
    const headers = { 'Cache-Control': 'no-store' };
    if (!product || !pattern) return new Response('没有此项目或平台的下载。', { status: 404, headers });
    const fallback = `https://github.com/ninetyeights/${product.repo}/releases`;
    const entry = cache.get(product.repo) ?? { retryAt: 0 };
    cache.set(product.repo, entry);
    if ((!entry.releases || now() - (entry.fetchedAt ?? 0) >= 15 * 60_000) && now() >= entry.retryAt) {
      entry.pending ??= (async () => {
        try {
          const response = await fetcher(`https://api.github.com/repos/ninetyeights/${product.repo}/releases?per_page=100`, {
            cache: 'no-store', headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ninetyeights-downloads' }, signal: AbortSignal.timeout(10_000),
          });
          if (!response.ok) throw new Error('Release lookup failed');
          const releases: unknown = await response.json();
          if (!Array.isArray(releases) || !releases.every(release => release && typeof release.draft === 'boolean' && typeof release.prerelease === 'boolean' && typeof release.published_at === 'string' && Number.isFinite(Date.parse(release.published_at)) && Array.isArray(release.assets) && release.assets.every((asset: { name?: unknown; browser_download_url?: unknown }) => asset && typeof asset.name === 'string' && typeof asset.browser_download_url === 'string'))) throw new Error('Invalid release list');
          entry.releases = releases;
          entry.fetchedAt = now();
          entry.retryAt = 0;
        } catch {
          // Avoid repeated upstream requests while GitHub is unavailable/rate-limited.
          entry.retryAt = now() + 60_000;
        }
      })();
      await entry.pending;
      entry.pending = undefined;
    } else if (entry.pending) {
      await entry.pending;
    }
    if (entry.releases && now() - (entry.fetchedAt ?? 0) < 24 * 60 * 60_000) {
      const releases = entry.releases.filter(release => !release.draft && (product.preview || !release.prerelease)).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
      for (const release of releases) {
        for (const asset of release.assets.filter(asset => pattern.test(asset.name))) {
          try {
            const url = new URL(asset.browser_download_url);
            if (url.origin === 'https://github.com' && !url.username && !url.password && url.pathname.startsWith(`/ninetyeights/${product.repo}/releases/download/`)) {
              return new Response(null, { status: 302, headers: { ...headers, Location: url.href } });
            }
          } catch { /* Ignore malformed or untrusted asset URLs. */ }
        }
      }
    }
    return new Response(null, { status: 302, headers: { ...headers, Location: fallback } });
  };
}

export const resolveProjectDownload = createDownloadResolver();
