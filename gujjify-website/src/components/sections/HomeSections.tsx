'use client';
import { useState } from 'react';
import { Link } from '@/lib/router';
import { BadgeCheck, Check, ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { meta, programs, provinces, site, tools } from '@/data';
import { cn } from '@/lib/cn';
import { fmtCNY, fmtNumber, plural } from '@/lib/format';
import { TOOLS } from '@/lib/toolsMeta';
import { runFinder, EMPTY } from '@/lib/filters';
import { runEligibility, EMPTY_PROFILE } from '@/lib/eligibility';
import { calculate } from '@/lib/cost';
import { LEVEL_LABEL, LEVEL_ORDER, isEnglishTaught, provincePath } from '@/lib/programs';
import { SHOW_DRAFTS } from '@/lib/env';
import { Section, Disclaimer, DraftBadge, IconTile } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { DataIcon } from '@/components/ui/Icon';
import { Accordion } from '@/components/ui/Accordion';
import { Tabs } from '@/components/ui/Tabs';
import { Crest } from '@/components/ui/Logo';
import { ProgrammeCard } from '@/components/programmes/ProgrammeCard';

/* 1. Trust strip --------------------------------------------------------- */
export function TrustStrip() {
  // the first three figures (programmes, provinces, cities) are already in the hero
  const stats = site.stats.dataBacked.slice(3);
  return (
    <section aria-label="Our programme list in numbers" className="border-b border-line bg-white">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s, i) => (
          <div key={s.label} className={cn('py-8 md:py-10', i % 2 === 1 && 'pl-5 md:pl-0', 'md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0')}>
            <p className="tabular font-display text-[2.2rem] font-semibold leading-none text-navy">{typeof s.value === 'number' ? fmtNumber(s.value) : s.value}</p>
            <p className="mt-2 text-sm leading-snug text-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-line bg-paper/60">
        <ul className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 text-sm text-ink sm:px-6 lg:px-8">
          <li className="inline-flex items-center gap-2">
            <ShieldCheck size={17} aria-hidden="true" className="text-gold-deep" />
            UK registered company ({site.legal.companyNumber})
          </li>
          <li className="inline-flex items-center gap-2">
            <MessageCircle size={17} aria-hidden="true" className="text-gold-deep" />
            WhatsApp support, {site.contact.hours.replace('Open ', '').replace(' on WhatsApp', '')}
          </li>
          <li className="inline-flex items-center gap-2">
            <BadgeCheck size={17} aria-hidden="true" className="text-gold-deep" />
            Free counselling
          </li>
          {SHOW_DRAFTS &&
            site.stats.marketingClaims.items.map((m) => (
              <li key={m.label} className="inline-flex items-center text-muted">
                {m.value} {m.label}
                <DraftBadge note={site.stats.marketingClaims.note} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}

/* 2. Three global tools --------------------------------------------------- */
const finderPreview = runFinder({ ...EMPTY, level: ['Bachelor'], lang: 'English', funding: ['free'] }).length;
const eligibilityPreview = runEligibility({ ...EMPTY_PROFILE, level: 'Bachelor', age: 19, percent: 75, englishTest: 'none', bank: 2500 }).matched.length;
const costPreview = calculate({ level: 'Bachelor', programId: null, city: 'Nanjing', scenario: 'self', accommodation: 'sharedDorm', lifestyle: 'standard', firstYearFees: true });

function ToolPreview({ id }: { id: string }) {
  if (id === 'finder') {
    return (
      <div className="rounded-xl border border-line bg-paper p-4">
        <div className="flex flex-wrap gap-1.5 text-[12.5px]">
          {['Bachelor', 'English-taught', 'Tuition-free option'].map((c) => (
            <span key={c} className="rounded-full bg-navy px-2.5 py-0.5 text-white">
              {c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink">
          <span className="tabular font-display text-2xl font-semibold text-navy">{finderPreview}</span> programmes match
        </p>
      </div>
    );
  }
  if (id === 'cost') {
    const parts = [
      { label: 'Tuition', v: costPreview.tuition, c: 'bg-navy' },
      { label: 'Dorm', v: costPreview.accommodation, c: 'bg-navy-3' },
      { label: 'Living', v: costPreview.living, c: 'bg-gold' },
      { label: 'Fees', v: costPreview.fixed + costPreview.extras, c: 'bg-gold-2' },
    ];
    const total = parts.reduce((n, p) => n + p.v, 0);
    return (
      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="text-sm text-ink">
          Bachelor in a tier-2 city: about <strong className="font-semibold text-navy">{fmtCNY(tools.costCalculator.livingMonthlyCNY.tier2.standard)}</strong> a month to live
        </p>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full" aria-hidden="true">
          {parts.map((p) => (
            <span key={p.label} className={p.c} style={{ width: `${(p.v / total) * 100}%` }} />
          ))}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-muted">
          {parts.map((p) => (
            <span key={p.label}>{p.label}</span>
          ))}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <p className="text-[12.5px] text-muted">Example: Bachelor, 75% marks, no IELTS yet</p>
      <p className="mt-2 text-sm text-ink">
        <span className="tabular font-display text-2xl font-semibold text-navy">{eligibilityPreview}</span> programmes to explore
      </p>
    </div>
  );
}

export function ToolsSection() {
  return (
    <Section
      id="tools"
      tone="paper"
      title="Three free tools to plan your studies in China"
      lede="Find a programme, work out the cost in your own currency and check your scholarship chances before you talk to anyone."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {TOOLS.map((t) => (
          <article key={t.id} className="group relative flex flex-col rounded-card border border-line bg-white p-6 shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift">
            <IconTile>
              <t.icon size={21} />
            </IconTile>
            <h3 className="text-h3 mt-5">
              <Link to={t.path} className="after:absolute after:inset-0 after:rounded-card">
                {t.name}
              </Link>
            </h3>
            <p className="mt-2 text-[15px] text-muted">{t.description}</p>
            <div className="mt-5">
              <ToolPreview id={t.id} />
            </div>
            <p className="mt-5 flex items-center gap-1 text-sm font-medium text-navy">
              {t.id === 'finder' ? 'Open the finder' : t.id === 'cost' ? 'Calculate my costs' : 'Check my eligibility'}
              <ChevronRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Built from what students in {tools.currency.currencies.filter((c) => c.keywordDemand > 0).length} countries search for when they plan to study in China.
      </p>
    </Section>
  );
}

/* 3. Where you can study ------------------------------------------------------ */
function ProvinceTile({ name, compact }: { name: string; compact?: boolean }) {
  const p = provinces.find((x) => x.name === name)!;
  const levels = LEVEL_ORDER.filter((l) => p.programsByLevel[l]).map((l) => LEVEL_LABEL[l]);
  if (compact) {
    return (
      <Link to={provincePath(p.name)} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-mist hover:border-gold-2/60 hover:text-white">
        <span>
          {p.name}
          <span className="font-cjk ml-2 text-[13px] text-gold-2/90" lang="zh">
            {p.nameZh}
          </span>
        </span>
        <span className="tabular text-sm text-gold-2">{p.programCount}</span>
      </Link>
    );
  }
  return (
    <Link
      to={provincePath(p.name)}
      className="group relative flex h-full w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-white/10 bg-navy-2 p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-gold/50 sm:w-[280px]"
    >
      <span className="font-cjk pointer-events-none absolute -right-2 -top-3 text-[92px] leading-none text-gold/10 transition-colors group-hover:text-gold/20" aria-hidden="true">
        {p.nameZh}
      </span>
      <span className="relative font-display text-[1.6rem] font-semibold text-white">{p.name}</span>
      <span className="relative mt-1 text-sm text-gold-2">{plural(p.programCount, 'programme')}</span>
      <span className="relative mt-5 text-[13.5px] text-mist">{levels.join(', ')}</span>
      <span className="relative mt-1 text-[13.5px] text-mist/75">{p.cities.length ? p.cities.map((c) => c.name).join(', ') : 'Province-wide'}</span>
      {p.maxStipendCNYPerMonth && <span className="relative mt-auto pt-5 text-[13px] text-white">Stipends up to {fmtNumber(p.maxStipendCNYPerMonth)} CNY/month</span>}
    </Link>
  );
}

export function ProvincesSection() {
  const [all, setAll] = useState(false);
  const top = provinces.slice(0, 8);
  return (
    <Section
      id="where"
      tone="dark"
      title="Where you can study in China"
      lede={`Our current list covers ${meta.counts.provinces} provinces and municipalities. Most programmes sit in the affordable cities of eastern China, from Jiangsu and Zhejiang to Hubei and Sichuan.`}
    >
      <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {top.map((p) => (
          <li key={p.name} className="lg:[&>a]:w-auto">
            <ProvinceTile name={p.name} />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          aria-controls="all-provinces"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm text-white hover:border-gold-2 hover:text-gold-2"
        >
          {all ? 'Show fewer' : `See all ${meta.counts.provinces} provinces`}
        </button>
        <ul id="all-provinces" hidden={!all} className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {provinces.map((p) => (
            <li key={p.name}>
              <ProvinceTile name={p.name} compact />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* 4. Programme highlights --------------------------------------------------------- */
export function HighlightsSection() {
  const fullyFunded = [...programs].filter((p) => p.fullyFunded).sort((a, b) => (b.stipendCNYPerMonth ?? 0) - (a.stipendCNYPerMonth ?? 0) || b.majors.length - a.majors.length);
  const noIelts = programs.filter((p) => p.noIeltsRequired && p.level !== 'Language');
  const mbbs = programs.filter((p) => p.level === 'MBBS').sort((a, b) => (a.tuitionStandardCNYPerYear ?? 0) - (b.tuitionStandardCNYPerYear ?? 0));
  const englishBachelor = programs
    .filter((p) => p.level === 'Bachelor' && isEnglishTaught(p))
    .sort((a, b) => (a.ranking?.china ?? 999) - (b.ranking?.china ?? 999));
  const maxStipend = Math.max(...programs.map((p) => p.stipendCNYPerMonth ?? 0));

  const panel = (items: typeof programs, link: string, linkLabel: string, extra?: React.ReactNode) => (
    <div>
      {extra}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((p) => (
          <ProgrammeCard key={p.id} p={p} />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button to={link} variant="navy">
          {linkLabel}
        </Button>
        <p className="max-w-xl text-[13px] text-muted">{site.disclaimers.dataFreshness}</p>
      </div>
    </div>
  );

  return (
    <Section
      id="highlights"
      tone="light"
      title="Scholarships and programmes in our current list"
      lede="Fully funded Master and PhD offers, routes without IELTS, English-taught MBBS and Bachelor programmes. University names are shared during your free consultation."
    >
      <Tabs
        label="Programme highlights"
        items={[
          {
            id: 'funded',
            label: `Fully funded (${programs.filter((p) => p.fullyFunded).length})`,
            content: panel(
              fullyFunded,
              '/programmes?funding=full',
              'See all fully funded offers',
              <p className="mb-6 text-[15px] text-ink">
                Master and PhD offers with free tuition, a free dorm and a monthly stipend of up to {fmtCNY(maxStipend)}.
              </p>,
            ),
          },
          {
            id: 'noielts',
            label: `No IELTS required (${noIelts.length})`,
            content: panel(
              noIelts,
              '/programmes?noielts=1',
              'See all programmes without IELTS',
              <p className="mb-6 text-[15px] text-ink">The brochure states that no IELTS or Duolingo score is needed. Many others do not state a requirement at all: ask us.</p>,
            ),
          },
          {
            id: 'mbbs',
            label: `MBBS in China (${mbbs.length})`,
            content: panel(
              mbbs,
              '/programmes?level=MBBS',
              'See all MBBS programmes',
              <Disclaimer tone="warn" className="mb-6">
                {site.disclaimers.mbbsRecognition}
              </Disclaimer>,
            ),
          },
          {
            id: 'bachelor',
            label: `English-taught Bachelor (${englishBachelor.length})`,
            content: panel(englishBachelor, '/programmes?level=Bachelor&lang=English', 'See all English-taught Bachelor programmes'),
          },
        ]}
      />
    </Section>
  );
}

/* 5. Services ------------------------------------------------------------------- */
export function ServicesSection() {
  return (
    <Section
      id="services"
      tone="paper"
      title="China admission, CSC scholarship and student visa services"
      lede="One team for the whole journey, from choosing a university to landing in China."
      action={
        <Button to="/services" variant="outline">
          All services
        </Button>
      }
    >
      <ul className="grid gap-x-12 gap-y-1 md:grid-cols-2">
        {site.services.map((s) => (
          <li key={s.id} className="border-t border-line">
            <Link to={`/services#${s.id}`} className="group flex gap-4 py-6">
              <IconTile light>
                <DataIcon name={s.icon} size={20} />
              </IconTile>
              <span>
                <span className="block font-display text-[1.2rem] font-semibold leading-snug text-navy group-hover:text-navy-3">{s.title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-muted">{s.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* 6. How it works ----------------------------------------------------------------- */
export function ProcessSection({ tone = 'light' }: { tone?: 'light' | 'paper' }) {
  return (
    <Section id="process" tone={tone} title={site.process.title} lede="Your free eligibility assessment is the first step. We handle the paperwork from there.">
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ol className="relative space-y-0">
          {site.process.steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-5 pb-9 last:pb-0">
              {i < site.process.steps.length - 1 && <span className="absolute left-[21px] top-12 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-gold/60 to-line" aria-hidden="true" />}
              <span className="tabular relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-white font-display text-lg font-semibold text-navy">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="font-display text-[1.2rem]">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="self-start rounded-card bg-navy p-7 text-mist shadow-lift">
          <h3 className="text-h3 text-white">Behind every admission letter</h3>
          <ul className="mt-5 space-y-3">
            {site.process.behindTheScenes.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[15px]">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-2">
                  <Check size={14} aria-hidden="true" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <WhatsAppButton messageKey="heroConsultation" variant="gold" className="mt-7 w-full">
            Book my free assessment
          </WhatsAppButton>
        </div>
      </div>
    </Section>
  );
}

/* 7. Why IFFI Global ----------------------------------------------------------------------- */
export function WhyUsSection() {
  return (
    <Section id="why" tone="paper">
      <div className="grid items-stretch gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative overflow-hidden rounded-[22px] bg-navy p-8 text-mist sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
          <div className="grain" aria-hidden="true" />
          <div className="relative">
            <Crest size={72} />
            <h2 className="text-h2 mt-8 text-white">Why students choose IFFI Global Education Consultants</h2>
            <p className="mt-4 max-w-md leading-relaxed">{site.about.values}</p>
            <p className="mt-6 text-sm text-mist/80">
              {site.legal.companyName}, registered in {site.legal.registeredIn} (company no. {site.legal.companyNumber}), with an office in Lahore.
            </p>
          </div>
        </div>
        <ul className="grid gap-x-8 gap-y-8 self-center sm:grid-cols-2">
          {site.whyUs.map((w) => (
            <li key={w.title}>
              <IconTile light>
                <DataIcon name={w.icon} size={20} />
              </IconTile>
              <h3 className="mt-4 font-display text-[1.25rem]">{w.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{w.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* 8. FAQ preview ------------------------------------------------------------------------- */
export function FaqPreview() {
  const items = site.faq.filter((f) => f.status === 'published').slice(0, 5);
  return (
    <Section
      id="faq"
      tone="light"
      title="Studying in China: common questions"
      action={
        <Button to="/faq" variant="outline">
          All FAQs
        </Button>
      }
    >
      <div className="max-w-3xl">
        <Accordion items={items.map((f, i) => ({ id: `f${i}`, title: f.q, content: <p>{f.a}</p> }))} />
      </div>
    </Section>
  );
}

/* 9. Final CTA band ------------------------------------------------------------------------ */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-paper px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      <div
        className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[26px] px-6 py-14 text-center sm:px-12 md:py-16"
        style={{ background: 'linear-gradient(115deg, #b48d39 0%, #c8a24c 40%, #e0bd6b 100%)' }}
      >
        <div className="grain" aria-hidden="true" />
        <Crest variant="navy" size={56} className="relative mx-auto opacity-90" />
        <h2 id="cta-title" className="text-h2 relative mx-auto mt-5 max-w-2xl text-navy">
          Ready to start your China study journey?
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-navy/85">Send us your marks and goals. We reply on WhatsApp, usually within minutes.</p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <WhatsAppButton messageKey="ctaJourney" variant="navy" size="lg">
            Start on WhatsApp
          </WhatsAppButton>
          <Button to="/tools/eligibility-checker" variant="outline" size="lg" className="border-navy/30 bg-white/40 hover:bg-white/70">
            Check my eligibility
          </Button>
        </div>
      </div>
    </section>
  );
}
