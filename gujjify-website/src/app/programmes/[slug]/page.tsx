import { Suspense } from 'react';
import type { Metadata } from 'next';
import { programs, programBySlug } from '@/data';
import { majorsCount, programPath, programmeSummary } from '@/lib/programs';
import { clampDescription } from '@/lib/seo';
import ProgrammeDetail from '@/views/ProgrammeDetail';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = programBySlug.get(slug);
  if (!p) {
    return {
      title: 'Programme Not Found | IFFI Global',
    };
  }

  const title = `${p.displayName}${programs.some((o) => o.id !== p.id && o.displayName === p.displayName && o.majors.length === p.majors.length) ? ` (${p.id})` : ''} – ${majorsCount(p)} | IFFI Global`;
  const description = clampDescription(
    `${p.displayName}, ${p.province} China: ${programmeSummary(p)}. ${majorsCount(p)}${p.majors.length ? ` incl. ${p.majors.slice(0, 2).join(', ')}` : ''}. Costs, requirements and documents.`
  );
  const path = programPath(p);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://www.iffiglobal.com${path}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.iffiglobal.com${path}`,
      siteName: 'IFFI Global Education Consultants',
    },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-paper" aria-busy="true" />}>
      <ProgrammeDetail />
    </Suspense>
  );
}
