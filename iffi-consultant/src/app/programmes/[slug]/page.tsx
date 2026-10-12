import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { programBySlug, programs } from '@/data/catalog';
import { site } from '@/data/content';
import { programKeywords } from '@/data/keywords';
import { needsIdInTitle, similarProgrammes } from '@/lib/catalog';
import { majorsCount, programPath, programmeSummary } from '@/lib/programs';
import { pageMetadata } from '@/lib/metadata';
import ProgrammeDetail from '@/views/ProgrammeDetail';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = programBySlug.get((await params).slug);
  if (!p) return {};
  return pageMetadata({
    title: `${p.displayName}${needsIdInTitle(p) ? ` (${p.id})` : ''} – ${majorsCount(p)} | ${site.brand.name}`,
    description: `${p.displayName}, ${p.province} China: ${programmeSummary(p)}. ${majorsCount(p)}${p.majors.length ? ` incl. ${p.majors.slice(0, 2).join(', ')}` : ''}. Costs, requirements and documents.`,
    path: programPath(p),
    keywords: programKeywords(p),
  });
}

export default async function Page({ params }: Props) {
  const p = programBySlug.get((await params).slug);
  if (!p) notFound();
  return <ProgrammeDetail p={p} similar={similarProgrammes(p, 3)} />;
}
