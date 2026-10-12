'use client';
import { Link } from '@/lib/router';
import { ChevronRight } from 'lucide-react';
import { tools } from '@/data';
import { cn } from '@/lib/cn';
import { fmtNumber } from '@/lib/format';
import { TOOLS } from '@/lib/toolsMeta';
import { Seo } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section, IconTile } from '@/components/ui/primitives';
import { FinalCta } from '@/components/sections/HomeSections';

const crumbs = [{ name: 'Tools', path: '/tools' }];
const QUESTION: Record<string, string> = {
  finder: 'which universities and programmes they can apply to',
  cost: 'what studying in China really costs',
  eligibility: 'whether they qualify for a scholarship',
};

export default function ToolsHub() {
  const ranking = tools.demandEvidence.ranking;
  const max = Math.max(...ranking.map((r) => r.keywords));
  const markets = tools.currency.currencies.filter((c) => c.keywordDemand > 0).length;
  const total = tools.demandEvidence.source.match(/([\d,]+) Google/)?.[1] ?? '';
  return (
    <>
      <Seo
        title="Free Study in China Tools: Finder, Cost & CSC Eligibility | IFFI Global"
        description="Three free tools for studying in China: a university and programme finder, a cost calculator in 40+ currencies and a CSC scholarship eligibility checker."
        path="/tools"
        breadcrumbs={crumbs}
      />
      <PageHeader
        crumbs={crumbs}
        title="Free tools to plan your studies in China"
        lede="Find programmes, budget in your own currency and check your scholarship chances. No sign-up, and your answers stay in your browser."
      />

      <Section tone="paper" compact>
        <ul className="grid gap-6 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <li key={t.id}>
              <Link to={t.path} className="group flex h-full flex-col rounded-card border border-line bg-white p-7 shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift">
                <IconTile className="h-12 w-12">
                  <t.icon size={22} />
                </IconTile>
                <h2 className="text-h3 mt-6">{t.name}</h2>
                <p className="mt-2 text-[15px] text-muted">{t.description}</p>
                <p className="mt-2 text-[15px] text-ink">{t.benefit}</p>
                <p className="mt-6 border-t border-line pt-4 text-[13.5px] text-muted">
                  Students in {t.markets} countries ask Google {QUESTION[t.id]} in {fmtNumber(t.keywords)} different ways.
                </p>
                <span className="mt-5 inline-flex items-center gap-1 font-medium text-navy">
                  Open the tool
                  <ChevronRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        tone="light"
        compact
        title="Why these three tools"
        lede={`We studied ${total} Google search phrases about studying in China from students in ${markets} countries. These were the questions asked most widely, so we built answers for them first.`}
      >
        <ol className="max-w-3xl space-y-3">
          {ranking.map((r) => {
            const selected = tools.demandEvidence.selected.includes(r.tool);
            return (
              <li key={r.tool} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-4 text-[14.5px]">
                <span className={cn(selected ? 'font-medium text-navy' : 'text-muted')}>{r.tool}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <span className={cn('block h-full rounded-full', selected ? 'bg-gold' : 'bg-navy/25')} style={{ width: `${(r.keywords / max) * 100}%` }} />
                </span>
                <span className="tabular text-right text-muted">{fmtNumber(r.keywords)} phrases</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-[13px] text-muted">Source: Google autocomplete research across {markets} countries, October 2026. Gold bars are the tools on this site.</p>
      </Section>

      <FinalCta />
    </>
  );
}
