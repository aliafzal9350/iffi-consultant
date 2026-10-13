import { site } from '@/data/content';
import { tools } from '@/data/config';
import type { Program, Province } from '@/types/data';
import { fmtCNY, joinList, plural } from '@/lib/format';
import { LEVEL_LABEL, LEVEL_ORDER, TIER_LABEL, cityTier, provincePath, provinceStats, type Tier } from '@/lib/programs';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, Disclaimer, Section } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { MiniMap } from '@/components/map/MiniMap';
import { ProgrammeCard } from '@/components/programmes/ProgrammeCard';
import { CompareProvinces } from '@/components/programmes/CompareProvinces';

/** Province page (Server Component): the page passes the province and its programmes. */
export default function ProvincePage({ p, list }: { p: Province; list: Program[] }) {
  const crumbs = [
    { name: 'Programmes', path: '/programmes' },
    { name: p.name, path: provincePath(p.name) },
  ];
  const levels = LEVEL_ORDER.filter((l) => p.programsByLevel[l]);
  const cityNames = p.cities.map((c) => c.name);
  const tiers = new Map<Tier, string[]>();
  (cityNames.length ? cityNames : [p.capital]).forEach((c) => {
    const t = cityTier(c);
    tiers.set(t, [...(tiers.get(t) ?? []), c]);
  });
  const cc = tools.costCalculator;

  return (
    <>
      <JsonLd crumbs={crumbs} />
      <PageHeader
        crumbs={crumbs}
        title={
          <>
            Study in {p.name}
            <span className="font-cjk ml-3 align-middle text-[0.6em] text-gold-2" lang="zh">
              {p.nameZh}
            </span>
          </>
        }
        lede={
          <>
            {plural(p.programCount, 'programme')} in our current list
            {cityNames.length ? ` in ${joinList(cityNames)}` : ', offered across the province'}: {levels.map((l) => `${LEVEL_LABEL[l]} ${p.programsByLevel[l]}`).join(', ')}.
            {p.sampleMajors.length > 0 && ` Popular majors include ${joinList(p.sampleMajors.slice(0, 4))}.`}
          </>
        }
        aside={
          <div className="overflow-hidden rounded-card border border-white/10 bg-navy-2/60 p-3">
            <MiniMap focus={p.name} active={p.name} labelCities aspect="4 / 3" ariaLabel={`Map of ${p.name} with the cities that have programmes`} />
          </div>
        }
      >
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-5">
          {provinceStats(p).map((s) => (
            <div key={s.label}>
              <dt className="text-[13px] text-mist/80">{s.label}</dt>
              <dd className="tabular mt-1 font-display text-xl font-semibold text-white">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 flex flex-wrap gap-3">
          <WhatsAppButton messageKey="provinceInterest" vars={{ province: p.name }}>
            Ask about {p.name}
          </WhatsAppButton>
          <Button to={`/programmes?province=${encodeURIComponent(p.name)}`} variant="outline-light">
            Filter in the finder
          </Button>
        </div>
      </PageHeader>

      <Section tone="paper" title={`Programmes in ${p.name}`} lede={site.disclaimers.universityNames} compact>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((prog) => (
            <li key={prog.id}>
              <ProgrammeCard p={prog} />
            </li>
          ))}
        </ul>
        {list.some((x) => x.level === 'MBBS') && (
          <Disclaimer tone="warn" className="mt-6">
            {site.disclaimers.mbbsRecognition}
          </Disclaimer>
        )}
        <Disclaimer className="mt-4">{site.disclaimers.dataFreshness}</Disclaimer>
      </Section>

      <Section tone="light" compact title={`Living costs in ${p.name}`} lede="Typical student budgets per month, excluding tuition. Use the calculator for a full estimate in your currency.">
        <div className="grid gap-5 md:grid-cols-2">
          {[...tiers.entries()].map(([tier, cities]) => (
            <div key={tier} className="rounded-card border border-line bg-white p-6">
              <p className="text-sm text-muted">{TIER_LABEL[tier]}</p>
              <p className="mt-1 font-display text-xl text-navy">{joinList(cities)}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {(['lean', 'standard', 'comfortable'] as const).map((l) => (
                  <div key={l}>
                    <dt className="capitalize text-muted">{l}</dt>
                    <dd className="tabular mt-0.5 font-medium text-navy">{fmtCNY(cc.livingMonthlyCNY[tier][l])}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-muted">Shared dorm from {fmtCNY(cc.accommodationMonthlyCNY.sharedDorm[tier])} a month.</p>
            </div>
          ))}
        </div>
        <Button to="/tools/cost-calculator" variant="navy" className="mt-6">
          Calculate my costs
        </Button>
        <p className="mt-4 text-[13px] text-muted">{site.disclaimers.costEstimate}</p>
      </Section>

      <Container className="pb-20">
        <CompareProvinces current={p.name} />
      </Container>
    </>
  );
}
