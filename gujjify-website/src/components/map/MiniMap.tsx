'use client';
import { lazy, Suspense } from 'react';
import { useIsClient } from '@/hooks/useIsClient';
import { cn } from '@/lib/cn';
import type { ChinaMap2DProps } from './ChinaMap2D';

const ChinaMap2D = lazy(() => import('./ChinaMap2D'));

/**
 * The SVG map loaded on the client only: the geometry stays out of the main bundle and out of
 * the prerendered HTML. The box keeps its size while loading, so nothing shifts.
 */
export function MiniMap({ className, aspect = '5 / 4', ...props }: ChinaMap2DProps & { aspect?: string }) {
  const isClient = useIsClient();
  return (
    <div className={cn('relative w-full', className)} style={{ aspectRatio: aspect }}>
      {isClient ? (
        <Suspense fallback={<div className="skeleton absolute inset-[10%] rounded-[40%]" aria-hidden="true" />}>
          <ChinaMap2D {...props} className="absolute inset-0" />
        </Suspense>
      ) : (
        <div className="skeleton absolute inset-[10%] rounded-[40%]" aria-hidden="true" />
      )}
    </div>
  );
}
