export function getSiteUrl(): string {
  const url = new URL(process.env.SITE_URL || 'https://ninetyeights.com');
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an HTTP(S) origin, for example https://ninetyeights.com');
  }
  return url.origin;
}
