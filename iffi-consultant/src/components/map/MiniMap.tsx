'use client';
import { lazy, Suspense, useRef } from 'react';
import { useLoadWhenVisible } from '@/hooks/useMedia';
import { cn } from '@/lib/cn';
import type { ChinaMap2DProps } from './ChinaMap2D';

const ChinaMap2D = lazy(() => import('./ChinaMap2D'));

/**
 * The SVG map, loaded on the client once it is near the viewport: the geometry stays out of the main
 * bundle and out of the prerendered HTML. The box keeps its size while loading, so nothing shifts.
 */
export function MiniMap({ className, aspect = '5 / 4', ...props }: ChinaMap2DProps & { aspect?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const ready = useLoadWhenVisible(box);
  const placeholder = <div className="skeleton absolute inset-[10%] rounded-[40%]" aria-hidden="true" />;
  return (
    <div ref={box} className={cn('relative w-full', className)} style={{ aspectRatio: aspect }}>
      {ready ? (
        <Suspense fallback={placeholder}>
          <ChinaMap2D {...props} className="absolute inset-0" />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
