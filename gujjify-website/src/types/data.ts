/**
 * Types for the JSON files in src/data. `src/data/index.ts` assigns every JSON file to these
 * types, so `npm run typecheck` fails if the data and the types ever drift apart.
 *
 * DATA RULES (do not break):
 *  - University names were removed on purpose. Never add or invent them.
 *  - Never invent programmes, fees, stipends, rankings or deadlines.
 *  - Programme data is from 2024-2025 brochures: always show the data-freshness disclaimer.
 */

/** Allowed values of Program.level */
export const PROGRAM_LEVELS = ['Bachelor', 'MBBS', 'Master', 'PhD', 'Language'] as const;
export type ProgramLevel = (typeof PROGRAM_LEVELS)[number];

/** Allowed values of LanguagePolicy.type */
export const LANGUAGE_POLICY_TYPES = [
  'none', // no English/Chinese test required (as stated)
  'internal-test', // university's own entrance / English test
  'english-test', // minimum IELTS / TOEFL / Duolingo / PTE / SAT scores below
  'any-english', // any English certificate accepted
  'hsk', // Chinese-taught: HSK level required
  'unspecified', // a language certificate is required but the test is not named
  'not-stated', // brochure says nothing - "ask IFFI Global"
] as const;

export interface LanguagePolicy {
  /** one of LANGUAGE_POLICY_TYPES */
  type: string;
  ielts?: number;
  toefl?: number;
  duolingo?: number;
  pte?: number;
  sat?: number;
  hsk?: number;
  hskScore?: number;
  note?: string;
}

export interface Program {
  /** B-xx Bachelor (B-10 is a Master), M-xx MBBS, MA-xx Master, P-xx PhD, L-01 Language */
  id: string;
  /** URL slug, e.g. "b-04-bachelor-shenzhen" -> route /programmes/:slug */
  slug: string;
  /** one of PROGRAM_LEVELS */
  level: string;
  levelDetail: string | null;
  /** e.g. "Bachelor programme in Shenzhen" - use this instead of a university name */
  displayName: string;
  city: string | null;
  province: string;
  /** false = brochure names only the province; coordinates are then the provincial capital */
  cityKnown: boolean;
  provinceCode: number;
  coordinates: { lat: number; lng: number } | null;
  coordinatesApproximate: boolean;
  intake: string | null;
  duration: string | null;
  teachingLanguages: string[] | null;
  chineseTaught: boolean;
  ranking: { china?: number; world?: string } | null;
  /** e.g. "211, 985 and C9 Project University" */
  status: string | null;
  majors: string[];
  /** broad study fields derived from majors (finder filter) */
  fields: string[];
  scholarships: string[];
  /** every cost line found in the brochure (display as a list) */
  costItems: string[];
  fees: string[];
  tuition: string | null;
  dorm: string | null;
  stipendText: string | null;
  totalFee: string | null;
  /** tuition the brochure labels original / standard / normal / full (CNY per year) */
  tuitionStandardCNYPerYear: number | null;
  /** true when the standard tuition was estimated from scholarship percentages */
  tuitionStandardEstimated: boolean;
  /** highest annual tuition figure listed anywhere in the brochure */
  tuitionMaxListedCNYPerYear: number | null;
  /** best case: 0 when any scholarship type (or the programme) makes tuition free */
  tuitionMinCNYPerYear: number | null;
  tuitionPerSemesterCNY: number | null;
  tuitionAndDormCombinedCNYPerYear: number | null;
  tuitionNote: string | null;
  /** only L-01 (6-month course, total incl. hostel) */
  courseTotalCNY?: number;
  /** "all years" | "year 1" | "all years (scholarship)" | null */
  tuitionFree: string | null;
  fullyFunded: boolean;
  stipendCNYPerMonth: number | null;
  languageRequirement: string | null;
  languagePolicy: LanguagePolicy;
  noIeltsRequired: boolean;
  interview: string | null;
  introVideoRequired: boolean;
  ageLimit: string | null;
  ageRange: { min: number | null; max: number | null } | null;
  bankStatementUSD: number | null;
  /** 2025 deadline (already passed) - show only typicalDeadlineMonth to users */
  deadline2025: string | null;
  deadlineText: string | null;
  typicalDeadlineMonth: string | null;
  documents: string[];
  headline: string | null;
  /** any other brochure sections, e.g. { "Other Costs (Pay After Arriving)": [...] } */
  details: Partial<Record<string, string[]>>;
}

export interface ProvinceCity {
  name: string;
  lat: number;
  lng: number;
  programIds: string[];
}

export interface Province {
  name: string;
  nameZh: string;
  /** GB/T 2260 code - matches the GeoJSON feature property `adcode` */
  adcode: number;
  type: string;
  capital: string;
  center: { lat: number; lng: number };
  programCount: number;
  /** e.g. { Bachelor: 9, MBBS: 2 } - levels with no programmes are absent */
  programsByLevel: Partial<Record<string, number>>;
  cities: ProvinceCity[];
  /** programmes whose brochure names only the province (no city pin) */
  provinceWideProgramIds: string[];
  maxStipendCNYPerMonth: number | null;
  fullyFundedCount: number;
  englishTaughtCount: number;
  sampleMajors: string[];
  programIds: string[];
}

export interface ChinaFeature {
  type: string;
  properties: {
    adcode: number;
    name: string;
    nameZh: string;
    /** [lng, lat] */
    centroid: number[];
    hasPrograms: boolean;
    programCount: number;
  };
  /** MultiPolygon: [polygon][ring][point][lng, lat] */
  geometry: { type: string; coordinates: number[][][][] };
}

export interface ChinaGeo {
  type: string;
  metadata: Record<string, string>;
  features: ChinaFeature[];
}
