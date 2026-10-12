/**
 * Shared map geometry for ChinaMap2D and ChinaMap3D. Imports the 114 KB province shapes,
 * so only the lazy-loaded map components may import this file.
 *
 * Projection: plain Mercator computed directly. China is far from the antimeridian, so the spherical
 * clipping and adaptive resampling a general-purpose projection performs are pure overhead here
 * (they cost ~0.7 s of main-thread time per page on a mid-range laptop). The output matches d3's
 * geoMercator for this region.
 */
import { chinaGeo } from '@/data/geo';
import type { ChinaFeature } from '@/types/data';

type Ring = [number, number][];
export interface MapFeature {
  type: 'Feature';
  properties: ChinaFeature['properties'];
  geometry: { type: 'MultiPolygon'; coordinates: Ring[][] };
}

export const FEATURES: MapFeature[] = chinaGeo.features.map((f) => ({
  type: 'Feature',
  properties: f.properties,
  geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates as Ring[][] },
}));

export const featureByName = new Map(FEATURES.map((f) => [f.properties.name, f]));

/** Gold ramp: gold-deep (1 programme) -> gold-2 (15 programmes) */
const GOLD_DEEP = [0xb4, 0x8d, 0x39];
const GOLD_2 = [0xe0, 0xbd, 0x6b];
export const MAX_COUNT = Math.max(...FEATURES.map((f) => f.properties.programCount));
export function goldFor(count: number): string {
  const t = Math.min(1, Math.max(0, (count - 1) / (MAX_COUNT - 1)));
  const c = GOLD_DEEP.map((a, i) => Math.round(a + (GOLD_2[i] - a) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/* Mercator ------------------------------------------------------------------- */
const RAD = Math.PI / 180;
const mx = (lng: number) => lng * RAD;
const my = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));

interface Bounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
function boundsOf(features: MapFeature[]): Bounds {
  const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const f of features)
    for (const poly of f.geometry.coordinates)
      for (const [lng, lat] of poly[0]) {
        const x = mx(lng);
        const y = my(lat);
        if (x < b.x0) b.x0 = x;
        if (x > b.x1) b.x1 = x;
        if (y < b.y0) b.y0 = y;
        if (y > b.y1) b.y1 = y;
      }
  return b;
}
const ALL_BOUNDS = boundsOf(FEATURES);

export interface Projection {
  (p: [number, number]): [number, number];
  /** pixels per Mercator unit, comparable between projections */
  scale: number;
}

function make(k: number, tx: number, ty: number): Projection {
  const fn = ((p: [number, number]) => [k * mx(p[0]) + tx, -k * my(p[1]) + ty]) as Projection;
  fn.scale = k;
  return fn;
}

/** Fit all of China (or one province) into width x height, like d3's fitExtent. */
export function fitProjection(width: number, height: number, focus?: MapFeature, padding = 0): Projection {
  const b = focus ? boundsOf([focus]) : ALL_BOUNDS;
  const k = Math.min((width - 2 * padding) / (b.x1 - b.x0), (height - 2 * padding) / (b.y1 - b.y0));
  const tx = width / 2 - (k * (b.x0 + b.x1)) / 2;
  const ty = height / 2 + (k * (b.y0 + b.y1)) / 2;
  return make(k, tx, ty);
}

/** Centre a projection on [lng, lat] at a given scale (used to cap the zoom on tiny provinces). */
export function centeredProjection(width: number, height: number, center: [number, number], scale: number): Projection {
  return make(scale, width / 2 - scale * mx(center[0]), height / 2 + scale * my(center[1]));
}

/** SVG path data for a feature, rounded to 0.1 px. */
export function pathFor(projection: Projection) {
  return (f: MapFeature): string => {
    let d = '';
    for (const poly of f.geometry.coordinates)
      for (const ring of poly) {
        ring.forEach((pt, i) => {
          const [x, y] = projection(pt);
          d += `${i === 0 ? 'M' : 'L'}${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
        });
        d += 'Z';
      }
    return d;
  };
}
