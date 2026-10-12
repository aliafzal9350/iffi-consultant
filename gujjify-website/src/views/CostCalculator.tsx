'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/router';
import { Copy, Info } from 'lucide-react';
import { programById, programs, site, tools } from '@/data';
import { cn } from '@/lib/cn';
import { fmtCNY, fmtDate, fmtMoney, fmtNumber } from '@/lib/format';
import { ACCOMMODATION, ALL_CITIES, LIFESTYLE, calculate, defaultMonthly, scholarshipSaving, type Accommodation, type CostInput, type Lifestyle } from '@/lib/cost';
import { LEVEL_LABEL, LEVEL_ORDER, TIER_LABEL, programmeCity } from '@/lib/programs';
import { routeSeo } from '@/lib/seo';
import { waHref } from '@/lib/whatsapp';
import { useIsClient } from '@/hooks/useIsClient';
import { useCurrency } from '@/hooks/useCurrency';
import { useLists } from '@/hooks/useLists';
import { Seo } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, Disclaimer } from '@/components/ui/primitives';
import { Field, Select, inputClass } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { CurrencySelect } from '@/components/tools/CurrencySelect';
import { CostDonut } from '@/components/tools/CostDonut';
import { ToolsCrossLinks } from '@/components/tools/ToolsCrossLinks';

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const crumbs = [
  { name: 'Tools', path: '/tools' },
  { name: 'Cost calculator', path: '/tools/cost-calculator' },
];
const cc = tools.costCalculator;

interface UiState extends CostInput {
  mode: 'level' | 'programme';
  travel: number;
}

const DEFAULTS: UiState = {
  mode: 'level',
  level: 'Bachelor',
  programId: null,
  city: 'Nanjing',
  scenario: 'self',
  accommodation: 'sharedDorm',
  lifestyle: 'standard',
  firstYearFees: true,
  travel: 0,
  livingMonthly: null,
  accommodationMonthly: null,
};

function fromParams(sp: URLSearchParams): UiState {
  const pid = sp.get('program');
  const p = pid ? programById.get(pid) : undefined;
  const num = (k: string) => {
    const v = Number(sp.get(k));
    return sp.has(k) && Number.isFinite(v) && v >= 0 ? v : null;
  };
  return {
    ...DEFAULTS,
    mode: p ? 'programme' : 'level',
    programId: p?.id ?? null,
    level: p?.level ?? (LEVEL_ORDER as readonly string[]).find((l) => l === sp.get('level')) ?? DEFAULTS.level,
    city: p ? programmeCity(p) : ALL_CITIES.some((t) => t.cities.includes(sp.get('city') ?? '')) ? sp.get('city')! : DEFAULTS.city,
    scenario: cc.scholarshipScenarios.some((s) => s.id === sp.get('scenario')) ? sp.get('scenario')! : DEFAULTS.scenario,
    accommodation: ACCOMMODATION.some((a) => a.id === sp.get('acc')) ? (sp.get('acc') as Accommodation) : DEFAULTS.accommodation,
    lifestyle: LIFESTYLE.some((l) => l.id === sp.get('life')) ? (sp.get('life') as Lifestyle) : DEFAULTS.lifestyle,
    firstYearFees: sp.get('fees') !== '0',
    travel: num('travel') ?? 0,
    livingMonthly: num('living'),
    accommodationMonthly: num('rent'),
  };
}

function toParams(s: UiState): URLSearchParams {
  const sp = new URLSearchParams();
  if (s.mode === 'programme' && s.programId) sp.set('program', s.programId);
  else {
    sp.set('level', s.level);
    sp.set('city', s.city);
  }
  if (s.scenario !== 'self') sp.set('scenario', s.scenario);
  if (s.accommodation !== 'sharedDorm') sp.set('acc', s.accommodation);
  if (s.lifestyle !== 'standard') sp.set('life', s.lifestyle);
  if (!s.firstYearFees) sp.set('fees', '0');
  if (s.travel) sp.set('travel', String(s.travel));
  if (s.livingMonthly != null) sp.set('living', String(s.livingMonthly));
  if (s.accommodationMonthly != null) sp.set('rent', String(s.accommodationMonthly));
  return sp;
}

function RadioCards<T extends string>({ name, value, options, onChange, legend }: { name: string; value: T; options: { id: T; label: string; hint?: string; disabled?: boolean }[]; onChange: (v: T) => void; legend: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-navy">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={cn(
              'flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-[14.5px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold',
              value === o.id ? 'border-navy bg-navy/[0.03]' : 'border-line bg-white hover:border-navy/30',
              o.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input type="radio" name={name} value={o.id} checked={value === o.id} disabled={o.disabled} onChange={() => onChange(o.id)} className="mt-1 h-4 w-4 shrink-0 accent-navy" />
            <span>
              <span className="block font-medium text-navy">{o.label}</span>
              {o.hint && <span className="block text-[13px] text-muted">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function CostCalculator() {
  const isClient = useIsClient();
  const [params, setParams] = useSearchParams();
  const [s, setS] = useState<UiState>(DEFAULTS);
  const [programQuery, setProgramQuery] = useState('');
  const currency = useCurrency();
  const { notify } = useLists();

  // URL -> state once in the browser (the prerendered page shows the default scenario)
  useEffect(() => {
    if (isClient) setS(fromParams(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const update = (patch: Partial<UiState>) => {
    const next = { ...s, ...patch };
    setS(next);
    setParams(toParams(next), { replace: true, preventScrollReset: true });
  };

  const input: CostInput = { ...s, programId: s.mode === 'programme' ? s.programId : null };
  const r = useMemo(() => calculate(input), [JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps
  const saving = scholarshipSaving(input);
  const defaults = defaultMonthly(input);
  const scenario = cc.scholarshipScenarios.find((x) => x.id === s.scenario)!;
  const accFree = scenario.accommodationFree || r.program?.tuitionAndDormCombinedCNYPerYear != null || r.isCourse;

  const code = currency.code;
  const local = (cny: number) => currency.toLocal(cny);
  const rate = currency.rates.rates[code] ?? 1;
  const travelCNY = rate ? s.travel / rate : 0;
  const firstYearTotal = r.firstYear + travelCNY;
  const wholeTotal = r.whole + travelCNY;

  const programmeOptions = programs.filter((p) => {
    const q = programQuery.trim().toLowerCase();
    return !q || `${p.id} ${p.displayName} ${p.province} ${p.majors.join(' ')}`.toLowerCase().includes(q);
  });

  const summary = `${r.program ? `${r.program.id} ${r.program.displayName}` : `${LEVEL_LABEL[s.level]} in ${s.city}`}, ${scenario.label.toLowerCase()}, ${
    accFree ? 'accommodation included' : ACCOMMODATION.find((a) => a.id === s.accommodation)!.label.toLowerCase()
  }, ${s.lifestyle} lifestyle: first year about ${fmtMoney(local(firstYearTotal), code)} (${fmtCNY(Math.round(firstYearTotal))})`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Link to this estimate copied');
    } catch {
      notify('Copy the address bar to share this estimate');
    }
  };

  const seo = routeSeo('/tools/cost-calculator');
  const slices = [
    { label: r.isCourse ? 'Course fee (incl. hostel)' : 'Tuition', value: local(r.tuition), color: '#0d1f3f' },
    { label: 'Accommodation', value: local(r.accommodation), color: '#1c3a6b' },
    { label: 'Living', value: local(r.living), color: '#c8a24c' },
    { label: 'Insurance, permit and fees', value: local(r.fixed + r.extras), color: '#e0bd6b' },
    ...(s.travel ? [{ label: 'Flight and visa', value: s.travel, color: '#cdd6e6' }] : []),
  ];

  return (
    <>
      <Seo title={seo.title} description={seo.description} path="/tools/cost-calculator" breadcrumbs={crumbs} />
      <PageHeader
        crumbs={crumbs}
        title="Study in China Cost Calculator"
        lede="How much does it cost to study in China? Estimate tuition, hostel and living costs for your city and scholarship, converted into PKR, BDT, NGN, INR and 40 other currencies."
      />

      <Container className="py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()} aria-label="Cost calculator inputs">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-navy">Estimate</legend>
              <div className="inline-flex rounded-full border border-line bg-white p-1">
                {(
                  [
                    ['level', 'By level and city'],
                    ['programme', 'For a specific programme'],
                  ] as const
                ).map(([m, label]) => (
                  <label key={m} className={cn('cursor-pointer rounded-full px-4 py-2 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold', s.mode === m ? 'bg-navy text-white' : 'text-ink')}>
                    <input type="radio" name="mode" value={m} checked={s.mode === m} onChange={() => update({ mode: m, programId: m === 'programme' ? (s.programId ?? programs[0].id) : s.programId })} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {s.mode === 'programme' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Search programmes" hint="ID, city, province or major">
                  {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} type="search" value={programQuery} onChange={(e) => setProgramQuery(e.target.value)} className={inputClass} placeholder="e.g. Wuhan, MBBS, B-04" />}
                </Field>
                <Field label="Programme">
                  {({ id }) => (
                    <Select id={id} value={s.programId ?? ''} onChange={(e) => update({ programId: e.target.value })}>
                      {LEVEL_ORDER.map((l) => {
                        const opts = programmeOptions.filter((p) => p.level === l);
                        if (!opts.length) return null;
                        return (
                          <optgroup key={l} label={LEVEL_LABEL[l]}>
                            {opts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.id}: {p.displayName}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                      {s.programId && !programmeOptions.some((p) => p.id === s.programId) && <option value={s.programId}>{s.programId}</option>}
                    </Select>
                  )}
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Study level">
                  {({ id }) => (
                    <Select id={id} value={s.level} onChange={(e) => update({ level: e.target.value })}>
                      {LEVEL_ORDER.map((l) => (
                        <option key={l} value={l}>
                          {LEVEL_LABEL[l]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="City" hint={TIER_LABEL[r.tier]}>
                  {({ id, describedBy }) => (
                    <Select id={id} aria-describedby={describedBy} value={s.city} onChange={(e) => update({ city: e.target.value })}>
                      {ALL_CITIES.map((t) => (
                        <optgroup key={t.tier} label={TIER_LABEL[t.tier]}>
                          {t.cities.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
            )}

            {!r.isCourse && (
              <RadioCards
                legend="Scholarship"
                name="scenario"
                value={s.scenario}
                onChange={(v) => update({ scenario: v })}
                options={cc.scholarshipScenarios.map((x) => ({ id: x.id, label: x.label }))}
              />
            )}

            <RadioCards
              legend={accFree ? 'Accommodation (included in this scenario)' : 'Accommodation'}
              name="acc"
              value={s.accommodation}
              onChange={(v) => update({ accommodation: v, accommodationMonthly: null })}
              options={ACCOMMODATION.map((a) => ({ id: a.id, label: a.label, hint: `${fmtCNY(cc.accommodationMonthlyCNY[a.id][r.tier])}/month in a ${TIER_LABEL[r.tier].toLowerCase()}`, disabled: accFree }))}
            />

            <RadioCards
              legend="Lifestyle"
              name="life"
              value={s.lifestyle}
              onChange={(v) => update({ lifestyle: v, livingMonthly: null })}
              options={LIFESTYLE.map((l) => ({ id: l.id, label: `${l.label}, ${fmtCNY(cc.livingMonthlyCNY[r.tier][l.id])}/month`, hint: l.hint }))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your currency" hint={currency.rates.source === 'live' ? `Live rate, ${currency.rates.date ? fmtDate(currency.rates.date) : 'today'}` : `Rates from ${fmtDate(currency.rates.date)}`}>
                {({ id, describedBy }) => <CurrencySelect id={id} describedBy={describedBy} value={code} onChange={currency.setCode} />}
              </Field>
              <Field label={`Flight and visa (optional, ${code})`} hint={cc.optionalOneTime.join(', ')}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={s.travel || ''}
                    onChange={(e) => update({ travel: Math.max(0, Number(e.target.value) || 0) })}
                    className={inputClass}
                    placeholder="0"
                  />
                )}
              </Field>
            </div>

            {!r.isCourse && (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                <input type="checkbox" checked={s.firstYearFees} onChange={(e) => update({ firstYearFees: e.target.checked })} className="h-5 w-5 accent-navy" />
                Include first-year one-time fees (medical check, registration, application)
              </label>
            )}

            <details className="group rounded-card border border-line bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-navy">
                Assumptions and sources
                <span className="text-sm font-normal text-muted group-open:hidden">Show and edit</span>
              </summary>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Living cost per month (CNY)" hint={`Default ${fmtCNY(defaults.living)} for a ${TIER_LABEL[r.tier].toLowerCase()}`}>
                  {({ id, describedBy }) => (
                    <input id={id} aria-describedby={describedBy} type="number" min={0} inputMode="numeric" value={s.livingMonthly ?? defaults.living} onChange={(e) => update({ livingMonthly: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
                  )}
                </Field>
                <Field label="Accommodation per month (CNY)" hint={`Default ${fmtCNY(defaults.accommodation)}`}>
                  {({ id, describedBy }) => (
                    <input
                      id={id}
                      aria-describedby={describedBy}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      disabled={accFree}
                      value={s.accommodationMonthly ?? defaults.accommodation}
                      onChange={(e) => update({ accommodationMonthly: Math.max(0, Number(e.target.value) || 0) })}
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
              <ul className="mt-5 space-y-1.5 text-sm text-ink/85">
                <li>Insurance {fmtCNY(cc.fixedFeesCNY.insurancePerYear)} a year and residence permit {fmtCNY(cc.fixedFeesCNY.residencePermitPerYear)} a year.</li>
                <li>
                  First year: medical check {fmtCNY(cc.fixedFeesCNY.medicalCheckFirstYear)}, registration {fmtCNY(cc.fixedFeesCNY.registrationFirstYear)}, application{' '}
                  {fmtCNY(cc.fixedFeesCNY.applicationFeeOnce)}.
                </li>
                <li>Source for fees: the most common values in our programme brochures ({cc.fixedFeesCNY.evidence}).</li>
                <li>{cc.note}</li>
              </ul>
              {(s.livingMonthly != null || s.accommodationMonthly != null) && (
                <button type="button" onClick={() => update({ livingMonthly: null, accommodationMonthly: null })} className="mt-4 min-h-10 text-sm font-medium text-navy underline underline-offset-4">
                  Reset to defaults
                </button>
              )}
            </details>
          </form>

          {/* Results */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <section aria-labelledby="cost-result" className="overflow-hidden rounded-card border border-line bg-white shadow-lift">
              <div className="relative bg-navy p-6 text-mist">
                <div className="grain" aria-hidden="true" />
                <h2 id="cost-result" className="relative font-sans text-sm font-medium text-mist">
                  {r.isCourse ? 'Whole 6-month course' : 'First year, estimated'}
                </h2>
                <div aria-live="polite" className="relative">
                  <p className="tabular mt-1 font-display text-[2.6rem] font-semibold leading-tight text-white">{fmtMoney(local(firstYearTotal), code)}</p>
                  <p className="tabular text-sm text-gold-2">{fmtCNY(Math.round(firstYearTotal))}</p>
                  {!r.isCourse && (
                    <p className="mt-3 text-sm">
                      About <strong className="font-semibold text-white">{fmtMoney(local(r.monthly), code)}</strong> a month for rent and living
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-6 p-6">
                <CostDonut slices={slices} code={code} centerLabel={r.isCourse ? `Course, ${code}` : `Year 1, ${code}`} centerValue={compact.format(slices.reduce((n, x) => n + x.value, 0))} />
                {r.stipend > 0 && (
                  <p className="rounded-xl bg-good/10 px-4 py-3 text-sm text-ink">
                    Includes a stipend of <strong>{fmtMoney(local(r.stipend), code)}</strong> a year ({fmtCNY(r.stipend / 12)}/month), already subtracted from the total.
                  </p>
                )}
                {saving && (
                  <p className="rounded-xl border border-gold/30 bg-gold-soft/60 px-4 py-3 text-sm text-ink">
                    A scholarship could save you <strong className="text-navy">{fmtMoney(local(saving.saving), code)}</strong> in the first year {saving.label}.
                  </p>
                )}
                {!r.isCourse && (
                  <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
                    <div>
                      <dt className="text-muted">Each later year</dt>
                      <dd className="tabular mt-0.5 font-medium text-navy">{fmtMoney(local(r.laterYear), code)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Whole programme ({fmtNumber(r.years, 1)} years)</dt>
                      <dd className="tabular mt-0.5 font-medium text-navy">{fmtMoney(local(wholeTotal), code)}</dd>
                    </div>
                  </dl>
                )}
                {r.notes.length > 0 && (
                  <ul className="space-y-1.5 text-[13px] text-muted">
                    {r.notes.map((n) => (
                      <li key={n} className="flex gap-2">
                        <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-deep" />
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-2">
                  <a
                    href={waHref('costEstimate', { summary })}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-5 font-medium text-navy hover:brightness-105"
                  >
                    <WhatsAppIcon size={19} />
                    Get an exact quote on WhatsApp
                  </a>
                  <Button variant="outline" icon={<Copy size={16} aria-hidden="true" />} onClick={copyLink}>
                    Copy link to this estimate
                  </Button>
                </div>
                <p className="text-[12.5px] leading-relaxed text-muted">{site.disclaimers.costEstimate}</p>
              </div>
            </section>
            <Disclaimer className="mt-4">{site.disclaimers.dataFreshness}</Disclaimer>
            {(r.program?.level ?? s.level) === 'MBBS' && (
              <Disclaimer tone="warn" className="mt-3">
                {site.disclaimers.mbbsRecognition}
              </Disclaimer>
            )}
          </div>
        </div>
      </Container>

      <ToolsCrossLinks current="cost" />
    </>
  );
}
