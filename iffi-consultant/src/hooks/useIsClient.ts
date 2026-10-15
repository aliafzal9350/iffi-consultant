'use client';
import { useLayoutEffect, useState } from 'react';

/**
 * false during prerendering and on the hydration render, true right after.
 * Lets pages render exactly the markup the server produced (e.g. the unfiltered finder), then apply
 * URL params or browser-only features. The layout effect re-renders before the browser paints,
 * so client-side navigations never show the intermediate state.
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  useLayoutEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}
