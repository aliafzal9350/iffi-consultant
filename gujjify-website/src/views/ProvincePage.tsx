'use client';
import { useMemo, useState } from 'react';
import { useParams } from '@/lib/router';
import { programById, provinces, site, tools } from '@/data';
import type { Program, Province } from '@/types/data';
import { fmtCNY, fmtNumber, joinList, plural } from '@/lib/format';
import { LEVEL_LABEL, LEVEL_ORDER, TIER_LABEL, cityTier, provinceBySlug, provincePath, type Tier } from '@/lib/programs';
import { clampDescription } from '@/lib/seo';
import { Seo } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, Disclaimer, Section } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';
import { MiniMap } from '@/components/map/MiniMap';
import { ProgrammeCard } from '@/components/programmes/ProgrammeCard';
import NotFound from './NotFound';

function stats(p: Province) {
  return [
    { label: 'Programmes', value: String(p.programCount) },
    { label: 'Cities', value: p.cities.length ? String(p.cities.length) : 'Province-wide' },
    { label: 'English-taught', value: String(p.englishTaughtCount) },
    { label: 'Fully funded', value: String(p.fullyFundedCount) },
    { label: 'Highest stipend', value: p.maxStipendCNYPerMonth ? `${fmtNumber(p.maxStipendCNYPerMonth)} CNY/mo` : 'None listed' },
  ];
}

function CompareProvinces({ current }: { current: Province }) {
  const others = provinces.filter((p) => p.name !== current.name);
  const [other, setOther] = useState(others[0].name);
  const b = provinces.find((p) => p.name === other)!;
  const rows = [
    ...stats(current).map((s, i) => ({ label: s.label, a: s.value, b: stats(b)[i].value })),
    {
      label: 'Levels',
      a: LEVEL_ORDER.filter((l) => current.programsByLevel[l]).map((l) => `${LEVEL_LABEL[l]} ${current.programsByLevel[l]}`).join(', '),
      b: LEVEL_ORDER.filter((l) => b.programsByLevel[l]).map((l) => `${LEVEL_LABEL[l]} ${b.programsByLevel[l]}`).join(', '),
    },
  ];
  return (
    <div className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="compare-province" className="font-display text-xl text-navy">
          Compare {current.name} with
        </label>
        <Select id="compare-province" value={other} onChange={(e) => setOther(e.target.value)} className="w-56">
          {others.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <table className="mt-5 w-full text-left text-[15px]">
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col" className="py-2 font-medium text-navy">
              {current.name}
            </th>
            <th scope="col" className="py-2 font-medium text-navy">
              {b.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line last:border-0">
              <th scope="row" className="py-2.5 pr-3 font-normal text-muted">
                {r.label}
              </th>
              <td className="py-2.5 pr-3">{r.a}</td>
              <td className="py-2.5">{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button to={provincePath(b.name)} variant="outline" size="sm" className="mt-5">
        Open {b.name}
      </Button>
    </div>
  );
}

export default function ProvincePage() {
  const { province: slug = '' } = useParams();
  const p = provinceBySlug(slug);
  const list = useMemo<Program[]>(
    () => (p ? p.programIds.map((id) => programById.get(id)).filter((x): x is Program => !!x).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })) : []),
    [p],
  );
  if (!p) return <NotFound />;

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
  const description = clampDescription(
    `Study in ${p.name}, China: ${plural(p.programCount, 'programme')} (${levels.map((l) => LEVEL_LABEL[l]).join(', ')})${cityNames.length ? ` in ${joinList(cityNames)}` : ''}${p.maxStipendCNYPerMonth ? `, stipends up to ${fmtCNY(p.maxStipendCNYPerMonth)}/month` : ''}. Costs, scholarships and free advice.`,
  );

  return (
    <>
      <Seo title={`Study in ${p.name}, China – ${plural(p.programCount, 'programme')} | IFFI Global`} description={description} path={provincePath(p.name)} breadcrumbs={crumbs} />
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
          {stats(p).map((s) => (
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
        <CompareProvinces current={p} />
      </Container>
    </>
  );
}
