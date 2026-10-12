'use client';
import { useEffect, useRef, useState } from 'react';
import { fmtNumber } from '@/lib/format';

/**
 * Counts up once when first visible. The final value is in the server HTML (crawlers, no-JS);
 * with JS it is hidden until hydration (see [data-countup] in index.css), then animates from 0.
 */
export function CountUp({ value, duration = 1400, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReady(true);
      return;
    }
    setShown(0);
    setReady(true);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - k, 3);
          setShown(Math.round(value * eased));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} data-countup="" data-ready={ready ? '' : undefined} className={className}>
      {fmtNumber(shown)}
    </span>
  );
}
