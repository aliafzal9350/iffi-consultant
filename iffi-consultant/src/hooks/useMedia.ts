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

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

/**
 * True once the element has come near the viewport and the browser is idle, then stays true.
 * Used to load the SVG maps (and their 114 KB of geometry) only when someone can see them: on phones
 * the hero map sits below the fold, so it no longer competes with the first paint.
 */
export function useLoadWhenVisible<T extends Element>(ref: React.RefObject<T | null>, rootMargin = '200px'): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || ready) return;
    const w = window as IdleWindow;
    let idle = 0;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setReady(true), { timeout: 1500 });
        else timer = window.setTimeout(() => setReady(true), 200);
      },
      { rootMargin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (idle) w.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, [ref, rootMargin, ready]);
  return ready;
}
