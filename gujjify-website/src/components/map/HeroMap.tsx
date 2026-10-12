'use client';
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from '@/lib/router';
import { List, X } from 'lucide-react';
import { provinces, provinceByName, site } from '@/data';
import { cn } from '@/lib/cn';
import { provincePath } from '@/lib/programs';
import { useIsClient } from '@/hooks/useIsClient';
import { useInView, useMediaQuery, usePrefersReducedMotion, supportsWebGL } from '@/hooks/useMedia';
import { ProvinceCard } from './ProvinceCard';

const ChinaMap2D = lazy(() => import('./ChinaMap2D'));
const ChinaMap3D = lazy(() => import('./ChinaMap3D'));

const TOUR = [...provinces].sort((a, b) => b.programCount - a.programCount).map((p) => p.name);
// fixed labels only for eastern provinces: the west of the map sits under the hero copy on desktop
const TOP_LABELS = TOUR.filter((n) => (provinceByName.get(n)?.center.lng ?? 0) > 108).slice(0, 6);
const MAP_LABEL = `Map of China. ${provinces.length} provinces with programmes are raised in gold, the tallest is Jiangsu with ${TOUR.length ? provinces[0].programCount : 0} programmes. City beacons mark the ${provinces.reduce((n, p) => n + p.cities.length, 0)} cities. Use the list view below the map for keyboard access.`;

/** If WebGL crashes, fall back to the SVG map instead of breaking the hero. */
class MapBoundary extends Component<{ fallback: ReactNode; children: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Legend({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none flex flex-col gap-2 text-[12px] text-mist', className)}>
      <div className="flex items-center gap-2.5">
        <span className="tabular">1</span>
        <span className="h-2 w-28 rounded-full" style={{ background: 'linear-gradient(90deg,#b48d39,#e0bd6b)' }} aria-hidden="true" />
        <span className="tabular">15</span>
        <span className="text-mist/80">programmes per province</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative inline-flex h-3 w-3 items-center justify-center" aria-hidden="true">
          <span className="absolute h-3 w-3 rounded-full bg-gold-2/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-gold-soft" />
        </span>
        <span className="text-mist/80">City with programmes</span>
      </div>
      <p className="flex flex-wrap gap-x-3 text-mist/70" aria-hidden="true">
        {site.hero.mapCaption.split(' · ').map((s) => (
          <span key={s}>{s}</span>
        ))}
      </p>
    </div>
  );
}

function Skeleton() {
  return <div className="skeleton absolute inset-[8%] rounded-[40%] opacity-60" aria-hidden="true" />;
}

export function HeroMap() {
  const isClient = useIsClient();
  const navigate = useNavigate();
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, '120px');
  const reduced = usePrefersReducedMotion();
  const mobile = useMediaQuery('(max-width: 767px), (pointer: coarse)');
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [ready3D, setReady3D] = useState(false);
  const [hide2D, setHide2D] = useState(false);
  const onReady3D = useCallback(() => setReady3D(true), []);
  // crossfade: the SVG map leaves only after the 3D canvas has faded in
  useEffect(() => {
    if (!ready3D) return;
    const t = window.setTimeout(() => setHide2D(true), 750);
    return () => window.clearTimeout(t);
  }, [ready3D]);

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [now, setNow] = useState(0);

  // Decide on 3D only after the page is idle, so the hero text and buttons respond first.
  // Weak or data-saving devices keep the SVG map, which looks the same at a fraction of the cost.
  const [load3D, setLoad3D] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const weak = (nav.deviceMemory !== undefined && nav.deviceMemory < 4) || nav.connection?.saveData === true || (nav.hardwareConcurrency ?? 8) < 4;
    setWebgl(!weak && supportsWebGL());
    const go = () => setLoad3D(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(go, 1200);
    return () => window.clearTimeout(t);
  }, []);

  const use3D = isClient && load3D && webgl === true && !reduced && !contextLost;
  const tourEnabled = isClient && desktop && !mobile && !reduced && inView;
  const pause = useCallback(() => setPausedUntil(Date.now() + 8000), []);

  // auto-tour: next province (by programme count) every 4 s, paused for 8 s after any interaction
  useEffect(() => {
    if (!tourEnabled) return;
    const t = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= pausedUntil) setTourIndex((i) => (i + 1) % TOUR.length);
    }, 4000);
    return () => window.clearInterval(t);
  }, [tourEnabled, pausedUntil]);

  const touring = tourEnabled && !hovered && !selected && now >= pausedUntil;
  const active = hovered ?? selected ?? (tourEnabled && !hovered && !selected ? TOUR[tourIndex] : null);
  const province = active ? provinceByName.get(active) : undefined;

  const onHover = useCallback(
    (name: string | null) => {
      setHovered(name);
      if (name) pause();
    },
    [pause],
  );
  const onSelect = useCallback(
    (name: string, pointerType = 'mouse') => {
      pause();
      if (pointerType === 'mouse') navigate(provincePath(name));
      else setSelected((cur) => (cur === name ? null : name));
    },
    [navigate, pause],
  );
  const onCity = useCallback((city: string) => navigate(`/programmes?city=${encodeURIComponent(city)}`), [navigate]);

  const map2d = useMemo(
    () => (
      <Suspense fallback={<Skeleton />}>
        <ChinaMap2D
          active={active}
          onHover={onHover}
          onSelect={(n) => onSelect(n, mobile ? 'touch' : 'mouse')}
          onCity={onCity}
          ariaLabel={MAP_LABEL}
          className="absolute inset-0 p-[4%]"
        />
      </Suspense>
    ),
    [active, onHover, onSelect, onCity, mobile],
  );

  const listToggle = (
    <button
      type="button"
      onClick={() => setListOpen((v) => !v)}
      aria-expanded={listOpen}
      aria-controls="province-list"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-navy/90 px-4 text-sm text-white hover:border-gold-2"
    >
      {listOpen ? <X size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
      {listOpen ? 'Close list' : 'List view'}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div
        ref={wrap}
        className="relative min-h-[380px] flex-1 overflow-hidden max-lg:rounded-[22px] max-lg:border max-lg:border-white/10 max-lg:bg-navy-2/40"
        onMouseEnter={pause}
        onTouchStart={pause}
        onFocus={pause}
      >
        {!isClient ? (
          <Skeleton />
        ) : (
          <>
            {/* the SVG map stays visible until the 3D scene has compiled its shaders */}
            {(!use3D || !hide2D) && map2d}
            {use3D && (
              <MapBoundary fallback={null} onError={() => setContextLost(true)}>
                <Suspense fallback={null}>
                  <div
                    className={cn('absolute inset-0 transition-opacity duration-700', ready3D ? 'opacity-100' : 'opacity-0')}
                    role="img"
                    aria-label={MAP_LABEL}
                  >
                    <ChinaMap3D
                      active={active}
                      tour={touring}
                      mobile={mobile}
                      running={inView}
                      topLabels={TOP_LABELS}
                      onHover={onHover}
                      onSelect={onSelect}
                      onCity={onCity}
                      onContextLost={() => setContextLost(true)}
                      onReady={onReady3D}
                    />
                  </div>
                </Suspense>
              </MapBoundary>
            )}
          </>
        )}

        {/* soft blend into the copy column on large screens */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-40 bg-gradient-to-r from-navy via-navy/60 to-transparent lg:block" aria-hidden="true" />

        <div className="absolute bottom-12 left-10 z-10 hidden items-end gap-6 lg:flex">
          <Legend />
          {listToggle}
        </div>

        {province && desktop && (
          <div className="absolute bottom-24 right-6 z-10 w-[300px] xl:right-12" aria-live="polite">
            <ProvinceCard p={province} compact />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 lg:hidden">
        <Legend />
        {listToggle}
      </div>

      {province && !desktop && isClient && (
        <div className="mt-3" aria-live="polite">
          <ProvinceCard p={province} />
        </div>
      )}

      <div id="province-list" hidden={!listOpen} className="mt-4 lg:absolute lg:bottom-24 lg:left-10 lg:right-[360px] lg:z-20 lg:mt-0">
        <p className="sr-only">Provinces with programmes, sorted by number of programmes</p>
        <ul className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-navy-2 p-3">
          {TOUR.map((name) => {
            const p = provinceByName.get(name)!;
            return (
              <li key={name}>
                <button
                  type="button"
                  onFocus={() => onHover(name)}
                  onBlur={() => setHovered(null)}
                  onMouseEnter={() => onHover(name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => navigate(provincePath(name))}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors',
                    active === name ? 'border-gold-2 bg-gold-2/15 text-gold-2' : 'border-white/12 text-mist hover:text-white',
                  )}
                >
                  {name}
                  <span className="font-cjk text-[11px] opacity-80" lang="zh">
                    {p.nameZh}
                  </span>
                  <span className="tabular text-gold-2">{p.programCount}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
