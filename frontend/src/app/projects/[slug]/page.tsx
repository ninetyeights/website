import type { Metadata } from 'next';
import { withSocialMetadata } from '@/lib/social-metadata';
import { notFound } from 'next/navigation';
import { projects } from '@/lib/projects';
import { ProjectLanding } from './project-landing';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.filter(project => project.detailPage !== 'standalone').map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find(item => item.slug === slug);
  if (!project) notFound();
  return withSocialMetadata({
    title: `${project.name} · 官方网站`,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find(item => item.slug === slug);
  if (!project) notFound();
  return <ProjectLanding project={project}/>;
}


