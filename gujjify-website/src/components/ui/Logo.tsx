'use client';
import { Link } from '@/lib/router';
import { site } from '@/data';
import { cn } from '@/lib/cn';
import logoGold from '@/assets/brand/logo-mark-gold.png';
import logoNavy from '@/assets/brand/logo-mark-navy.png';
import logoWhite from '@/assets/brand/logo-mark-white.png';

const marks = { gold: logoGold, navy: logoNavy, white: logoWhite };

export function Crest({ variant = 'gold', size = 40, className }: { variant?: keyof typeof marks; size?: number; className?: string }) {
  return <img src={typeof marks[variant] === 'string' ? marks[variant] : (marks[variant] as any).src} width={size} height={size} alt="" className={cn('shrink-0', className)} decoding="async" />;
}

/** Crest + live-text wordmark: "IFFI Global" (Fraunces) over "EDUCATION CONSULTANTS" (Poppins, tracked, gold). */
export function Wordmark({ dark = true, size = 'md', asLink = true }: { dark?: boolean; size?: 'md' | 'lg'; asLink?: boolean }) {
  const inner = (
    <>
      <Crest variant={dark ? 'gold' : 'navy'} size={size === 'lg' ? 52 : 40} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display font-semibold tracking-[-0.01em]', size === 'lg' ? 'text-[28px]' : 'text-[22px]', dark ? 'text-white' : 'text-navy')}>
          {site.brand.shortName}
        </span>
        <span className={cn('mt-1 font-sans font-medium tracking-[0.28em]', size === 'lg' ? 'text-[11px]' : 'text-[9.5px]', dark ? 'text-gold-2' : 'text-gold-deep')}>
          {site.brand.wordmarkSub}
        </span>
      </span>
    </>
  );
  if (!asLink) return <span className="flex items-center gap-2.5">{inner}</span>;
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label={`${site.brand.name}, home`}>
      {inner}
    </Link>
  );
}
