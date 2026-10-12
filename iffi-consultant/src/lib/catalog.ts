/**
 * Helpers that need the full programme list. Server components and tool pages only (see '@/data/catalog').
 */
import { programById, programs } from '@/data/catalog';
import type { Program, Province } from '@/types/data';

export const programsByLevel = (level: string) => programs.filter((p) => p.level === level);

export function similarProgrammes(p: Program, n = 3): Program[] {
  const scored = programs
    .filter((q) => q.id !== p.id)
    .map((q) => {
      let s = 0;
      if (q.level === p.level) s += 3;
      if (q.province === p.province) s += 2;
      s += q.fields.filter((f) => p.fields.includes(f)).length;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s || a.q.id.localeCompare(b.q.id));
  return scored.slice(0, n).map((x) => x.q);
}

/** The programmes of one province, in id order. */
export function provinceProgrammes(p: Province): Program[] {
  return p.programIds
    .map((id) => programById.get(id))
    .filter((x): x is Program => !!x)
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

/** Two programmes share a display name and major count: add the id to the page title to keep titles unique. */
export function needsIdInTitle(p: Program): boolean {
  return programs.some((o) => o.id !== p.id && o.displayName === p.displayName && o.majors.length === p.majors.length);
}
