/** URL helpers with no data imports, safe for any client component. */
import type { Program } from '@/types/data';

export function provinceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}
export function provincePath(name: string): string {
  return `/provinces/${provinceSlug(name)}`;
}
export function programPath(p: Pick<Program, 'slug'>): string {
  return `/programmes/${p.slug}`;
}
