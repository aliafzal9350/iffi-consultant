/** Study Cost Calculator maths (all amounts CNY per year). Constants come from tools.costCalculator. */
import { programById } from '@/data/catalog';
import { tools } from '@/data/config';
import type { Program } from '@/types/data';
import { cityTier, programmeCity, type Tier } from './programs';

const cc = tools.costCalculator;
export type Accommodation = keyof typeof cc.accommodationMonthlyCNY;
export type Lifestyle = keyof typeof cc.livingMonthlyCNY.tier1;
type LevelDefault = { durationYears: number; tuitionMedianCNY?: number; courseTotalCNY?: number };
const levelDefaults = cc.levelDefaults as Record<string, LevelDefault>;

export const ACCOMMODATION: { id: Accommodation; label: string }[] = [
  { id: 'sharedDorm', label: 'Shared dorm room' },
  { id: 'singleDorm', label: 'Single dorm room' },
  { id: 'offCampusShared', label: 'Off-campus flat (shared)' },
];
export const LIFESTYLE: { id: Lifestyle; label: string; hint: string }[] = [
  { id: 'lean', label: 'Lean', hint: 'Canteen meals, campus life' },
  { id: 'standard', label: 'Standard', hint: 'Some eating out and travel' },
  { id: 'comfortable', label: 'Comfortable', hint: 'Restaurants, trips, more space' },
];

export interface CostInput {
  level: string;
  programId: string | null;
  city: string;
  scenario: string;
  accommodation: Accommodation;
  lifestyle: Lifestyle;
  firstYearFees: boolean;
  /** user-edited monthly assumptions (CNY) */
  livingMonthly?: number | null;
  accommodationMonthly?: number | null;
}

export interface CostResult {
  program: Program | null;
  tier: Tier;
  years: number;
  isCourse: boolean;
  tuition: number;
  tuitionBase: number;
  accommodation: number;
  living: number;
  fixed: number;
  extras: number;
  stipend: number;
  firstYear: number;
  laterYear: number;
  whole: number;
  monthly: number;
  notes: string[];
}

/** "2-3 years" -> 2, "2.5 years" -> 2.5, "6 months" -> 0.5 */
export function parseYears(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const m = duration.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return /month/i.test(duration) ? n / 12 : n;
}

export function defaultMonthly(input: CostInput): { living: number; accommodation: number; tier: Tier } {
  const program = input.programId ? programById.get(input.programId) : undefined;
  const tier = cityTier(program ? programmeCity(program) : input.city);
  return { living: cc.livingMonthlyCNY[tier][input.lifestyle], accommodation: cc.accommodationMonthlyCNY[input.accommodation][tier], tier };
}

export function calculate(input: CostInput): CostResult {
  const program = input.programId ? (programById.get(input.programId) ?? null) : null;
  const level = program?.level ?? input.level;
  const def = levelDefaults[level] ?? levelDefaults.Bachelor;
  const scenario = cc.scholarshipScenarios.find((s) => s.id === input.scenario) ?? cc.scholarshipScenarios[0];
  const city = program ? programmeCity(program) : input.city;
  const tier = cityTier(city);
  const notes: string[] = [];
  const years = parseYears(program?.duration) ?? def.durationYears;
  const isCourse = level === 'Language';

  let tuitionBase = program?.tuitionStandardCNYPerYear ?? program?.tuitionMaxListedCNYPerYear ?? def.tuitionMedianCNY ?? 0;
  let tuition = tuitionBase * scenario.tuitionFactor;
  let accommodationFree = scenario.accommodationFree;

  if (program?.tuitionAndDormCombinedCNYPerYear != null) {
    tuitionBase = program.tuitionAndDormCombinedCNYPerYear;
    tuition = scenario.id === 'full' ? 0 : program.tuitionAndDormCombinedCNYPerYear;
    accommodationFree = true;
    notes.push('This brochure quotes tuition and dorm together, so accommodation is included in tuition.');
  }
  if (isCourse) {
    tuitionBase = program?.courseTotalCNY ?? def.courseTotalCNY ?? 0;
    tuition = tuitionBase;
    accommodationFree = true;
    notes.push('The 6-month language course is quoted as one total that includes the hostel.');
  }
  if (!program) notes.push(`Tuition uses the median ${level} fee in our list. Pick a programme for its exact figure.`);
  if (program?.tuitionStandardEstimated) notes.push('The standard tuition for this programme is estimated from its scholarship percentages.');

  const months = isCourse ? 6 : 12;
  const accommodation = accommodationFree ? 0 : (input.accommodationMonthly ?? cc.accommodationMonthlyCNY[input.accommodation][tier]) * months;
  const living = (input.livingMonthly ?? cc.livingMonthlyCNY[tier][input.lifestyle]) * months;
  const f = cc.fixedFeesCNY;
  const fixed = isCourse ? 0 : f.insurancePerYear + f.residencePermitPerYear;
  const extras = input.firstYearFees && !isCourse ? f.medicalCheckFirstYear + f.registrationFirstYear + f.applicationFeeOnce : 0;

  let stipend = 0;
  if (scenario.useProgrammeStipend) {
    if (program?.stipendCNYPerMonth) stipend = program.stipendCNYPerMonth * 12;
    else notes.push(program ? 'This programme does not list a monthly stipend.' : 'Choose a programme to include its monthly stipend.');
  }

  const firstYear = tuition + accommodation + living + fixed + extras - stipend;
  const laterYear = tuition + accommodation + living + fixed - stipend;
  const whole = isCourse ? firstYear : firstYear + laterYear * Math.max(0, years - 1);

  return {
    program,
    tier,
    years: isCourse ? 0.5 : years,
    isCourse,
    tuition,
    tuitionBase,
    accommodation,
    living,
    fixed,
    extras,
    stipend,
    firstYear,
    laterYear,
    whole,
    monthly: (accommodation + living) / months,
    notes,
  };
}

/** Same scenario self-funded vs the best scholarship scenario, for "a scholarship could save you X". */
export function scholarshipSaving(input: CostInput): { saving: number; label: string } | null {
  const current = calculate(input).firstYear;
  const self = calculate({ ...input, scenario: 'self' }).firstYear;
  if (input.scenario !== 'self') return self - current > 0 ? { saving: self - current, label: 'compared with paying full tuition' } : null;
  const best = calculate({ ...input, scenario: 'tuition' }).firstYear;
  return self - best > 0 ? { saving: self - best, label: 'with a tuition-free scholarship' } : null;
}

export const ALL_CITIES = (Object.entries(cc.cityTiers) as [Tier, string[]][]).map(([tier, cities]) => ({
  tier,
  cities: [...cities].sort(),
}));
