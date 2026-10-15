'use client';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { ExternalLink, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from '@/components/ui/Reveal';
import { Lightbox, keepFocus } from '@/components/ui/Lightbox';
import { DOC_KIND_LABEL, type AdmissionDoc } from '@/data/testimonials';

const docAlt = (d: AdmissionDoc) =>
  `${DOC_KIND_LABEL[d.kind]} for ${d.name}: ${d.programme}, ${d.period}. Passport number and home address blurred.`;

const subtitle = (d: AdmissionDoc) => [d.country, d.programme].filter(Boolean).join(' · ');

function DocCard({ d, onOpen }: { d: AdmissionDoc; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} aria-haspopup="dialog" aria-label={`View the ${DOC_KIND_LABEL[d.kind]} for ${d.name}`} className="group block w-full text-left">
      <span className="relative block overflow-hidden rounded-2xl bg-white p-2.5 shadow-soft ring-1 ring-line transition-[transform,box-shadow] duration-500 ease-[var(--ease-premium)] group-hover:-translate-y-1.5 group-hover:shadow-lift group-hover:ring-gold/45 sm:p-3">
        <Image
          src={d.image}
          alt=""
          placeholder="blur"
          sizes={d.kind === 'notice' ? '(min-width: 1024px) 560px, 92vw' : '(min-width: 1024px) 270px, 46vw'}
          className="h-auto w-full rounded-lg transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.02]"
        />
        <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy/85 text-white opacity-0 shadow-soft transition-opacity duration-300 group-hover:opacity-100 sm:right-5 sm:top-5" aria-hidden="true">
          <Maximize2 size={15} />
        </span>
      </span>
      <span className="mt-4 inline-flex rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 text-[12px] font-medium text-navy">{DOC_KIND_LABEL[d.kind]}</span>
      <span className="mt-2 block font-display text-[1.15rem] font-semibold leading-snug text-navy transition-colors group-hover:text-gold-deep">{d.name}</span>
      <span className="mt-0.5 block text-[14px] text-ink/80">{subtitle(d)}</span>
      <span className="block text-[13px] text-muted">
        {d.level}, {d.period}
      </span>
    </button>
  );
}

/** Admission documents in a grid (the landscape notice spans two columns); a click opens the full page in a viewer. */
export function DocumentGallery({ docs, children }: { docs: AdmissionDoc[]; children?: ReactNode }) {
  const [i, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const d = docs[i];
  const step = (n: number) => setIndex((x) => (x + n + docs.length) % docs.length);

  return (
    <>
      <Reveal as="ul" stagger className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {docs.map((doc, n) => (
          <li key={doc.id} className={cn(doc.kind === 'notice' && 'col-span-2')}>
            <DocCard
              d={doc}
              onOpen={() => {
                setIndex(n);
                setOpen(true);
              }}
            />
          </li>
        ))}
        {children && <li className="col-span-2">{children}</li>}
      </Reveal>
      <Lightbox
        open={open}
        onClose={() => setOpen(false)}
        label={`${DOC_KIND_LABEL[d.kind]} for ${d.name}`}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        position={`${i + 1} / ${docs.length}`}
        caption={
          <>
            <p className="font-display text-lg text-white">
              {d.name}
              <span className="text-mist/70"> · {DOC_KIND_LABEL[d.kind]}</span>
            </p>
            <p className="mt-1 text-[14px]">
              {subtitle(d)}, {d.period}
            </p>
            <a
              href={d.image.src}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] text-gold-2 underline-offset-4 hover:underline"
            >
              Open full size <ExternalLink size={13} aria-hidden="true" />
            </a>
          </>
        }
      >
        <Image
          key={d.id}
          ref={keepFocus}
          data-autofocus
          tabIndex={-1}
          src={d.image}
          alt={docAlt(d)}
          sizes="(min-width: 1024px) 70vw, 100vw"
          className={cn(
            'h-auto w-auto max-w-full rounded-xl bg-white object-contain shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-card-in',
            d.kind === 'notice' ? 'max-h-[64svh]' : 'max-h-[70svh]',
          )}
        />
      </Lightbox>
    </>
  );
}
