/** Provinces with programmes (light). See '@/data/content' for how the data modules are split. */
import provincesJson from './provinces.json';
import type { Province } from '@/types/data';

export const provinces: Province[] = provincesJson;
export const provinceByName = new Map(provinces.map((p) => [p.name, p]));
export const provinceByAdcode = new Map(provinces.map((p) => [p.adcode, p]));

