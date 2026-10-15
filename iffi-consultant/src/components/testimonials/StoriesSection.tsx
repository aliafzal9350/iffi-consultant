import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router';
import { ADMISSION_DOCS, VIDEO_STORIES, type AdmissionDoc } from '@/data/testimonials';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { VideoStories } from './VideoStories';

/** Fan positions: x as a share of one card's width, so the fan scales with the cards. */
const FAN = [
  { r: -12, x: -72, y: 22 },
  { r: -4, x: -24, y: 4 },
  { r: 4, x: 24, y: 4 },
  { r: 12, x: 72, y: 22 },
];

/** The JW202 forms as a fanned hand of cards that opens wider on hover; the whole fan links to the documents. */
export function DocumentFan({ docs }: { docs: AdmissionDoc[] }) {
  return (
    <Link
      to="/testimonials#documents"
      aria-label={`See all ${docs.length} JW202 visa forms`}
      className="group relative mx-auto block h-[250px] w-full max-w-[560px] rounded-2xl sm:h-[390px]"
    >
      {docs.slice(0, FAN.length).map((d, i) => {
        const f = FAN[i];
        return (
          <span
            key={d.id}
            style={{ '--r': `${f.r}deg`, '--x': `${f.x}%`, '--y': `${f.y}px` } as CSSProperties}
            className="absolute left-1/2 top-3 w-[35%] max-w-[195px] origin-bottom transition-transform duration-700 ease-[var(--ease-premium)] [transform:translateX(-50%)_translateX(var(--x))_translateY(var(--y))_rotate(var(--r))] group-hover:[transform:translateX(-50%)_translateX(calc(var(--x)*1.16))_translateY(calc(var(--y)-14px))_rotate(calc(var(--r)*1.3))] motion-reduce:transition-none"
          >
            <span className="block overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_22px_50px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
              <Image src={d.image} alt="" sizes="(min-width: 640px) 195px, 35vw" placeholder="blur" className="h-auto w-full rounded-md" />
            </span>
          </span>
        );
      })}
    </Link>
  );
}

/** Home page: the student videos first, then the JW202 forms behind them. */
export function StoriesSection() {
  const jw202 = ADMISSION_DOCS.filter((d) => d.kind === 'jw202');
  return (
    <section id="stories" aria-labelledby="stories-title" className="relative overflow-hidden bg-navy py-16 text-mist md:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-48 top-32 h-[560px] w-[560px] rounded-full opacity-[0.13]"
        style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-[0.1]"
        style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <Container className="relative">
        <Reveal className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-gold-2">Student stories</p>
            <h2 id="stories-title" className="text-h2 text-white">
              Hear it from <span className="font-display-italic text-gold-gradient">our students</span>
            </h2>
            <p className="text-lede mt-4 text-mist">Short videos our students recorded on their own phones. Tap a card to watch with sound.</p>
          </div>
          <Button to="/testimonials" variant="outline-light" className="shrink-0 self-start md:self-auto" iconRight={<ArrowRight size={17} aria-hidden="true" />}>
            All success stories
          </Button>
        </Reveal>

        <VideoStories stories={VIDEO_STORIES} />

        <div className="mt-16 grid items-center gap-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 sm:p-10 lg:mt-24 lg:grid-cols-[1fr_1.15fr] lg:gap-6">
          <Reveal>
            <p className="eyebrow text-gold-2">September 2026 intake</p>
            <h3 className="text-h3 mt-3 text-white">JW202 visa forms issued to our students</h3>
            <p className="mt-3 max-w-md leading-relaxed">
              The JW202 is printed by China&rsquo;s Ministry of Education and issued by the university once a student is accepted. The student takes it to the Chinese
              embassy to apply for the X1 study visa.
            </p>
            <p className="mt-3 text-sm text-mist/75">Passport numbers, home addresses and verification codes are blurred.</p>
            <Button to="/testimonials#documents" variant="gold" className="mt-7" iconRight={<ArrowRight size={17} aria-hidden="true" />}>
              See the documents
            </Button>
          </Reveal>
          <Reveal variant="zoom">
            <DocumentFan docs={jw202} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
