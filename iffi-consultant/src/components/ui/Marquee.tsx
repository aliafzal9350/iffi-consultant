/**
 * An endless horizontal ribbon, pure CSS (no JavaScript): the row is rendered twice and slides by half its width,
 * so the loop is smooth and continuous. It pauses on hover or keyboard focus; with reduced motion it becomes a row you can scroll.
 * The second copy is hidden from screen readers.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Marquee({
  children,
  seconds = 45,
  direction = 'left',
  className,
  trackClassName,
  label,
}: {
  children: ReactNode;
  /** time for one full loop: longer = slower */
  seconds?: number;
  direction?: 'left' | 'right';
  className?: string;
  trackClassName?: string;
  label?: string;
}) {
  return (
    <div className={cn('marquee', className)} data-direction={direction} aria-label={label} role={label ? 'region' : undefined} style={{ '--marquee-duration': `${seconds}s` } as CSSProperties}>
      <div className="marquee-track">
        <div className={cn('flex shrink-0 items-center', trackClassName)}>{children}</div>
        <div className={cn('flex shrink-0 items-center', trackClassName)} aria-hidden="true" data-marquee-copy="">
          {children}
        </div>
      </div>
    </div>
  );
}
