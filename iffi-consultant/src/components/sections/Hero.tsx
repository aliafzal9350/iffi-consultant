import { GraduationCap, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { meta, site } from '@/data/content';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { Container } from '@/components/ui/primitives';
import { CountUp } from '@/components/ui/CountUp';
import { HeroMap } from '@/components/map/HeroMap';

const STATS = [
  { value: meta.counts.programmes, label: 'programmes' },
  { value: meta.counts.provinces, label: 'provinces' },
  { value: meta.counts.cities, label: 'cities' },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-navy text-mist">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-[10%] -top-[30%] h-[900px] w-[900px] rounded-full opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, #e0bd6b 0%, rgba(224,189,107,0.25) 35%, transparent 68%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, #1c3a6b 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <Container className="relative lg:grid lg:min-h-[calc(100svh-116px)] lg:grid-cols-12 lg:items-center">
        <div className="hero-enter relative z-10 py-12 sm:py-16 lg:col-span-5 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/[0.08] px-3.5 py-1.5 text-[13px] text-gold-2">
            <GraduationCap size={16} aria-hidden="true" />
            {site.hero.eyebrow}
          </p>

          <h1 id="hero-title" className="text-display mt-6 text-white">
            {site.hero.headline}{' '}
            <span className="text-gold-gradient font-display-italic block pb-1 font-medium">{site.hero.headlineAccent}</span>
          </h1>

          <p className="text-lede mt-6 max-w-[34rem] text-mist">{site.hero.subheadline}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton messageKey={site.hero.primaryCta.whatsappMessageKey as 'heroConsultation'} variant="gold" size="lg">
              {site.hero.primaryCta.label}
            </WhatsAppButton>
            <Button to={site.hero.secondaryCta.path} variant="outline-light" size="lg">
              {site.hero.secondaryCta.label}
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 divide-x divide-white/10 border-y border-white/10">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 py-4 first:pl-0">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <CountUp value={s.value} className="tabular block font-display text-[2.4rem] font-semibold leading-none text-white" />
                  <span className="mt-1.5 block text-[13px] text-mist/85">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-mist/85">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck size={15} aria-hidden="true" className="text-gold-2" />
              Free eligibility check
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MapPin size={15} aria-hidden="true" className="text-gold-2" />
              {site.contact.offices[0].city} office
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MessageCircle size={15} aria-hidden="true" className="text-gold-2" />
              Replies within minutes on WhatsApp
            </li>
          </ul>
        </div>
      </Container>

      <div className="relative px-4 pb-12 sm:px-6 md:h-[66vh] md:min-h-[560px] lg:absolute lg:inset-y-0 lg:left-[40%] lg:right-0 lg:h-auto lg:p-0">
        <HeroMap />
      </div>
    </section>
  );
}
