export const dynamic = 'force-dynamic';

export function GET() {
  const measurementId = process.env.GA_MEASUREMENT_ID?.trim() ?? '';
  const domains = (process.env.GA_ALLOWED_DOMAINS ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const enabled = process.env.NODE_ENV === 'production' && /^G-[A-Z0-9]+$/.test(measurementId) && domains.length > 0;
  return Response.json(enabled ? { measurementId, domains } : null, { headers: { 'Cache-Control': 'no-store' } });
}
