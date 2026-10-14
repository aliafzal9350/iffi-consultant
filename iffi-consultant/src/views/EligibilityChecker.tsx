'use client';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Lock, LockOpen, RotateCcw } from 'lucide-react';
import { Link } from '@/lib/router';
import { site } from '@/data/core';
import { tools } from '@/data/config';
import { cn } from '@/lib/cn';
import { fmtNumber, plural } from '@/lib/format';
import { EMPTY_PROFILE, approxPercent, runEligibility, scoreBand, unlockMore, type EnglishTest, type FundingPref, type Profile, type TeachingPref } from '@/lib/eligibility';
import { LEVEL_LABEL, LEVEL_ORDER } from '@/lib/programs';
import { KEYS, readJSON, writeJSON, removeKey } from '@/lib/storage';
import { CURRENCIES } from '@/lib/currency';
import { waHref } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, Disclaimer, Section } from '@/components/ui/primitives';
import { Field, Select, inputClass } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { ProgrammeCard } from '@/components/programmes/ProgrammeCard';
import { DocumentChecklist } from '@/components/programmes/DocumentChecklist';
import { ToolsCrossLinks } from '@/components/tools/ToolsCrossLinks';

const ec = tools.eligibilityChecker;
const crumbs = [
  { name: 'Tools', path: '/tools' },
  { name: 'Eligibility checker', path: '/tools/eligibility-checker' },
];
const STEPS = ['Level', 'Age', 'Last result', 'English', 'Chinese', 'Preferences', 'Budget and country'];
const TESTS = ec.englishTests as { id: EnglishTest; label: string; max?: number; step?: number }[];
const COUNTRIES = CURRENCIES.filter((c) => !['USD', 'GBP', 'EUR', 'CNY'].includes(c.code)).sort((a, b) => a.country.localeCompare(b.country));

interface Saved {
  profile: Profile;
  step: number;
  done: boolean;
}

function Choice<T extends string | number>({ name, value, current, onPick, title, hint }: { name: string; value: T; current: T; onPick: (v: T) => void; title: ReactNode; hint?: ReactNode }) {
  const checked = value === current;
  return (
    <label
      className={cn(
        'flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold',
        checked ? 'border-navy bg-navy/[0.03]' : 'border-line bg-white hover:border-navy/30',
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={() => onPick(value)} className="mt-1 h-4 w-4 shrink-0 accent-navy" />
      <span>
        <span className="block font-medium text-navy">{title}</span>
        {hint && <span className="mt-0.5 block text-[13.5px] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function stepValid(step: number, p: Profile): string | null {
  switch (step) {
    case 0:
      return p.level ? null : 'Choose the level you want to study.';
    case 1:
      return p.age != null && p.age >= 14 && p.age <= 65 ? null : 'Enter your age (14 to 65).';
    case 2:
      if (p.gradeMode === 'percentage') return p.percent != null && p.percent > 0 && p.percent <= 100 ? null : 'Enter your percentage (1 to 100).';
      return p.cgpa != null && p.cgpa > 0 && p.cgpa <= p.scale ? null : `Enter your CGPA (up to ${p.scale}).`;
    case 3: {
      if (p.englishTest === 'none' || p.englishTest === 'moi') return null;
      const t = TESTS.find((x) => x.id === p.englishTest);
      return p.englishScore != null && p.englishScore > 0 && p.englishScore <= (t?.max ?? 999) ? null : `Enter your ${t?.label} score.`;
    }
    default:
      return null;
  }
}

function summaryLine(p: Profile, matches: number): string {
  const pct = approxPercent(p);
  const eng = p.englishTest === 'none' ? 'no English test yet' : p.englishTest === 'moi' ? 'English-medium letter' : `${TESTS.find((t) => t.id === p.englishTest)?.label} ${p.englishScore}`;
  const country = COUNTRIES.find((c) => c.countryCode === p.country)?.country ?? p.country;
  return `${LEVEL_LABEL[p.level]}, age ${p.age}, ${pct != null ? `${fmtNumber(pct, 1)}%${p.gradeMode === 'cgpa' ? ' (approx.)' : ''}` : 'marks not given'}, ${eng}, HSK ${p.hsk}, ${
    p.teaching === 'either' ? 'any teaching language' : `${p.teaching}-taught`
  }, ${p.funding === 'full' ? 'full scholarship only' : p.funding === 'partial' ? 'partial scholarship OK' : 'self-funded OK'}${p.field ? `, ${p.field}` : ''}, bank ${
    ec.bankStatementOptions.find((b) => b.value === p.bank)?.label
  }, from ${country}: ${plural(matches, 'matching programme')}`;
}

export default function EligibilityChecker() {
  const [p, setP] = useState<Profile>(EMPTY_PROFILE);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readJSON<Saved | null>(KEYS.eligibility, null, 'session');
    if (saved?.profile) {
      setP({ ...EMPTY_PROFILE, ...saved.profile });
      setStep(Math.min(saved.step ?? 0, STEPS.length - 1));
      setDone(!!saved.done);
    }
  }, []);
  useEffect(() => {
    if (p !== EMPTY_PROFILE) writeJSON(KEYS.eligibility, { profile: p, step, done }, 'session');
  }, [p, step, done]);

  const set = (patch: Partial<Profile>) => {
    setP((cur) => ({ ...cur, ...patch }));
    setError(null);
  };

  const result = useMemo(() => (done && p.level ? runEligibility(p) : null), [done, p]);
  const gains = useMemo(() => (done && p.level ? unlockMore(p) : []), [done, p]);
  const pct = approxPercent(p);
  const band = scoreBand(pct);

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    const err = stepValid(step, p);
    if (err) {
      setError(err);
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setDone(true);
      track('eligibility_complete', { level: p.level });
      window.scrollTo({ top: 0 });
    }
  };
  const reset = () => {
    setP(EMPTY_PROFILE);
    setStep(0);
    setDone(false);
    removeKey(KEYS.eligibility, 'session');
  };

  const test = TESTS.find((t) => t.id === p.englishTest);

  let body: ReactNode = null;
  switch (step) {
    case 0:
      body = (
        <fieldset>
          <legend className="text-h3 font-display font-semibold text-navy">What do you want to study?</legend>
          <div className="mt-5 grid gap-2.5">
            {LEVEL_ORDER.map((l) => (
              <Choice key={l} name="level" value={l} current={p.level} onPick={(v) => set({ level: v })} title={LEVEL_LABEL[l]} hint={(ec.levels as Record<string, string>)[l]} />
            ))}
          </div>
        </fieldset>
      );
      break;
    case 1:
      body = (
        <Field label={<span className="text-h3 font-display">How old are you?</span>} error={error ?? undefined} hint="Some programmes have age limits (for example 18–25).">
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={!!error}
              type="number"
              inputMode="numeric"
              min={14}
              max={65}
              value={p.age ?? ''}
              onChange={(e) => set({ age: e.target.value ? Number(e.target.value) : null })}
              className={cn(inputClass, 'mt-3 max-w-[160px] text-lg')}
              autoFocus
            />
          )}
        </Field>
      );
      break;
    case 2:
      body = (
        <div>
          <fieldset>
            <legend className="text-h3 font-display font-semibold text-navy">Your last result</legend>
            <p className="mt-1 text-[15px] text-muted">{p.level === 'Master' ? 'Your Bachelor degree.' : p.level === 'PhD' ? 'Your Master degree.' : 'Your FSc, A-Level, HSC or equivalent.'}</p>
            <div className="mt-4 inline-flex rounded-full border border-line bg-white p-1">
              {(['percentage', 'cgpa'] as const).map((m) => (
                <label key={m} className={cn('cursor-pointer rounded-full px-4 py-2 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold', p.gradeMode === m ? 'bg-navy text-white' : 'text-ink')}>
                  <input type="radio" name="gradeMode" className="sr-only" checked={p.gradeMode === m} onChange={() => set({ gradeMode: m })} />
                  {m === 'percentage' ? 'Percentage' : 'CGPA'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            {p.gradeMode === 'percentage' ? (
              <Field label="Your percentage" error={error ?? undefined}>
                {({ id, describedBy }) => (
                  <input id={id} aria-describedby={describedBy} aria-invalid={!!error} type="number" min={1} max={100} step={0.1} inputMode="decimal" value={p.percent ?? ''} onChange={(e) => set({ percent: e.target.value ? Number(e.target.value) : null })} className={cn(inputClass, 'max-w-[160px]')} />
                )}
              </Field>
            ) : (
              <>
                <Field label="Your CGPA" error={error ?? undefined}>
                  {({ id, describedBy }) => (
                    <input id={id} aria-describedby={describedBy} aria-invalid={!!error} type="number" min={0} max={p.scale} step={0.01} inputMode="decimal" value={p.cgpa ?? ''} onChange={(e) => set({ cgpa: e.target.value ? Number(e.target.value) : null })} className={cn(inputClass, 'max-w-[140px]')} />
                  )}
                </Field>
                <Field label="Out of">
                  {({ id }) => (
                    <Select id={id} value={p.scale} onChange={(e) => set({ scale: Number(e.target.value) })} className="w-28">
                      {ec.gradeInput.cgpaScales.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc.toFixed(1)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {pct != null && <p className="pb-3 text-sm text-muted">≈ {fmtNumber(pct, 1)}% (approx.)</p>}
              </>
            )}
          </div>
        </div>
      );
      break;
    case 3:
      body = (
        <div>
          <fieldset>
            <legend className="text-h3 font-display font-semibold text-navy">English</legend>
            <p className="mt-1 text-[15px] text-muted">Many programmes in our list need no IELTS at all.</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {TESTS.map((t) => (
                <Choice key={t.id} name="eng" value={t.id} current={p.englishTest} onPick={(v) => set({ englishTest: v, englishScore: null })} title={t.label} />
              ))}
              <Choice name="eng" value={'none' as EnglishTest} current={p.englishTest} onPick={(v) => set({ englishTest: v, englishScore: null })} title="No test yet" />
            </div>
          </fieldset>
          {test?.max && (
            <Field label={`${test.label} score`} error={error ?? undefined} hint={`Up to ${test.max}`} className="mt-5">
              {({ id, describedBy }) => (
                <input id={id} aria-describedby={describedBy} aria-invalid={!!error} type="number" min={0} max={test.max} step={test.step} inputMode="decimal" value={p.englishScore ?? ''} onChange={(e) => set({ englishScore: e.target.value ? Number(e.target.value) : null })} className={cn(inputClass, 'max-w-[160px]')} />
              )}
            </Field>
          )}
        </div>
      );
      break;
    case 4:
      body = (
        <fieldset>
          <legend className="text-h3 font-display font-semibold text-navy">Chinese (HSK)</legend>
          <p className="mt-1 text-[15px] text-muted">Only Chinese-taught programmes ask for HSK.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ec.hskLevels.map((h) => (
              <label key={h} className={cn('inline-flex min-h-12 min-w-14 cursor-pointer items-center justify-center rounded-xl border px-4 text-[15px] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold', p.hsk === h ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy/30')}>
                <input type="radio" name="hsk" className="sr-only" checked={p.hsk === h} onChange={() => set({ hsk: h })} />
                {h === 0 ? 'None' : `HSK ${h}`}
              </label>
            ))}
          </div>
        </fieldset>
      );
      break;
    case 5:
      body = (
        <div className="space-y-7">
          <fieldset>
            <legend className="text-h3 font-display font-semibold text-navy">Teaching language</legend>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {(['English', 'Chinese', 'either'] as TeachingPref[]).map((t) => (
                <Choice key={t} name="teach" value={t} current={p.teaching} onPick={(v) => set({ teaching: v })} title={t === 'either' ? 'Either' : `${t}-taught`} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-h3 font-display font-semibold text-navy">Funding</legend>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {(
                [
                  ['full', 'Full scholarship only'],
                  ['partial', 'Partial scholarship OK'],
                  ['self', 'Self-funded OK'],
                ] as [FundingPref, string][]
              ).map(([v, label]) => (
                <Choice key={v} name="fund" value={v} current={p.funding} onPick={(x) => set({ funding: x })} title={label} />
              ))}
            </div>
          </fieldset>
          <Field label="Field of interest (optional)">
            {({ id }) => (
              <Select id={id} value={p.field} onChange={(e) => set({ field: e.target.value })} className="max-w-md">
                <option value="">Any field</option>
                {tools.finder.fields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      );
      break;
    case 6:
      body = (
        <div className="space-y-7">
          <fieldset>
            <legend className="text-h3 font-display font-semibold text-navy">Bank statement you can show</legend>
            <p className="mt-1 text-[15px] text-muted">Some universities ask for USD 2,500 to 5,000 in a family bank account.</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {ec.bankStatementOptions.map((b) => (
                <Choice key={b.value} name="bank" value={b.value} current={p.bank} onPick={(v) => set({ bank: v })} title={b.label} />
              ))}
            </div>
          </fieldset>
          <Field label="Your country">
            {({ id }) => (
              <Select id={id} value={p.country} onChange={(e) => set({ country: e.target.value })} className="max-w-md">
                {COUNTRIES.map((c) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.country}
                  </option>
                ))}
                <option value="other">Another country</option>
              </Select>
            )}
          </Field>
        </div>
      );
      break;
  }

  const extras =
    p.level === 'Master' || p.level === 'PhD'
      ? ['Two recommendation letters from professors', 'CV', 'Research proposal or study plan']
      : p.level === 'MBBS'
        ? ['Pre-medical (FSc / A-Level Biology and Chemistry) transcripts']
        : [];

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title="China Scholarship (CSC) Eligibility Checker"
        lede="Check your chances for Chinese Government (CSC), provincial and university scholarships in about two minutes, with or without IELTS, and see which programmes you match."
      />

      <Container narrow className="py-10 md:py-14">
        {!done ? (
          <form onSubmit={next} noValidate className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between gap-4 text-sm text-muted">
              <span>
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock size={14} aria-hidden="true" />
                Your answers stay in your browser
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Progress">
              <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>

            <div className="mt-8 min-h-[260px]">
              {body}
              {error && step !== 1 && step !== 2 && step !== 3 && (
                <p role="alert" className="mt-4 text-sm font-medium text-danger">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
              <Button variant="ghost" icon={<ArrowLeft size={17} aria-hidden="true" />} onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                Back
              </Button>
              <Button type="submit" variant="navy" size="lg">
                {step === STEPS.length - 1 ? 'See my results' : 'Next'}
              </Button>
            </div>
          </form>
        ) : (
          result && (
            <div className="space-y-10" aria-live="polite">
              <section className="relative overflow-hidden rounded-card bg-navy p-7 text-mist sm:p-9">
                <p className="relative text-sm text-gold-2">
                  Your profile: {pct != null ? `${fmtNumber(pct, 1)}%${p.gradeMode === 'cgpa' ? ' (approx.)' : ''}` : 'marks not given'}
                </p>
                <h2 className="relative mt-2 text-h2 text-white">{band.band}</h2>
                <p className="relative mt-2 max-w-xl text-lede">{band.text}</p>
                <p className="relative mt-6 text-[17px] text-white">
                  You match <strong className="font-display text-2xl text-gold-2">{result.matched.length}</strong> {result.matched.length === 1 ? 'programme' : 'programmes'} ({result.fullyFunded} fully funded,{' '}
                  {result.withStipend} with a stipend)
                  {result.near.length > 0 && <> and are close to {result.near.length} more</>}.
                </p>
                <div className="relative mt-7 flex flex-wrap gap-3">
                  <a
                    href={waHref('eligibilityResult', { summary: summaryLine(p, result.matched.length) })}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-6 font-medium text-navy hover:brightness-105"
                  >
                    <WhatsAppIcon size={19} />
                    Book my FREE eligibility assessment
                  </a>
                  {result.matched.length > 0 && (
                    <Button to={`/programmes?ids=${result.matched.map((m) => m.program.id).join(',')}`} variant="outline-light" size="lg">
                      See my matches
                    </Button>
                  )}
                </div>
              </section>

              {gains.length > 0 && (
                <section aria-labelledby="unlock-h" className="rounded-card border border-gold/35 bg-gold-soft/60 p-6">
                  <h2 id="unlock-h" className="flex items-center gap-2 text-h3">
                    <LockOpen size={20} aria-hidden="true" className="text-gold-deep" />
                    Qualify for more programmes
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-[15.5px]">
                    {gains.map((g) => (
                      <li key={g.label}>
                        {g.label.charAt(0).toUpperCase() + g.label.slice(1)} would qualify you for <strong className="text-navy">{plural(g.gain, 'more programme')}</strong>.
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {result.matched.length > 0 && (
                <section aria-labelledby="matches-h">
                  <h2 id="matches-h" className="text-h3">
                    Your top matches
                  </h2>
                  <ul className="mt-5 grid gap-5 md:grid-cols-2">
                    {result.matched.slice(0, 6).map((m) => (
                      <li key={m.program.id}>
                        <ProgrammeCard p={m.program} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {result.near.length > 0 && (
                <section aria-labelledby="near-h">
                  <h2 id="near-h" className="text-h3">
                    Near matches
                  </h2>
                  <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-white">
                    {result.near.slice(0, 8).map((m) => (
                      <li key={m.program.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <Link to={`/programmes/${m.program.slug}`} className="font-medium text-navy hover:underline">
                          {m.program.displayName} <span className="text-sm font-normal text-muted">({m.program.id})</span>
                        </Link>
                        <span className="text-sm text-muted">{m.verdict.reasons.join('; ')}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {result.not.length > 0 && (
                <details className="rounded-card border border-line bg-white p-5">
                  <summary className="cursor-pointer font-medium text-navy">Not eligible yet ({result.not.length}) and why</summary>
                  <ul className="mt-4 space-y-2 text-sm">
                    {result.not.map((m) => (
                      <li key={m.program.id}>
                        <span className="font-medium text-navy">{m.program.id}</span> {m.program.displayName}: <span className="text-muted">{m.verdict.reasons.join('; ')}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <DocumentChecklist id={`elig-${p.level}`} items={[...site.documentChecklist.general, ...extras]} title="Your document checklist" />

              {p.level === 'MBBS' && <Disclaimer tone="warn">{site.disclaimers.mbbsRecognition}</Disclaimer>}
              <Disclaimer>{ec.disclaimer}</Disclaimer>
              <Disclaimer>{site.disclaimers.dataFreshness}</Disclaimer>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setDone(false)}>
                  Edit my answers
                </Button>
                <Button variant="ghost" icon={<RotateCcw size={16} aria-hidden="true" />} onClick={reset}>
                  Start again
                </Button>
              </div>
            </div>
          )
        )}
      </Container>

      <Section tone="light" compact title="CSC scholarship requirements by level" lede="What universities and scholarship bodies usually expect before they look at your marks.">
        <dl className="grid gap-4 md:grid-cols-2">
          {LEVEL_ORDER.map((l) => (
            <div key={l} className="rounded-card border border-line bg-paper p-5">
              <dt className="font-display text-lg font-semibold text-navy">{LEVEL_LABEL[l]}</dt>
              <dd className="mt-1 text-[15px] text-muted">{(ec.levels as Record<string, string>)[l]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 max-w-3xl text-[15px] text-muted">
          Strong marks help, but they are not the whole picture: universities also weigh your study plan, recommendation letters and how early you apply.
          English-taught programmes in our list ask for IELTS 5.5 to 6.0 or a Duolingo score, and several need no IELTS at all.
        </p>
      </Section>

      <ToolsCrossLinks current="eligibility" />
    </>
  );
}
