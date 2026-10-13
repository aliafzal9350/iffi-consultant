'use client';
import { Link, useLocation } from '@/lib/router';
import { cn } from '@/lib/cn';

export interface NavItem {
  href: string;
  label: string;
}

/** Section links in the portal bar. Active = white text with a gold underline. Scrolls sideways on phones. */
export function PortalNav({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Portal" className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
      {items.map((it) => {
        const active = it.href === pathname || (it.href !== '/portal' && it.href !== '/staff' && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            to={it.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative whitespace-nowrap px-3 py-3.5 text-[14px] transition-colors',
              active ? 'text-white' : 'text-mist/80 hover:text-white'
            )}
          >
            {it.label}
            {active && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gold-2" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}
