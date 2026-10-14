'use client';
/**
 * Scroll reveal. The server renders the content fully visible; after hydration, an element that is still below the fold
 * is hidden (data-reveal="pending") and shown when it scrolls into view. Nothing above the fold ever blinks, crawlers and
 * no-JS visitors see everything, and reduced-motion users see no movement. The attribute is set on the DOM directly,
 * so revealing never re-renders React. Styles: [data-reveal] in index.css.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  as?: 'div' | 'ul' | 'ol' | 'section';
  className?: string;
  /** reveal the children one after another instead of the element as a whole */
  stagger?: boolean;
  variant?: 'up' | 'left' | 'right' | 'zoom';
  delay?: number;
  id?: string;
}

export function Reveal({ children, as = 'div', className, stagger, variant = 'up', delay, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as 'div'; // one element type for the ref; the tag name is what changes

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already on screen: leave it alone
    el.dataset.reveal = 'pending';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = 'shown';
        io.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      data-stagger={stagger ? '' : undefined}
      data-reveal-variant={variant === 'up' ? undefined : variant}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
