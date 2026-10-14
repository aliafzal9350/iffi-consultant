import { Link } from '@/lib/router';
import {
  Award,
  BadgeCheck,
  Check,
  ChevronRight,
  FileCheck2,
  GraduationCap,
  Languages,
  MapPin,
  MessageCircle,
  Plane,
  PlaneLanding,
  ShieldCheck,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { meta, site } from '@/data/content';
import { programs } from '@/data/catalog';
import { provinces } from '@/data/places';
import { tools } from '@/data/config';
import { cn } from '@/lib/cn';
import { fmtCNY, fmtNumber, plural } from '@/lib/format';
import { TOOLS } from '@/lib/toolsMeta';
import { runFinder, EMPTY } from '@/lib/filters';
import { runEligibility, EMPTY_PROFILE } from '@/lib/eligibility';
import { calculate } from '@/lib/cost';
import { LEVEL_LABEL, LEVEL_ORDER, isEnglishTaught, provincePath } from '@/lib/programs';
import { Container, Section, Disclaimer, IconTile } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { DataIcon } from '@/components/ui/Icon';
import { Accordion } from '@/components/ui/Accordion';
import { Crest } from '@/components/ui/Logo';
import { CountUp } from '@/components/ui/CountUp';
import { Marquee } from '@/components/ui/Marquee';
import { Reveal } from '@/components/ui/Reveal';
import { ProgrammeCard } from '@/components/programmes/ProgrammeCard';

const hours = site.contact.hours.replace('Open ', '').replace(' on WhatsApp', '');

/** "3,500 CNY" -> 3500 and " CNY", so text figures can count up too */
function splitFigure(v: number | string): { n: number | null; rest: string } {
  if (typeof v === 'number') return { n: v, rest: '' };
  const m = v.match(/^([\d,]+)(.*)$/);
  return m ? { n: Number(m[1].replace(/,/g, '')), rest: m[2] } : { n: null, rest: v };
}

/* 1. Trust strip: the figures, then a ribbon of what every student gets ---------------------------------- */
const noIeltsCount = programs.filter((p) => p.noIeltsRequired && p.level !== 'Language').length;

// verified facts only: unconfirmed marketing claims (site.stats.marketingClaims) stay out until IFFI confirms them
const PROMISES: { icon: LucideIcon; text: string }[] = [
  { icon: MapPin, text: `Office in ${site.contact.offices[0].city}` },
  { icon: MessageCircle, text: `WhatsApp support, ${hours}` },
  { icon: BadgeCheck, text: 'Free counselling' },
  { icon: ShieldCheck, text: 'Free eligibility check' },
  { icon: FileCheck2, text: 'Apply online, with a sample of every document' },
  { icon: Undo2, text: 'Application fee refunded if you do not qualify' },
  { icon: Award, text: 'CSC and university scholarships' },
  { icon: Languages, text: `${noIeltsCount} programmes with no IELTS needed` },
  { icon: Plane, text: 'X1 and X2 student visa support' },
  { icon: PlaneLanding, text: 'Airport pickup in China' },
  { icon: GraduationCap, text: 'Bachelor, Master, PhD, MBBS and Chinese language' },
];

export function TrustStrip() {
  // the first three figures (programmes, provinces, cities) are already in the hero
  const stats = site.stats.dataBacked.slice(3);
  return (
    <section aria-label="Our programme list in numbers" className="border-b border-line bg-white">
      <Reveal stagger className="mx-auto grid max-w-[1240px] grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s, i) => {
          const { n, rest } = splitFigure(s.value);
          return (
            <div key={s.label} className={cn('py-8 md:py-10', i % 2 === 1 && 'pl-5 md:pl-0', 'md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0')}>
              <p className="tabular font-display text-[1.8rem] font-semibold leading-none text-navy sm:text-[2.2rem]">
                {n != null ? <CountUp value={n} /> : s.value}
                {n != null && rest}
              </p>
              <span className="reveal-grow-x mt-3 block h-[3px] w-10 rounded-full bg-gold" aria-hidden="true" />
              <p className="mt-3 text-sm leading-snug text-muted">{s.label}</p>
            </div>
          );
        })}
      </Reveal>
      <div className="border-t border-line bg-paper/70">
        <Marquee seconds={55} label="What every IFFI student gets" className="mx-auto max-w-[1600px]" trackClassName="py-4">
          {PROMISES.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center whitespace-nowrap text-[14.5px] text-ink">
              <Icon size={17} aria-hidden="true" className="mr-2.5 text-gold-deep" />
              {text}
              <span className="mx-7 h-1.5 w-1.5 rotate-45 bg-gold/70" aria-hidden="true" />
            </span>
          ))}
        </Marquee>
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
          <CountUp value={finderPreview} className="tabular font-display text-2xl font-semibold text-navy" /> programmes match
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
        <div className="reveal-grow-x mt-3 flex h-2.5 overflow-hidden rounded-full" aria-hidden="true">
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
        <CountUp value={eligibilityPreview} className="tabular font-display text-2xl font-semibold text-navy" /> programmes to explore
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
      <Reveal stagger className="grid gap-5 md:grid-cols-3">
        {TOOLS.map((t) => (
          <article
            key={t.id}
            className="group relative flex flex-col rounded-card border border-line bg-white p-6 shadow-soft transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift"
          >
            <IconTile className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
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
              <ChevronRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </p>
          </article>
        ))}
      </Reveal>
      <p className="mt-6 text-sm text-muted">Free to use, no sign-up needed. Your answers stay in your browser.</p>
    </Section>
  );
}

/* 3. Where you can study ------------------------------------------------------ */
function ProvinceTile({ name, compact }: { name: string; compact?: boolean }) {
  const p = provinces.find((x) => x.name === name)!;
  const levels = LEVEL_ORDER.filter((l) => p.programsByLevel[l]).map((l) => LEVEL_LABEL[l]);
  if (compact) {
    return (
      <Link to={provincePath(p.name)} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-mist transition-colors hover:border-gold-2/60 hover:text-white">
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
      className="group relative flex h-full w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-white/10 bg-navy-2 p-6 transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:w-[280px]"
    >
      <span
        className="font-cjk pointer-events-none absolute -right-2 -top-3 text-[92px] leading-none text-gold/10 transition-[color,transform] duration-700 group-hover:-translate-x-2 group-hover:text-gold/25"
        aria-hidden="true"
      >
        {p.nameZh}
      </span>
      <span className="relative font-display text-[1.6rem] font-semibold text-white">{p.name}</span>
      <span className="relative mt-1 text-sm text-gold-2">{plural(p.programCount, 'programme')}</span>
      <span className="relative mt-5 text-[13.5px] text-mist">{levels.join(', ')}</span>
      <span className="relative mt-1 text-[13.5px] text-mist/75">{p.cities.length ? p.cities.map((c) => c.name).join(', ') : 'Province-wide'}</span>
      {p.maxStipendCNYPerMonth && <span className="relative mt-auto pt-5 text-[13px] text-white">Stipends up to {fmtNumber(p.maxStipendCNYPerMonth)} CNY/month</span>}
      <span className="absolute inset-x-6 bottom-0 h-[2px] origin-left scale-x-0 bg-gold-2 transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
    </Link>
  );
}

export function ProvincesSection() {
  const top = provinces.slice(0, 8);
  return (
    <section id="where" aria-labelledby="where-title" className="relative overflow-hidden bg-navy py-16 text-mist md:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" aria-hidden="true" />
      <Container className="relative">
        <Reveal className="max-w-2xl">
          <h2 id="where-title" className="text-h2 text-white">
            Where you can study in China
          </h2>
          <p className="text-lede mt-4 text-mist">
            Our current list covers {meta.counts.provinces} provinces and municipalities. Most programmes sit in the affordable cities of eastern China, from
            Jiangsu and Zhejiang to Hubei and Sichuan.
          </p>
        </Reveal>
      </Container>

      {/* every province on the list, drifting past in its own characters */}
      <Marquee seconds={90} direction="right" className="relative my-10 md:my-14" trackClassName="gap-0">
        {provinces.map((p) => (
          <span key={p.name} className="inline-flex items-baseline whitespace-nowrap px-6 md:px-9">
            <span lang="zh" className="font-cjk text-[56px] leading-none text-transparent [-webkit-text-stroke:1px_rgba(224,189,107,0.55)] md:text-[84px]">
              {p.nameZh}
            </span>
            <span className="ml-3 font-display text-[15px] text-mist/70 md:text-[17px]">{p.name}</span>
          </span>
        ))}
      </Marquee>

      <Container className="relative">
        <Reveal
          as="ul"
          stagger
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0"
        >
          {top.map((p) => (
            <li key={p.name} className="lg:[&>a]:w-auto">
              <ProvinceTile name={p.name} />
            </li>
          ))}
        </Reveal>
        {/* native disclosure: no JavaScript needed for the toggle */}
        <details className="group mt-8">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-white/20 px-5 text-sm text-white transition-colors hover:border-gold-2 hover:text-gold-2 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">See all {meta.counts.provinces} provinces</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {provinces.map((p) => (
              <li key={p.name}>
                <ProvinceTile name={p.name} compact />
              </li>
            ))}
          </ul>
        </details>
      </Container>
    </section>
  );
}

/* 4. Programme highlights --------------------------------------------------------- */
/**
 * Four entry points into the finder plus three featured offers. (Previously four tabs of three cards each:
 * nine hidden cards added ~300 DOM nodes that every phone had to parse and hydrate.)
 */
export function HighlightsSection() {
  const fullyFunded = [...programs].filter((p) => p.fullyFunded).sort((a, b) => (b.stipendCNYPerMonth ?? 0) - (a.stipendCNYPerMonth ?? 0) || b.majors.length - a.majors.length);
  const noIelts = programs.filter((p) => p.noIeltsRequired && p.level !== 'Language');
  const mbbs = programs.filter((p) => p.level === 'MBBS');
  const englishBachelor = programs.filter((p) => p.level === 'Bachelor' && isEnglishTaught(p));
  const maxStipend = Math.max(...programs.map((p) => p.stipendCNYPerMonth ?? 0));

  const routes = [
    { label: 'Fully funded', count: fullyFunded.length, text: `Free tuition and dorm, stipends up to ${fmtCNY(maxStipend)} a month`, to: '/programmes?funding=full' },
    { label: 'No IELTS required', count: noIelts.length, text: 'The brochure says no IELTS or Duolingo score is needed', to: '/programmes?noielts=1' },
    { label: 'MBBS in China', count: mbbs.length, text: 'English-medium medicine, 6 years including internship', to: '/programmes?level=MBBS' },
    { label: 'English-taught Bachelor', count: englishBachelor.length, text: 'Engineering, business, computer science and more', to: '/programmes?level=Bachelor&lang=English' },
  ];

  return (
    <Section
      id="highlights"
      tone="light"
      title="Scholarships and programmes in our current list"
      lede="Fully funded Master and PhD offers, routes without IELTS, English-taught MBBS and Bachelor programmes. University names are shared during your free consultation."
    >
      <Reveal as="ul" stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {routes.map((r) => (
          <li key={r.label}>
            <Link
              to={r.to}
              className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-paper p-5 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[1.15rem] font-semibold text-navy">{r.label}</span>
                <CountUp value={r.count} className="tabular font-display text-2xl font-semibold text-gold-deep" />
              </span>
              <span className="mt-1.5 text-sm leading-snug text-muted">{r.text}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-navy">
                See programmes
                <ChevronRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </Reveal>

      <Reveal>
        <h3 className="mt-12 font-display text-[1.35rem]">Featured fully funded offers</h3>
      </Reveal>
      <Reveal stagger className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {fullyFunded.slice(0, 3).map((p) => (
          <ProgrammeCard key={p.id} p={p} />
        ))}
      </Reveal>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button to="/programmes" variant="navy">
          Open the programme finder
        </Button>
        <p className="max-w-xl text-[13px] text-muted">{site.disclaimers.dataFreshness}</p>
      </div>
      <Disclaimer tone="warn" className="mt-5">
        {site.disclaimers.mbbsRecognition}
      </Disclaimer>
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
      <Reveal as="ul" stagger className="grid gap-x-12 gap-y-1 md:grid-cols-2">
        {site.services.map((s) => (
          <li key={s.id} className="border-t border-line">
            <Link to={`/services#${s.id}`} className="group flex gap-4 py-6">
              <IconTile light className="transition-[transform,background-color] duration-500 group-hover:-rotate-6 group-hover:bg-gold-soft">
                <DataIcon name={s.icon} size={20} />
              </IconTile>
              <span>
                <span className="block font-display text-[1.2rem] font-semibold leading-snug text-navy transition-colors group-hover:text-gold-deep">{s.title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-muted">{s.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </Reveal>
    </Section>
  );
}

/* 6. How it works ----------------------------------------------------------------- */
export function ProcessSection({ tone = 'light' }: { tone?: 'light' | 'paper' }) {
  return (
    <Section id="process" tone={tone} title={site.process.title} lede="Your free eligibility assessment is the first step. We handle the paperwork from there.">
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <Reveal as="ol" stagger className="relative space-y-0">
          {site.process.steps.map((s, i) => (
            <li key={s.title} className="group relative flex gap-5 pb-9 last:pb-0">
              {i < site.process.steps.length - 1 && <span className="reveal-grow-y absolute left-[21px] top-12 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-gold to-line" aria-hidden="true" />}
              <span className="tabular relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-white font-display text-lg font-semibold text-navy transition-colors duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-navy">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="font-display text-[1.2rem]">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </Reveal>
        <Reveal variant="right" className="self-start rounded-card bg-navy p-7 text-mist shadow-lift">
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
        </Reveal>
      </div>
    </Section>
  );
}

/* 7. Why us ----------------------------------------------------------------------- */
export function WhyUsSection() {
  return (
    <Section id="why" tone="paper">
      <div className="grid items-stretch gap-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal variant="left" className="relative overflow-hidden rounded-[22px] bg-navy p-8 text-mist sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative">
            <Crest size={72} className="animate-float" />
            <h2 className="text-h2 mt-8 text-white">Why students choose {site.brand.name}</h2>
            <p className="mt-4 max-w-md leading-relaxed">{site.about.values}</p>
            <p className="mt-6 text-sm text-mist/80">
              Office in {site.contact.offices[0].city}, support on WhatsApp {hours}.
            </p>
          </div>
        </Reveal>
        <Reveal as="ul" stagger className="grid gap-x-8 gap-y-8 self-center sm:grid-cols-2">
          {site.whyUs.map((w) => (
            <li key={w.title} className="group">
              <IconTile light className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6">
                <DataIcon name={w.icon} size={20} />
              </IconTile>
              <h3 className="mt-4 font-display text-[1.25rem]">{w.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{w.text}</p>
            </li>
          ))}
        </Reveal>
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
      <Reveal className="max-w-3xl">
        <Accordion items={items.map((f, i) => ({ id: `f${i}`, title: f.q, content: <p>{f.a}</p> }))} />
      </Reveal>
    </Section>
  );
}

/* 9. Final CTA band ------------------------------------------------------------------------ */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-paper px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      <Reveal
        variant="zoom"
        className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[26px] px-6 py-14 text-center sm:px-12 md:py-16"
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(115deg, #b48d39 0%, #c8a24c 40%, #e0bd6b 100%)' }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />
        <Crest variant="navy" size={56} className="animate-float relative mx-auto opacity-90" />
        <h2 id="cta-title" className="text-h2 relative mx-auto mt-5 max-w-2xl text-navy">
          Ready to start your China study journey?
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-navy/85">Send us your marks and goals. We reply on WhatsApp, usually within minutes.</p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <WhatsAppButton messageKey="ctaJourney" variant="navy" size="lg">
            Start on WhatsApp
          </WhatsAppButton>
          <Button to="/portal/sign-in" variant="outline" size="lg" className="border-navy/30 bg-white/40 hover:bg-white/70">
            Apply online
          </Button>
        </div>
        {site.contact.email && (
          <p className="relative mt-5 text-[14px] text-navy/80">
            Or email us at{' '}
            <a href={site.social.email ?? undefined} className="font-medium text-navy underline underline-offset-4">
              {site.contact.email}
            </a>
          </p>
        )}
      </Reveal>
    </section>
  );
}
