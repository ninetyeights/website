import { resolveProjectDownload } from '@/lib/project-downloads';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ project: string; platform: string }> }) {
  const { project, platform } = await params;
  return resolveProjectDownload(project, platform);
}
