import type { ReactNode } from 'react';
import { Link } from '@/lib/router';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/primitives';
import type { Crumb } from '@/lib/seo';
import { cn } from '@/lib/cn';

export function Breadcrumbs({ items, dark = true }: { items: Crumb[]; dark?: boolean }) {
  const all = [{ name: 'Home', path: '/' }, ...items];
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cn('flex flex-wrap items-center gap-1 text-[13px]', dark ? 'text-mist/80' : 'text-muted')}>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className={dark ? 'text-white/90' : 'text-ink'}>
                  {c.name}
                </span>
              ) : (
                <>
                  <Link to={c.path} className={cn('rounded hover:underline', dark ? 'hover:text-white' : 'hover:text-navy')}>
                    {c.name}
                  </Link>
                  <ChevronRight size={14} aria-hidden="true" className="opacity-60" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  lede?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

/** Navy band at the top of inner pages: breadcrumb, H1, lede, optional actions / aside. */
export function PageHeader({ title, lede, crumbs, children, aside, className }: PageHeaderProps) {
  return (
    <header className={cn('relative overflow-hidden bg-navy pb-14 pt-8 text-mist md:pb-20 md:pt-10', className)}>
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.16]"
        style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <Container className="relative">
        <Breadcrumbs items={crumbs} />
        <div className={cn('mt-8 grid gap-10', !!aside && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end')}>
          {/* hero-enter: the same CSS-only entrance as the home hero (the h1 stays visible from the first frame) */}
          <div className="hero-enter max-w-3xl">
            <h1 className="text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.08] text-white">{title}</h1>
            {lede && <div className="text-lede mt-5 max-w-2xl text-mist">{lede}</div>}
            {children && <div className="mt-7">{children}</div>}
          </div>
          {aside && <div className="motion-safe:animate-card-in [animation-delay:200ms]">{aside}</div>}
        </div>
      </Container>
      {/* the key-fret border that also tops the footer, so every inner page opens and closes with it */}
      <div className="fret-line absolute inset-x-0 bottom-0 opacity-70" aria-hidden="true" />
    </header>
  );
}
