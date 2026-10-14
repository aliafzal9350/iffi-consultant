'use client';
import { useMemo } from 'react';
import { provinces } from '@/data/places';
import { cn } from '@/lib/cn';
import { FEATURES, centeredProjection, featureByName, fitProjection, goldFor, pathFor } from './geo';

export interface ChinaMap2DProps {
  width?: number;
  height?: number;
  /** province highlighted (hover / tour / current page) */
  active?: string | null;
  /** zoom to this province; others are dimmed */
  focus?: string;
  /** provinces drawn as selected (finder picker) */
  selected?: string[];
  /** show programme city beacons */
  showCities?: boolean;
  /** a single pinned city (programme page) */
  pin?: { lat: number; lng: number; label?: string } | null;
  /** label the city pins (province pages) */
  labelCities?: boolean;
  onHover?: (name: string | null) => void;
  onSelect?: (name: string) => void;
  onCity?: (city: string) => void;
  className?: string;
  ariaLabel: string;
  /** smaller strokes for thumbnails */
  compact?: boolean;
}

const programmeProvinces = new Set(provinces.map((p) => p.name));

/** SVG map from the same geometry as the 3D hero: poster, no-WebGL fallback, province pages, finder picker. */
export default function ChinaMap2D({
  width = 1000,
  height = 800,
  active,
  focus,
  selected,
  showCities = true,
  pin,
  labelCities,
  onHover,
  onSelect,
  onCity,
  className,
  ariaLabel,
  compact,
}: ChinaMap2DProps) {
  const projection = useMemo(() => {
    const full = fitProjection(width, height, undefined, compact ? 4 : 12);
    const f = focus ? featureByName.get(focus) : undefined;
    if (!f) return full;
    const zoomed = fitProjection(width, height, f, Math.min(width, height) * 0.14);
    const maxScale = full.scale * 7;
    if (zoomed.scale <= maxScale) return zoomed;
    return centeredProjection(width, height, f.properties.centroid as [number, number], maxScale);
  }, [width, height, focus, compact]);

  const path = useMemo(() => pathFor(projection), [projection]);
  const shapes = useMemo(
    () =>
      FEATURES.map((f) => ({
        name: f.properties.name,
        nameZh: f.properties.nameZh,
        count: f.properties.programCount,
        has: programmeProvinces.has(f.properties.name),
        d: path(f),
      })),
    [path],
  );

  const cities = useMemo(() => {
    if (!showCities) return [];
    return provinces.flatMap((p) =>
      p.cities.map((c) => {
        const [x, y] = projection([c.lng, c.lat]) ?? [0, 0];
        return { name: c.name, province: p.name, x, y, n: c.programIds.length };
      }),
    );
  }, [projection, showCities]);

  const wide = useMemo(() => {
    if (!showCities) return [];
    return provinces
      .filter((p) => p.provinceWideProgramIds.length)
      .map((p) => {
        const f = featureByName.get(p.name);
        const [x, y] = projection((f?.properties.centroid as [number, number]) ?? [p.center.lng, p.center.lat]) ?? [0, 0];
        return { name: p.name, x, y };
      });
  }, [projection, showCities]);

  // city labels (province pages): busiest city first; each label tries right, left, above, below and is
  // left out when every spot would overlap another label or pin (the pin keeps its tooltip)
  const labels = useMemo(() => {
    const placed = new Map<string, { x: number; y: number; anchor: 'start' | 'end' | 'middle' }>();
    if (!labelCities) return placed;
    const fs = focus ? 30 : 13;
    const pr = focus ? 7 : 4.2;
    const visible = cities.filter((c) => !focus || c.province === focus);
    const taken: [number, number, number, number][] = visible.map((c) => [c.x - pr * 1.6, c.y - pr * 1.6, c.x + pr * 1.6, c.y + pr * 1.6]);
    const hits = (b: [number, number, number, number]) =>
      b[0] < 0 || b[1] < 0 || b[2] > width || b[3] > height || taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    for (const c of [...visible].sort((a, b) => b.n - a.n)) {
      const w = c.name.length * fs * 0.6;
      const h = fs * 1.15;
      const gap = pr + fs * 0.3;
      const spots = [
        { x: gap, y: fs * 0.36, anchor: 'start' as const, box: [c.x + gap, c.y - h / 2, c.x + gap + w, c.y + h / 2] },
        { x: -gap, y: fs * 0.36, anchor: 'end' as const, box: [c.x - gap - w, c.y - h / 2, c.x - gap, c.y + h / 2] },
        { x: 0, y: -gap - fs * 0.2, anchor: 'middle' as const, box: [c.x - w / 2, c.y - gap - h, c.x + w / 2, c.y - gap] },
        { x: 0, y: gap + fs * 0.9, anchor: 'middle' as const, box: [c.x - w / 2, c.y + gap, c.x + w / 2, c.y + gap + h] },
      ];
      const spot = spots.find((o) => !hits(o.box as [number, number, number, number]));
      if (!spot) continue;
      taken.push(spot.box as [number, number, number, number]);
      placed.set(c.name, { x: spot.x, y: spot.y, anchor: spot.anchor });
    }
    return placed;
  }, [cities, labelCities, focus, width, height]);

  const pinXY = pin ? projection([pin.lng, pin.lat]) : null;
  const sw = compact ? 0.6 : focus ? 1.4 : 1;
  const interactive = !!(onSelect || onHover);
  // draw order: plain provinces, programme provinces, then the highlighted one on top
  const ordered = [...shapes].sort((a, b) => Number(a.has) - Number(b.has) || Number(a.name === active) - Number(b.name === active));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className={cn('h-full w-full select-none', className)} preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="map-lift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#050c1c" floodOpacity="0.55" />
        </filter>
        <radialGradient id="pin-glow">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="100%" stopColor="#e0bd6b" />
        </radialGradient>
      </defs>

      <g>
        {ordered.map((s) => {
          const isActive = s.name === active;
          const isSel = selected?.includes(s.name);
          const dimmed = focus && s.name !== focus;
          let fill = s.has ? goldFor(s.count) : '#13294f';
          if (dimmed) fill = s.has ? '#1c3a6b' : '#13294f';
          if (selected && s.has && !isSel) fill = 'rgba(200,162,76,0.45)';
          return (
            <path
              key={s.name}
              d={s.d}
              fill={fill}
              stroke={dimmed ? '#2a4a80' : s.has ? (isActive || isSel ? '#fff3d1' : '#e0bd6b') : '#2a4a80'}
              strokeOpacity={s.has ? (isActive ? 1 : 0.8) : 0.6}
              strokeWidth={isActive || isSel ? sw * 1.8 : sw}
              strokeLinejoin="round"
              filter={isActive && !focus ? 'url(#map-lift)' : undefined}
              style={{
                transform: isActive && !focus ? 'translateY(-6px)' : undefined,
                transition: 'transform 300ms cubic-bezier(0.22,1,0.36,1), fill 300ms',
                cursor: interactive && s.has ? 'pointer' : undefined,
              }}
              onMouseEnter={s.has && onHover ? () => onHover(s.name) : undefined}
              onMouseLeave={s.has && onHover ? () => onHover(null) : undefined}
              onClick={s.has && onSelect ? () => onSelect(s.name) : undefined}
            >
              <title>{s.has ? `${s.name} ${s.nameZh}: ${s.count} ${s.count === 1 ? 'programme' : 'programmes'}` : `${s.name} ${s.nameZh}`}</title>
            </path>
          );
        })}
      </g>

      {wide.map((w) => (
        <circle key={w.name} cx={w.x} cy={w.y} r={compact ? 3 : 6} fill="none" stroke="#fff3d1" strokeWidth={compact ? 1 : 1.6} strokeOpacity={0.85} pointerEvents="none" />
      ))}

      {cities.map((c) => {
        const outside = !!focus && c.province !== focus;
        const r = compact ? 2.2 : focus ? (outside ? 4 : 7) : 4.2;
        return (
          <g key={c.name} transform={`translate(${c.x},${c.y})`} style={{ cursor: onCity ? 'pointer' : undefined }} onClick={onCity ? () => onCity(c.name) : undefined}>
            {!compact && !outside && <circle r={r * 2.3} fill="#e0bd6b" opacity={0.2} pointerEvents="none" />}
            <circle r={r} fill="url(#pin-glow)" fillOpacity={outside ? 0.45 : 1} stroke="#0d1f3f" strokeWidth={compact ? 0.6 : 1.2} />
            {onCity && <circle r={r * 3} fill="transparent" />}
            {labels.has(c.name) && (
              <text
                x={labels.get(c.name)!.x}
                y={labels.get(c.name)!.y}
                textAnchor={labels.get(c.name)!.anchor}
                fill="#ffffff"
                fontSize={focus ? 30 : 13}
                fontWeight={500}
                paintOrder="stroke"
                stroke="#0d1f3f"
                strokeWidth={focus ? 6 : 4}
                strokeOpacity={0.85}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {c.name}
              </text>
            )}
            <title>{`${c.name}: ${c.n} ${c.n === 1 ? 'programme' : 'programmes'}`}</title>
          </g>
        );
      })}

      {pinXY && (
        <g transform={`translate(${pinXY[0]},${pinXY[1]})`} pointerEvents="none">
          <circle r={26} fill="#e0bd6b" opacity={0.25} />
          <circle r={10} fill="#fff3d1" stroke="#0d1f3f" strokeWidth={2.5} />
          {pin?.label && (
            <text x={16} y={-14} fill="#ffffff" fontSize={40} fontWeight={500} paintOrder="stroke" stroke="#0d1f3f" strokeWidth={5} style={{ fontFamily: 'var(--font-sans)' }}>
              {pin.label}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
