import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { provinces } from '@/data/places';
import { site } from '@/data/content';
import { provinceKeywords } from '@/data/keywords';
import { provinceProgrammes } from '@/lib/catalog';
import { fmtCNY, joinList, plural } from '@/lib/format';
import { LEVEL_LABEL, LEVEL_ORDER, provinceBySlug, provincePath, provinceSlug } from '@/lib/programs';
import { pageMetadata } from '@/lib/metadata';
import ProvincePage from '@/views/ProvincePage';

interface Props {
  params: Promise<{ province: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return provinces.map((p) => ({ province: provinceSlug(p.name) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = provinceBySlug((await params).province);
  if (!p) return {};
  const levels = LEVEL_ORDER.filter((l) => p.programsByLevel[l]);
  const cityNames = p.cities.map((c) => c.name);
  return pageMetadata({
    title: `Study in ${p.name}, China – ${plural(p.programCount, 'programme')} | ${site.brand.name}`,
    description: `Study in ${p.name}, China: ${plural(p.programCount, 'programme')} (${levels.map((l) => LEVEL_LABEL[l]).join(', ')})${cityNames.length ? ` in ${joinList(cityNames)}` : ''}${p.maxStipendCNYPerMonth ? `, stipends up to ${fmtCNY(p.maxStipendCNYPerMonth)}/month` : ''}. Costs, scholarships and free advice.`,
    path: provincePath(p.name),
    keywords: provinceKeywords(p),
  });
}

export default async function Page({ params }: Props) {
  const p = provinceBySlug((await params).province);
  if (!p) notFound();
  return <ProvincePage p={p} list={provinceProgrammes(p)} />;
}
