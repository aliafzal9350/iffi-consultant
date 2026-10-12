/**
 * China province geometry (114 KB raw). Import it ONLY inside the lazy-loaded map components
 * (ChinaMap3D / ChinaMap2D) so it ships in the map chunk, not in the main bundle:
 *   import { chinaGeo } from '@/data/geo';
 */
import chinaGeoJson from './china-provinces.geo.json';
import type { ChinaGeo } from '@/types/data';

export const chinaGeo: ChinaGeo = chinaGeoJson;
