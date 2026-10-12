'use client';
import { useEffect, useState } from 'react';

/** matchMedia hook; false on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** true while the element is (partly) on screen */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = '0px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/**
 * Cheap capability check. Creating a throwaway WebGL context to test support costs hundreds of
 * milliseconds on some GPUs; if the real context fails later, the map's error boundary falls back
 * to the SVG map anyway.
 */
export function supportsWebGL(): boolean {
  return typeof window !== 'undefined' && ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window);
}
