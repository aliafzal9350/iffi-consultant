/**
 * Ranked keywords from the keyword research (data-pipeline/build_seo_keywords.py) for <meta name="keywords">.
 * Server only: used in page.tsx metadata, never shipped to the browser.
 */
import 'server-only';
import data from './seo-keywords.json';
import type { Program, Province } from '@/types/data';

type RouteKey = keyof typeof data.routes;
type LevelKey = keyof typeof data.levels;
const MAX = 10;

const uniq = (list: string[]) => [...new Map(list.map((k) => [k.toLowerCase(), k])).values()].slice(0, MAX);

export function routeKeywords(route: RouteKey, extra: string[] = []): string[] {
  return uniq([...extra, ...data.routes[route]]);
}

/** Root layout: brand terms plus the home page's top terms. */
export function brandKeywords(): string[] {
  return uniq([...data.brand, ...data.routes['/']]);
}

export function programKeywords(p: Program): string[] {
  const place = p.city ?? p.province;
  const level = p.level === 'Language' ? 'chinese language course' : p.level.toLowerCase();
  return uniq([
    `${level} in ${place.toLowerCase()} china`,
    ...p.majors.slice(0, 2).map((m) => `${m.toLowerCase()} in china`),
    ...(data.levels[p.level as LevelKey] ?? []),
  ]);
}

export function provinceKeywords(p: Province): string[] {
  const name = p.name.toLowerCase();
  return uniq([
    `study in ${name} china`,
    `universities in ${name}`,
    `scholarships in ${name} china`,
    ...p.cities.slice(0, 3).map((c) => `universities in ${c.name.toLowerCase()}`),
    ...data.routes['/programmes'].slice(0, 3),
  ]);
}
