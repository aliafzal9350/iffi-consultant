import Image from 'next/image';
import { MapPin, MessageCircle, Play, ShieldCheck } from 'lucide-react';
import { meta, site } from '@/data/content';
import { VIDEO_STORIES, videoPoster } from '@/data/testimonials';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { Container } from '@/components/ui/primitives';
import { CountUp } from '@/components/ui/CountUp';
import { HeroMap } from '@/components/map/HeroMap';
import { officeCities } from '@/lib/offices';

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
      {/* side by side from 1280px; below that the map sits under the copy so neither has to squeeze */}
      <Container className="relative xl:flex xl:min-h-[calc(100svh-116px)] xl:items-center">
        <div className="hero-enter relative z-10 max-w-[640px] py-12 sm:py-16 xl:max-w-[590px] xl:py-20">
          {/* real students first: the faces link down to their videos */}
          <a
            href="#stories"
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-navy-2/80 py-1.5 pl-1.5 pr-2 transition-[border-color,background-color] duration-300 hover:border-gold-2/50 hover:bg-navy-3/60"
          >
            <span className="flex -space-x-2.5" aria-hidden="true">
              {VIDEO_STORIES.map((s) => (
                <Image
                  key={s.id}
                  src={videoPoster(s.id)}
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 rounded-full object-cover object-[50%_30%] ring-2 sm:h-9 sm:w-9 ring-navy-2 transition-transform duration-500 ease-[var(--ease-premium)] group-hover:-translate-y-0.5"
                />
              ))}
            </span>
            <span className="whitespace-nowrap text-[13.5px] leading-tight text-white">
              Hear from our students
              <span className="block text-[12px] text-mist/75">{VIDEO_STORIES.length} short videos</span>
            </span>
            <span className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-navy transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
              <Play size={13} fill="currentColor" className="ml-0.5" />
            </span>
          </a>

          <h1 id="hero-title" className="text-display mt-6 text-white">
            {site.hero.headline}{' '}
            <span className="text-gold-gradient font-display-italic block pb-1 font-medium">{site.hero.headlineAccent}</span>
          </h1>

          <p className="text-lede mt-6 max-w-[34rem] text-mist">{site.hero.subheadline}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton messageKey={site.hero.primaryCta.whatsappMessageKey as 'heroConsultation'} variant="gold" size="lg">
              {site.hero.primaryCta.label}
            </WhatsAppButton>
            {/* solid fill: on wide screens the map's faded edge can sit behind this button */}
            <Button to={site.hero.secondaryCta.path} variant="outline-light" size="lg" className="bg-navy-2!">
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
              Offices in {officeCities(site.contact.offices)}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MessageCircle size={15} aria-hidden="true" className="text-gold-2" />
              Replies within minutes on WhatsApp
            </li>
          </ul>
        </div>
      </Container>

      <div className="relative px-4 pb-12 sm:px-6 md:h-[62vh] md:min-h-[520px] lg:px-8 xl:absolute xl:inset-y-0 xl:left-[calc(50%-118px)] xl:right-0 xl:h-auto xl:min-h-0 xl:p-0">
        <HeroMap />
      </div>
    </section>
  );
}
