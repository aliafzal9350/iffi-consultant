/**
 * The full programme list (~220 KB). Import it from server components, page.tsx files and the
 * tool pages that filter it in the browser (finder, cost calculator, eligibility checker) - not
 * from anything rendered on every page, or every visitor downloads it.
 */
import programsJson from './programs.json';
import type { Program } from '@/types/data';

export const programs: Program[] = programsJson;
export const programById = new Map(programs.map((p) => [p.id, p]));
export const programBySlug = new Map(programs.map((p) => [p.slug, p]));
