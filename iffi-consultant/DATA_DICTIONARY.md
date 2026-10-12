# Data dictionary — `src/data`

All files are generated from the research folder (see `data-pipeline/` in the research repository) and are
**read-only** for the website. Import them only through `src/data/index.ts`:

```ts
import { programs, provinces, site, tools, meta, whatsappLink,
         programById, programBySlug, provinceByName, provinceByAdcode } from '@/data';
import { chinaGeo } from '@/data/geo';   // only inside lazy-loaded map components
```

Types live in `src/types/data.ts`; `npm run typecheck` verifies the JSON against them.

## Ground rules
- **University names were removed on purpose** — never add them. Use `displayName`.
- Programme data comes from **2024–2025 brochures**; all 2025 deadlines have passed. Show `typicalDeadlineMonth`,
  never `deadline2025`, and always show `site.disclaimers.dataFreshness` next to programme data.
- Money is in **CNY** (RMB) unless the field name says USD.

---

## programs.json — 72 programmes

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `B-xx` Bachelor (B-10 is a Master), `M-xx` MBBS, `MA-xx` Master, `P-xx` PhD, `L-01` 6-month language course |
| `slug` | string | URL slug, e.g. `b-04-bachelor-shenzhen` → `/programmes/b-04-bachelor-shenzhen` |
| `level` | string | `Bachelor` · `MBBS` · `Master` · `PhD` · `Language` |
| `levelDetail` | string \| null | Level text as written in the brochure (e.g. "Bachelor Degree (1+3)") |
| `displayName` | string | Public name, e.g. "Bachelor programme in Shenzhen" |
| `city` / `province` | string \| null / string | Location. `city` is null when the brochure names only the province |
| `cityKnown` | boolean | false → `coordinates` are the provincial capital (approximate) |
| `provinceCode` | number | GB/T 2260 code, matches `chinaGeo` `adcode` |
| `coordinates` | {lat,lng} | City (or provincial capital) coordinates |
| `intake` | string \| null | e.g. "September 2025" |
| `duration` | string \| null | e.g. "3 years" (null when not stated) |
| `teachingLanguages` | string[] \| null | `English`, `Chinese`, `Bilingual` (null = not stated) |
| `chineseTaught` | boolean | Has a Chinese-taught track |
| `ranking` | {china?, world?} \| null | As stated in the brochure (`world` is a string, may be a range "201-300") |
| `status` | string \| null | e.g. "211, 985 and C9 Project University" |
| `majors` | string[] | Majors as listed (cleaned) |
| `fields` | string[] | Broad study fields derived from majors (9 values, see `tools.finder.fields`) |
| `scholarships` | string[] | Scholarship types (Type A/B/C…) as listed |
| `costItems` | string[] | Every cost line in the brochure (tuition, dorm, insurance, permit, deposits…) — display as a list |
| `tuitionStandardCNYPerYear` | number \| null | Tuition labelled original / standard / normal / full |
| `tuitionStandardEstimated` | boolean | true when the standard tuition was derived from scholarship percentages ("est.") |
| `tuitionMaxListedCNYPerYear` | number \| null | Highest annual tuition figure listed |
| `tuitionMinCNYPerYear` | number \| null | Best case; 0 when a scholarship type (or the programme) makes tuition free |
| `tuitionPerSemesterCNY` | number \| null | Only B-39 (pre-bachelor language semester) |
| `tuitionAndDormCombinedCNYPerYear` | number \| null | When the brochure quotes tuition + dorm together (B-09, B-33) |
| `courseTotalCNY` | number? | Only L-01 (5,000 CNY for 6 months incl. hostel) |
| `tuitionNote` | string \| null | Plain-language note for special cases |
| `tuitionFree` | string \| null | `all years`, `year 1`, `all years (scholarship)` |
| `fullyFunded` | boolean | Master / PhD offers (+ B-10): tuition + dorm free + stipend |
| `stipendCNYPerMonth` | number \| null | Highest monthly stipend offered |
| `languageRequirement` | string \| null | Raw brochure text |
| `languagePolicy` | object | `{ type, ielts?, toefl?, duolingo?, pte?, sat?, hsk?, hskScore?, note? }` — type: `none`, `internal-test`, `english-test`, `any-english`, `hsk`, `unspecified`, `not-stated` |
| `noIeltsRequired` | boolean | Brochure explicitly says no IELTS/Duolingo needed |
| `interview` | string \| null | Interview info |
| `introVideoRequired` | boolean | Self-introduction video required |
| `ageLimit` / `ageRange` | string \| null / {min,max} \| null | Age rules (numbers for the eligibility checker) |
| `bankStatementUSD` | number \| null | Minimum bank statement in USD (2,500 / 3,000 / 5,000) |
| `deadline2025` | string \| null | Past deadline (YYYY-MM-DD) — do not show as a date |
| `typicalDeadlineMonth` | string \| null | e.g. "May" or "Rolling (until seats fill)" — show this |
| `deadlineText` | string \| null | Raw deadline text |
| `documents` | string[] | Required documents |
| `headline` | string \| null | PhD brochure headline |
| `details` | Record<string,string[]> | Other brochure sections (payment flow, rules, conditions…) |
| `fees`, `tuition`, `dorm`, `stipendText`, `totalFee`, `deadlineText` | raw strings | Kept for completeness |

## provinces.json — 21 provinces with programmes
`name`, `nameZh`, `adcode`, `type` (Province / Municipality / Autonomous Region), `capital`, `center` {lat,lng},
`programCount`, `programsByLevel` {Bachelor: 9, …}, `cities[]` {name, lat, lng, programIds}, `provinceWideProgramIds`
(programmes with no city), `maxStipendCNYPerMonth`, `fullyFundedCount`, `englishTaughtCount`, `sampleMajors`,
`programIds`. Sorted by `programCount` (Jiangsu 15 first).

## china-provinces.geo.json — map geometry
GeoJSON FeatureCollection, 34 province-level regions, MultiPolygon `[lng, lat]`, simplified (6,442 points, 114 KB).
Properties: `adcode`, `name` (English), `nameZh`, `centroid` [lng, lat], `hasPrograms`, `programCount`.
Source: Alibaba DataV GeoAtlas (PRC standard map). The South China Sea dash-line feature was removed for a clean
3D render.

## site.json — copy & settings
`brand` (names, taglines, logo files, fonts, colours) · `contact` (phone, WhatsApp, email, offices with
`verified`) · `social` (proper URLs) · `legal` (company, number, registered office, footer disclosure) ·
`navigation` · `hero` · `stats.dataBacked` / `stats.marketingClaims` (publish:false) · `services` (8, with `id`,
Lucide `icon` name, `summary`, `detail`) · `whyUs` · `process` (5 steps + behind-the-scenes list) · `about` ·
`faq` (13; `status` = published / draft-…) · `testimonials` (publish:false) · `documentChecklist` ·
`programmesPromoted` · `whatsapp.messages` (templates with `{placeholders}`) · `blogSeeds` (9 posts with
original `body`) · `seo.routes` + `seo.oldUrlRedirects` · `disclaimers`.

## tools.json — the 3 tools
- `demandEvidence` — keyword counts per tool (why these 3 tools).
- `currency` — `liveRatesUrl`, `liveRatesFallbackUrl`, `fallbackRates` (1 CNY = x, dated `fallbackRatesDate`),
  `currencies[]` (country, code, currency, flag, keywordDemand), `defaultByTimezoneHint`, `defaultCurrency`.
- `costCalculator` — `fixedFeesCNY` (most common brochure values), `cityTiers`, `livingMonthlyCNY[tier][lifestyle]`,
  `accommodationMonthlyCNY[type][tier]`, `levelDefaults`, `scholarshipScenarios`, `optionalOneTime`.
  Living/accommodation figures are 2026 student-budget estimates — editable.
- `eligibilityChecker` — `levels`, `gradeInput`, `scoreBands`, `englishTests`, `hskLevels`,
  `bankStatementOptions`, `rules`, `disclaimer`.
- `finder` — `filters`, `fields`, `sort`, `shortlistMax`, `compareMax`, `pdfExport`, `agencyNumberNote`.

## meta.json
Sources, generation date, counts, intake notes, data rules.
