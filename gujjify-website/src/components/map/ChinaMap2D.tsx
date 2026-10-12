'use client';
import { useMemo } from 'react';
import { provinces } from '@/data';
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
            {labelCities && !outside && (
              <text x={r + 8} y={5} fill="#ffffff" fontSize={focus ? 30 : 13} fontFamily="Poppins, sans-serif" fontWeight={500} paintOrder="stroke" stroke="#0d1f3f" strokeWidth={4} strokeOpacity={0.85}>
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
            <text x={16} y={-14} fill="#ffffff" fontSize={40} fontFamily="Poppins, sans-serif" fontWeight={500} paintOrder="stroke" stroke="#0d1f3f" strokeWidth={5}>
              {pin.label}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
