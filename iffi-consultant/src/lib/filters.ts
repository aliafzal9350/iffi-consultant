/** University & Programme Finder: URL state, filtering and sorting. Pure functions. */
import { programs } from '@/data/catalog';
import { tools } from '@/data/config';
import type { Program } from '@/types/data';
import {
  LEVEL_ORDER,
  effectiveMaxTuition,
  hasStipend,
  hasTuitionFreeOption,
  isChineseTaught,
  isEnglishTaught,
  isTop50,
  needsInterviewOrVideo,
} from './programs';
import { fmtNumber } from './format';

export const SORTS = [
  { id: 'match', label: tools.finder.sort[0] },
  { id: 'tuition', label: tools.finder.sort[1] },
  { id: 'stipend', label: tools.finder.sort[2] },
  { id: 'ranking', label: tools.finder.sort[3] },
  { id: 'majors', label: tools.finder.sort[4] },
] as const;
export type SortId = (typeof SORTS)[number]['id'];

export type Funding = 'full' | 'stipend' | 'free';
export const FUNDING: { id: Funding; label: string }[] = [
  { id: 'full', label: 'Fully funded' },
  { id: 'stipend', label: 'Monthly stipend' },
  { id: 'free', label: 'Tuition-free option' },
];

export const TUITION_MAX = Math.max(...programs.map((p) => effectiveMaxTuition(p) ?? 0));
export const TUITION_STEP = 1000;

export interface FinderState {
  level: string[];
  field: string[];
  q: string;
  province: string[];
  city: string[];
  lang: '' | 'English' | 'Chinese';
  funding: Funding[];
  noielts: boolean;
  max: number | null;
  top50: boolean;
  easy: boolean;
  sort: SortId;
  ids: string[];
}

export const EMPTY: FinderState = {
  level: [],
  field: [],
  q: '',
  province: [],
  city: [],
  lang: '',
  funding: [],
  noielts: false,
  max: null,
  top50: false,
  easy: false,
  sort: 'match',
  ids: [],
};

const list = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

export function parseState(sp: URLSearchParams): FinderState {
  const maxRaw = sp.get('max');
  const max = maxRaw === null || maxRaw === '' ? NaN : Number(maxRaw);
  const sort = sp.get('sort') as SortId | null;
  const lang = sp.get('lang');
  return {
    level: list(sp.get('level')).filter((l) => (LEVEL_ORDER as readonly string[]).includes(l)),
    field: list(sp.get('field')).filter((f) => tools.finder.fields.includes(f)),
    q: sp.get('q') ?? '',
    province: list(sp.get('province')),
    city: list(sp.get('city')),
    lang: lang === 'English' || lang === 'Chinese' ? lang : '',
    funding: list(sp.get('funding')).filter((f): f is Funding => FUNDING.some((x) => x.id === f)),
    noielts: sp.get('noielts') === '1',
    max: Number.isFinite(max) && max >= 0 ? max : null,
    top50: sp.get('top50') === '1',
    easy: sp.get('easy') === '1',
    sort: SORTS.some((s) => s.id === sort) ? sort! : 'match',
    ids: list(sp.get('ids')),
  };
}

export function toParams(s: FinderState): URLSearchParams {
  const sp = new URLSearchParams();
  if (s.level.length) sp.set('level', s.level.join(','));
  if (s.field.length) sp.set('field', s.field.join(','));
  if (s.q.trim()) sp.set('q', s.q.trim());
  if (s.province.length) sp.set('province', s.province.join(','));
  if (s.city.length) sp.set('city', s.city.join(','));
  if (s.lang) sp.set('lang', s.lang);
  if (s.funding.length) sp.set('funding', s.funding.join(','));
  if (s.noielts) sp.set('noielts', '1');
  if (s.max !== null) sp.set('max', String(s.max));
  if (s.top50) sp.set('top50', '1');
  if (s.easy) sp.set('easy', '1');
  if (s.sort !== 'match') sp.set('sort', s.sort);
  if (s.ids.length) sp.set('ids', s.ids.join(','));
  return sp;
}

const majorHits = (p: Program, q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return 0;
  return p.majors.filter((m) => m.toLowerCase().includes(needle)).length;
};

export function matches(p: Program, s: FinderState): boolean {
  if (s.ids.length && !s.ids.includes(p.id)) return false;
  if (s.level.length && !s.level.includes(p.level)) return false;
  if (s.field.length && !s.field.some((f) => p.fields.includes(f))) return false;
  if (s.q.trim() && majorHits(p, s.q) === 0) return false;
  if (s.province.length && !s.province.includes(p.province)) return false;
  if (s.city.length && !(p.city && s.city.includes(p.city))) return false;
  if (s.lang === 'English' && !isEnglishTaught(p)) return false;
  if (s.lang === 'Chinese' && !isChineseTaught(p)) return false;
  if (s.funding.includes('full') && !p.fullyFunded) return false;
  if (s.funding.includes('stipend') && !hasStipend(p)) return false;
  if (s.funding.includes('free') && !hasTuitionFreeOption(p)) return false;
  if (s.noielts && !p.noIeltsRequired) return false;
  if (s.max !== null) {
    const t = effectiveMaxTuition(p);
    if (t === null || t > s.max) return false;
  }
  if (s.top50 && !isTop50(p)) return false;
  if (s.easy && needsInterviewOrVideo(p)) return false;
  return true;
}

function matchScore(p: Program, s: FinderState): number {
  let score = majorHits(p, s.q) * 10;
  if (p.fullyFunded) score += 3;
  if (hasStipend(p)) score += 2;
  if (hasTuitionFreeOption(p)) score += 2;
  if ((p.ranking?.china ?? 999) <= 100) score += 2;
  if (isEnglishTaught(p)) score += 1;
  return score;
}

const tuitionKey = (p: Program) => p.tuitionMinCNYPerYear ?? effectiveMaxTuition(p) ?? Number.MAX_SAFE_INTEGER;

export function sortPrograms(list: Program[], s: FinderState): Program[] {
  const byId = (a: Program, b: Program) => a.id.localeCompare(b.id, 'en', { numeric: true });
  const out = [...list];
  switch (s.sort) {
    case 'tuition':
      return out.sort((a, b) => tuitionKey(a) - tuitionKey(b) || byId(a, b));
    case 'stipend':
      return out.sort((a, b) => (b.stipendCNYPerMonth ?? 0) - (a.stipendCNYPerMonth ?? 0) || byId(a, b));
    case 'ranking':
      return out.sort((a, b) => (a.ranking?.china ?? 9999) - (b.ranking?.china ?? 9999) || byId(a, b));
    case 'majors':
      return out.sort((a, b) => b.majors.length - a.majors.length || byId(a, b));
    default:
      return out.sort((a, b) => matchScore(b, s) - matchScore(a, s) || byId(a, b));
  }
}

export function runFinder(s: FinderState, source: Program[] = programs): Program[] {
  return sortPrograms(
    source.filter((p) => matches(p, s)),
    s,
  );
}

/** Active filters as removable chips; `without` gives the state with that filter removed. */
export interface ActiveFilter {
  key: string;
  label: string;
  without: FinderState;
}

export function activeFilters(s: FinderState): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  const multi = (k: 'level' | 'field' | 'province' | 'city', label = (v: string) => v) =>
    s[k].forEach((v) => out.push({ key: `${k}:${v}`, label: label(v), without: { ...s, [k]: s[k].filter((x) => x !== v) } }));
  if (s.ids.length) out.push({ key: 'ids', label: `Your ${s.ids.length} eligibility matches`, without: { ...s, ids: [] } });
  multi('level');
  multi('field');
  if (s.q.trim()) out.push({ key: 'q', label: `Major: “${s.q.trim()}”`, without: { ...s, q: '' } });
  multi('province');
  multi('city');
  if (s.lang) out.push({ key: 'lang', label: `${s.lang}-taught`, without: { ...s, lang: '' } });
  s.funding.forEach((f) =>
    out.push({ key: `funding:${f}`, label: FUNDING.find((x) => x.id === f)!.label, without: { ...s, funding: s.funding.filter((x) => x !== f) } }),
  );
  if (s.noielts) out.push({ key: 'noielts', label: 'No IELTS required', without: { ...s, noielts: false } });
  if (s.max !== null) out.push({ key: 'max', label: `Tuition up to ${fmtNumber(s.max)} CNY/yr`, without: { ...s, max: null } });
  if (s.top50) out.push({ key: 'top50', label: 'Top 50 in China', without: { ...s, top50: false } });
  if (s.easy) out.push({ key: 'easy', label: 'No interview or video', without: { ...s, easy: false } });
  return out;
}

/** For the empty state: how many results each single removal would give, best first. */
export function relaxSuggestions(s: FinderState): { filter: ActiveFilter; count: number }[] {
  return activeFilters(s)
    .map((f) => ({ filter: f, count: programs.filter((p) => matches(p, f.without)).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

export function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
