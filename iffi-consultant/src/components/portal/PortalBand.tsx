import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Navy page band for portal pages: same dotted grid and gold glow as the public site, closed by the key-fret line. */
export function PortalBand({ title, lede, lead, children, className }: { title: ReactNode; lede?: ReactNode; lead?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn('relative overflow-hidden bg-navy text-mist', className)}>
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-48 -top-56 h-[560px] w-[560px] rounded-full opacity-[0.14]"
        style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-8 sm:px-6 md:pb-12 md:pt-10 lg:px-8">
        <div className="flex items-center gap-4">
          {lead}
          <div className="min-w-0">
            <h1 className="text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.1] text-white">{title}</h1>
            {lede && <p className="mt-2 max-w-2xl text-[15px] text-mist md:text-base">{lede}</p>}
          </div>
        </div>
        {children && <div className="mt-8 md:mt-10">{children}</div>}
      </div>
      <div className="fret-line absolute inset-x-0 bottom-0 opacity-70" aria-hidden="true" />
    </section>
  );
}
