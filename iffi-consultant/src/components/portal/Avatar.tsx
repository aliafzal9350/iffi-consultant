'use client';
import { useState } from 'react';
import { cn } from '@/lib/cn';

/** Google profile photo, falling back to initials when there is none or it fails to load. */
export function Avatar({ name, src, size = 36, className }: { name: string | null; src: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials =
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?';

  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gold-soft font-medium text-navy ring-2 ring-gold/40', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {src && !failed ? (
        // Google photos block requests that send a referrer; next/image would also need a remote-host allowlist
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
