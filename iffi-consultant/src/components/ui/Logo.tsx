import Image from 'next/image';
import { Link } from '@/lib/router';
import { site } from '@/data/core';
import { cn } from '@/lib/cn';
import logoGold from '@/assets/brand/logo-mark-gold.png';
import logoNavy from '@/assets/brand/logo-mark-navy.png';
import logoWhite from '@/assets/brand/logo-mark-white.png';

const marks = { gold: logoGold, navy: logoNavy, white: logoWhite };

/** The 512 px master is resized by next/image (WebP/AVIF at 1x/2x); only the header crest loads eagerly. */
export function Crest({ variant = 'gold', size = 40, className, eager }: { variant?: keyof typeof marks; size?: number; className?: string; eager?: boolean }) {
  return <Image src={marks[variant]} width={size} height={size} alt="" className={cn('shrink-0', className)} loading={eager ? 'eager' : 'lazy'} />;
}

/** Crest + live-text wordmark: "IFFI" (Fraunces) over "CONSULTANT" (Poppins, tracked, gold). */
export function Wordmark({ dark = true, size = 'md', asLink = true, eager }: { dark?: boolean; size?: 'md' | 'lg'; asLink?: boolean; eager?: boolean }) {
  const inner = (
    <>
      <Crest variant={dark ? 'gold' : 'navy'} size={size === 'lg' ? 52 : 40} eager={eager} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display font-semibold tracking-[-0.01em]', size === 'lg' ? 'text-[28px]' : 'text-[22px]', dark ? 'text-white' : 'text-navy')}>
          {site.brand.wordmarkMain}
        </span>{' '}
        <span className={cn('mt-1 font-sans font-medium tracking-[0.28em]', size === 'lg' ? 'text-[11.5px]' : 'text-[10.5px]', dark ? 'text-gold-2' : 'text-gold-deep')}>
          {site.brand.wordmarkSub}
        </span>
      </span>
    </>
  );
  if (!asLink) return <span className="flex items-center gap-2.5">{inner}</span>;
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg">
      {inner}
      <span className="sr-only"> home</span>
    </Link>
  );
}
