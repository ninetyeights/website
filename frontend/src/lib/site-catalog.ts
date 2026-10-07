import { cache } from 'react';
import { parseCatalog } from './catalog-state';

// Memoize within a server render, without retaining stale flags between requests.
export const getSiteCatalog = cache(async () => {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:8000';
  const response = await fetch(`${base}/api/site-catalog`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Site catalog unavailable');
  return parseCatalog(await response.json());
});
