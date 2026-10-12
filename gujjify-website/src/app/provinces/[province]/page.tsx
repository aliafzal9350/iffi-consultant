import { Suspense } from 'react';
import type { Metadata } from 'next';
import { provinces } from '@/data';
import { fmtCNY, joinList, plural } from '@/lib/format';
import { LEVEL_LABEL, LEVEL_ORDER, provinceBySlug, provincePath, provinceSlug } from '@/lib/programs';
import { clampDescription } from '@/lib/seo';
import ProvincePage from '@/views/ProvincePage';

interface Props {
  params: Promise<{ province: string }>;
}

export function generateStaticParams() {
  return provinces.map((p) => ({ province: provinceSlug(p.name) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province: slug } = await params;
  const p = provinceBySlug(slug);
  if (!p) {
    return {
      title: 'Province Not Found | IFFI Global',
    };
  }

  const levels = LEVEL_ORDER.filter((l) => p.programsByLevel[l]);
  const cityNames = p.cities.map((c) => c.name);
  const description = clampDescription(
    `Study in ${p.name}, China: ${plural(p.programCount, 'programme')} (${levels.map((l) => LEVEL_LABEL[l]).join(', ')})${cityNames.length ? ` in ${joinList(cityNames)}` : ''}${p.maxStipendCNYPerMonth ? `, stipends up to ${fmtCNY(p.maxStipendCNYPerMonth)}/month` : ''}. Costs, scholarships and free advice.`
  );
  const title = `Study in ${p.name}, China – ${plural(p.programCount, 'programme')} | IFFI Global`;
  const path = provincePath(p.name);

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
      <ProvincePage />
    </Suspense>
  );
}
