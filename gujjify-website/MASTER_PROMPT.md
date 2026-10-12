# MASTER PROMPT — IFFI Global Education Consultants website (Google AI Studio Build)

> **How to use:** import this repository into AI Studio Build first (see README.md), then either
> paste everything below the line into the chat, **or** send this short message:
> *"Read MASTER_PROMPT.md in the project root and implement it completely, following its build order."*

---

## 1. ROLE & MISSION

You are a senior product designer and senior front-end engineer (React, TypeScript, Three.js, accessibility, SEO).
Build the new website for **IFFI Global Education Consultants** — a China study-abroad consultancy (legal entity **IFFI GLOBAL EDUCATION CONSULTANTS LTD**,
England & Wales; office in **Lahore, Pakistan**) that helps students from Pakistan and 37 other countries win
admissions, scholarships (CSC, provincial, university) and X1/X2 student visas for Chinese universities.

The website must:
1. feel **premium, elegant and trustworthy** — a luxury-education / private-bank feel, never a generic template;
2. be **effortless on a phone** (most visitors arrive from WhatsApp, Instagram and Facebook on mobile);
3. turn visitors into **WhatsApp conversations** (the business runs on WhatsApp);
4. make our real programme data tangible through an **interactive 3D map of China in the hero** that shows the
   provinces and cities where our programmes are;
5. offer **3 global tools** chosen from keyword research (10,325 searches across 38 countries):
   **Study Cost Calculator** (1,416 keywords, 37 markets) · **University & Programme Finder** (998 keywords,
   37 markets) · **Scholarship Eligibility Checker** (976 keywords, 38 markets).

## 2. NON-NEGOTIABLE RULES

1. **Data integrity.** Every programme fact comes ONLY from `src/data/*.json`, imported via
   `import { programs, provinces, site, tools, meta, whatsappLink } from '@/data'` (map geometry:
   `import { chinaGeo } from '@/data/geo'`, only inside the lazy-loaded map components).
   Never invent programmes, universities, fees, stipends, rankings, deadlines, statistics, testimonials,
   team members, photos of "our students", partner logos or reviews. If `src/data` is missing, STOP and tell
   the user to import the `gujjify-website` repository — do not fabricate data.
2. **No university names.** They were removed from the dataset on purpose (students must come through IFFI Global).
   Use `program.displayName` (e.g. "Bachelor programme in Shenzhen"), city, province, ranking and status.
   Where a user would expect a name, show `site.disclaimers.universityNames`.
3. **Data freshness.** Programme data comes from 2024–2025 brochures; all 2025 deadlines have passed.
   Show `site.disclaimers.dataFreshness` on the finder, programme pages, province pages and all tools.
   Show deadlines only as **"Usually closes: {typicalDeadlineMonth}"** — never show `deadline2025` as a date.
4. **Unverified content stays hidden in production.** Do not render `site.stats.marketingClaims`
   (`publish: false`), testimonials with `publish: false`, FAQ items whose `status !== "published"`, or offices
   with `verified: false`. In development (`import.meta.env.DEV`) render them with a small amber "Draft" badge so
   the client can review them. Use `site.stats.dataBacked` for all public numbers.
5. **Brand palette only.** Use the Tailwind tokens in `src/index.css` (`@theme`): `navy`, `navy-2`, `navy-3`,
   `gold`, `gold-2`, `gold-deep`, `gold-soft`, `ink`, `muted`, `line`, `paper`, `mist`, `good`, `whatsapp`, `danger`.
   No new brand colours (transparent/opacity variants are fine).
6. **WhatsApp-first.** Every primary CTA opens WhatsApp via `whatsappLink(message)` using the matching template in
   `site.whatsapp.messages` (fill `{placeholders}`). Open in a new tab with `rel="noopener"`.
7. **Legal.** The footer shows `site.legal.footerDisclosure` (UK law requires it). Build Privacy, Terms and
   Cookie pages. The cookie banner must really block analytics until the visitor accepts.
8. **MBBS.** Never claim PM&DC (or any national medical council) recognition for a specific programme.
   Show `site.disclaimers.mbbsRecognition` on all MBBS content.
9. **Read-only data.** Do not rename fields in `src/types/data.ts` or edit files in `src/data/`. Derive what you
   need in helper functions (`src/lib/*`).
10. **Accessibility** WCAG 2.2 AA, full keyboard support, visible focus, `prefers-reduced-motion` respected.
11. **Gold text contrast.** Gold text on white/paper fails contrast for small text. On light backgrounds use
    `navy`/`ink` for text and keep gold for icons, borders, large display text (≥ 24 px) and accents.
    On navy backgrounds `gold-2` text is fine at any size.

## 3. TECH STACK (already installed — see package.json; do not swap libraries)

- React 19 + TypeScript (strict) + Vite 8. Path alias `@/` → `src/`.
- Tailwind CSS v4 with brand tokens in `src/index.css`. If the runtime cannot run the Tailwind Vite plugin,
  fall back to the Tailwind CDN build and re-declare the same tokens — never change the colours.
- `react-router-dom` v7 (BrowserRouter) · `three` + `@react-three/fiber` + `@react-three/drei` (3D map) ·
  `d3-geo` (projection + SVG fallback map) · `motion` (`import { motion } from 'motion/react'`) · `lucide-react` icons.
- React 19 document metadata: render `<title>`, `<meta>`, `<link rel="canonical">` inside page components.
- Lazy-load heavy parts: `const ChinaMap3D = lazy(() => import('@/components/map/ChinaMap3D'))`.
- Static SPA — no backend needed. Optional env vars: `VITE_GA4_ID`, `VITE_FORM_ENDPOINT`.
- Keep `public/.htaccess`, `public/robots.txt`, `public/sitemap.xml`, `public/og-image.png`, favicons.

Suggested structure: `src/pages/*`, `src/components/{layout,ui,map,programmes,tools,sections}/*`,
`src/lib/{format,currency,cost,eligibility,filters,seo,storage}.ts`, `src/hooks/*`.

## 4. THE DATA (src/data — read DATA_DICTIONARY.md for every field)

| Export | Contents |
|---|---|
| `programs: Program[]` | 72 programmes — Bachelor 42 (B-10 is a Master), MBBS 6, Master 18, PhD 5, Language 1. 60 English-taught, 23 fully funded, 34 with a monthly stipend, 51 with a tuition-free scholarship option. Key fields: `id`, `slug`, `level`, `displayName`, `city`, `province`, `coordinates`, `teachingLanguages`, `ranking`, `status`, `majors`, `fields`, `scholarships`, `costItems`, `tuitionStandardCNYPerYear`, `tuitionMaxListedCNYPerYear`, `tuitionMinCNYPerYear`, `stipendCNYPerMonth`, `fullyFunded`, `languagePolicy`, `noIeltsRequired`, `ageRange`, `bankStatementUSD`, `documents`, `typicalDeadlineMonth`, `interview`, `introVideoRequired`. |
| `provinces: Province[]` | 21 provinces with programmes: `name`, `nameZh`, `adcode`, `programCount`, `programsByLevel`, `cities[]` (30 cities with lat/lng + programIds), `provinceWideProgramIds`, `maxStipendCNYPerMonth`, `sampleMajors`. |
| `chinaGeo: ChinaGeo` (from `@/data/geo`) | 34 province-level regions (simplified GeoJSON MultiPolygons, `[lng, lat]`). Properties: `adcode`, `name`, `nameZh`, `centroid`, `hasPrograms`, `programCount`. |
| `site` | Brand, contact, social links, legal, navigation, hero copy, stats, 8 services, why-us, 5-step process, about, 13 FAQs, testimonial, document checklist, promoted programmes, WhatsApp message templates, 9 blog posts, SEO titles/descriptions per route, old-URL redirects, disclaimers. |
| `tools` | Keyword-demand evidence, currency config (38 market currencies + USD/GBP/EUR/CNY, live-rates URL, fallback rates), cost-calculator constants, eligibility rules, finder config. |
| `meta` | Sources, counts, intake notes, data rules. |

Helpers already exported: `programById`, `programBySlug`, `provinceByName`, `provinceByAdcode`, `whatsappLink()`.

Province overview (also used by the hero tour order):

| Province | Programmes | Levels | Cities (beacons) | Max stipend CNY/mo |
|---|---|---|---|---|
| Jiangsu 江苏 | 15 | Bachelor 9, MBBS 2, Master 3, PhD 1 | Changzhou, Nanjing, Nantong, Xuzhou, Yangzhou, Zhenjiang | 3500 |
| Zhejiang 浙江 | 8 | Bachelor 5, Master 3 | Hangzhou, Jinhua, Shaoxing, Wenzhou | 3000 |
| Hubei 湖北 | 6 | Bachelor 2, MBBS 1, Master 3 | Wuhan | 3000 |
| Sichuan 四川 | 6 | Bachelor 5, MBBS 1 | Chengdu, Dazhou, Nanchong, Neijiang | – |
| Tianjin 天津 | 4 | Bachelor 3, Master 1 | Tianjin | 3000 |
| Shanghai 上海 | 4 | Bachelor 4 | Shanghai | 1000 |
| Guangdong 广东 | 4 | Bachelor 2, MBBS 1, Master 1 | Guangzhou, Shenzhen | 3000 |
| Shaanxi 陕西 | 4 | Bachelor 1, Master 3 | Xi'an | 3000 |
| Heilongjiang 黑龙江 | 3 | Bachelor 1, Master 1, PhD 1 | Harbin | 3500 |
| Henan 河南 | 3 | Bachelor 1, MBBS 1, PhD 1 | Zhengzhou | 3500 |
| Beijing 北京 | 2 | Bachelor 2 | Beijing | 1800 |
| Jiangxi 江西 | 2 | Bachelor 1, PhD 1 | Ganzhou | 3500 |
| Hunan 湖南 | 2 | Bachelor 2 | Changsha | – |
| Guangxi 广西 | 2 | Master 1, Language 1 | Nanning | 3000 |
| Hebei 河北 | 1 | Bachelor 1 | Shijiazhuang | – |
| Liaoning 辽宁 | 1 | Master 1 | (province-wide) | 3000 |
| Anhui 安徽 | 1 | PhD 1 | (province-wide) | 3500 |
| Fujian 福建 | 1 | Bachelor 1 | Fuzhou | 800 |
| Shandong 山东 | 1 | Bachelor 1 | Zibo | – |
| Yunnan 云南 | 1 | Bachelor 1 | Kunming | – |
| Gansu 甘肃 | 1 | Master 1 | (province-wide) | 3000 |

## 5. DESIGN SYSTEM — "Navy & Gold, quietly luxurious"

**Palette (tokens):** navy `#0d1f3f` (hero, footer, dark sections), navy-2 `#13294f` (header, panels), navy-3
`#1c3a6b` (gradients), gold `#c8a24c` (primary buttons, accents), gold-2 `#e0bd6b` (gold on dark), gold-deep
`#b48d39` (hover), gold-soft `#f7efdd` (tints), ink `#1d2738` (body text), muted `#697185`, line `#e7eaf1`,
paper `#f6f8fc` (page background), mist `#cdd6e6` (text on navy), whatsapp `#25d366`.

**Typography:** headings Fraunces (600; use optical sizing; tight leading 1.1–1.2; gold italic accent words),
body Poppins (400/500, 16–17 px, leading 1.65). Fluid scale: display `clamp(2.6rem, 5vw, 4.6rem)`,
h2 `clamp(1.9rem, 3vw, 2.6rem)`. Numerals for stats in Fraunces. Small caps-style eyebrow labels
(13 px, letter-spacing .14em, uppercase).

**Premium details:** 1 px gold hairlines and inner borders (`border-gold/30`), glass panels on navy
(`bg-white/5 backdrop-blur border-white/10`), soft layered shadows (`shadow-soft`, `shadow-lift`, `shadow-glow`),
subtle film-grain overlay on dark sections (inline SVG noise, ≤ 4 % opacity), radial gold glows, generous
whitespace (sections 96–128 px desktop / 64 px mobile), rounded-card 16 px, pill buttons, gold gradient text for
the hero accent (`bg-gradient-to-r from-gold-2 to-gold bg-clip-text`).

**Motion:** calm and purposeful — 200–600 ms, ease `[0.22, 1, 0.36, 1]`; fade-up reveals once per section;
count-up stats; hover lift on cards (−4 px). All motion disabled under `prefers-reduced-motion`.

**Imagery:** no stock photos of people and no hot-linked images. Use the 3D/2D map, abstract navy/gold
geometric patterns (deterministic SVG per slug), Lucide icons in gold-on-navy tiles, and the logo crest.
Logo: `src/assets/brand/logo-mark-gold.png` on dark, `logo-mark-navy.png` on light, `logo-mark-white.png`
where gold clashes. Wordmark is live text: "IFFI Global" (Fraunces 600) + "CONSULTANT" (Poppins, tracking .28em, gold).

**Components to build once and reuse:** Container, Section (light/dark/tinted variants with eyebrow + title +
lede), Button (gold / navy / outline / ghost / whatsapp; sizes sm/md/lg; icon slot), Badge, Chip/Toggle,
Card, Stat, Accordion, Tabs, Drawer/BottomSheet, Tooltip, Select, Slider, Stepper, EmptyState, Disclaimer,
WhatsAppButton, PageHeader (navy band with breadcrumb), SEO (title/description/canonical/OG/JSON-LD).

## 6. INFORMATION ARCHITECTURE (routes)

`/` Home · `/programmes` University & Programme Finder · `/programmes/:slug` Programme detail ·
`/provinces/:province` Province page (lower-case name, e.g. `/provinces/jiangsu`) · `/tools` Tools hub ·
`/tools/cost-calculator` · `/tools/eligibility-checker` · `/services` · `/about` · `/blog` · `/blog/:slug` ·
`/faq` · `/contact` · `/privacy` · `/terms` · `/cookies` · `*` 404.
These routes match `public/sitemap.xml` and the old-URL redirects in `public/.htaccess` — keep them.

## 7. GLOBAL LAYOUT

- **Top bar** (navy, 40 px, hidden on mobile): email, phone (`tel:`), Facebook, Instagram, WhatsApp icons
  (`site.social`), right side "Free consultation" link.
- **Header** (sticky, navy-2, becomes slightly translucent with blur after scrolling 24 px): crest + wordmark;
  nav from `site.navigation` (Tools = elegant dropdown with the 3 tools, each with icon + one-line description);
  right: Shortlist icon with count badge, gold "Free Consultation" button (WhatsApp `heroConsultation`).
  Mobile: crest, shortlist, menu button → full-height sheet with large tap targets and WhatsApp CTA at the bottom.
- **Footer** (navy): crest + tagline + socials; Quick links; Tools; Contact (phone, email, WhatsApp, Lahore,
  UK registered office); bottom row: `site.legal.footerDisclosure`, links to Privacy/Terms/Cookies,
  `site.legal.copyright`, `site.legal.credit`.
- **Floating WhatsApp button** (bottom-right, whatsapp green, gentle pulse ring, hides when the footer CTA is visible)
  · **Back-to-top** (appears after 600 px) · **Cookie consent** (bottom card: Accept / Reject / Settings;
  stores choice for 12 months; analytics only after Accept) · **Shortlist drawer** (see Finder).
- Skip-to-content link, `<main id="content">`, breadcrumbs on inner pages.

## 8. HOME PAGE

### 8.1 HERO — "Your Gateway to Study in China" with the 3D China Programme Map (signature element)

**Layout.** Navy background with depth: radial gold glow top-right (≈18 % opacity), faint dotted grid,
film grain. Desktop ≥ 1024 px: 12-column grid — copy in columns 1–5, map canvas in 6–12 (may bleed to the right
edge), min-height `calc(100svh - header)`. Tablet: copy then map (60vh). Mobile: copy, then a 440 px map card.

**Copy (left):** eyebrow pill (graduation-cap icon + `site.hero.eyebrow`); H1 `site.hero.headline` with
`site.hero.headlineAccent` in gold gradient italic; `site.hero.subheadline`; CTAs: gold pill
"Free Consultation on WhatsApp" (`heroConsultation`) and outline "Explore Programmes" (`/programmes`);
stat row with count-up numbers: **72 programmes · 21 provinces · 30 cities** (from `meta.counts`);
trust line: "UK-registered company · Lahore office · Replies within minutes on WhatsApp".

**3D map (React Three Fiber, lazy-loaded `ChinaMap3D`):**
- **Geometry:** `chinaGeo.features` (34 regions) from `@/data/geo` (keeps the 114 KB geometry out of the main bundle). Project `[lng, lat]` with `d3-geo` `geoMercator()`
  (`fitSize` to a ~100 × 80 unit plane, flip Y). For each polygon build a `THREE.Shape` (outer ring + holes) and an
  `ExtrudeGeometry` (small bevel: size 0.12, thickness 0.08, segments 2). Build once in `useMemo`; merge per material.
- **Two tiers:**
  - Provinces **without** programmes (13): depth 0.6, `meshStandardMaterial` navy-2 `#13294f`, roughness 0.85;
    top outline lines `#2a4a80` at 60 % opacity.
  - Provinces **with** programmes (21, `properties.hasPrograms`): depth `1.0 + programCount × 0.18`
    (Jiangsu tallest); `meshPhysicalMaterial` colour interpolated from gold-deep `#b48d39` (1 programme) to gold-2
    `#e0bd6b` (15), metalness 0.55, roughness 0.35, clearcoat 0.3; gold-2 edge lines; emissive gold 0.05 → 0.35 on hover.
- **City beacons:** for every `provinces[].cities[]` (30): a small glowing sphere on top of the extrusion, a thin
  vertical light beam (additive blending, gold → transparent) and a pulsing ring (scale 1 → 2.2, opacity .6 → 0,
  2.4 s loop, staggered). Province-wide programmes (`provinceWideProgramIds`) get a smaller hollow ring at the
  province centroid.
- **Labels:** drei `<Html>` pills (navy glass, Fraunces name + gold count) for the top 6 provinces on desktop;
  all other labels appear on hover/focus. Show `nameZh` small next to the English name.
- **Lighting & camera:** hemisphere light (sky gold-2, ground navy, 0.35), key directional light top-left with soft
  shadows (1024 map), cool rim light. No external HDRI/textures. Perspective camera FOV 35, ~55° tilt, framed on
  eastern China where programmes cluster (target ≈ 112°E, 31°N). Idle "breathing" sway ±3° over 12 s + pointer
  parallax (≤ 4°). Never hijack page scroll: no wheel zoom; drag-rotate only on desktop within azimuth ±20°,
  polar 35–65°; double-click resets.
- **Auto-tour:** every 4 s highlight the next province in descending `programCount`: lift +0.6 with a spring,
  glow, open its info card. Pause on hover/focus/touch, resume after 8 s idle. Disabled under reduced motion.
- **Interaction:** hover/tap a province (raycast) → lift +0.5 and show the **info card** (glass panel): English +
  Chinese name, "15 programmes", level chips (`programsByLevel`), cities list, "Stipends up to 3,500 CNY/month"
  (when `maxStipendCNYPerMonth`), 3 `sampleMajors`, buttons **"View programmes →"** (`/provinces/:province`) and
  **"Ask about {province}"** (WhatsApp `provinceInterest`). Clicking a city beacon → `/programmes?city={city}`.
- **Legend** (bottom-left): gold gradient bar "Programmes per province 1 → 15", beacon = "City with programmes",
  caption `site.hero.mapCaption`.
- **Accessibility:** the canvas has `role="img"` and a descriptive `aria-label`; below it a "List view" toggle /
  row of 21 province chips (sorted by count, keyboard-navigable) with the same actions.
- **Fallbacks:** build `ChinaMap2D` (SVG from the same `chinaGeo` via `geoPath`, gold fills for programme
  provinces, same hover/click/info card). Lazy-load it too (it imports `@/data/geo`); show a soft navy skeleton with the legend until it arrives, then use it as the poster while the 3D chunk loads (no layout shift), and use
  it permanently when WebGL is unavailable or `prefers-reduced-motion` is set. Mobile: 3D allowed but lighter
  (no shadows, DPR ≤ 1.5, no auto-rotate; tap to select).
- **Performance:** DPR `[1, 1.75]`; pause rendering when the hero is off-screen (IntersectionObserver +
  `frameloop="demand"` when idle); dispose geometries on unmount; target 60 fps on a mid-range laptop.

### 8.2 Sections below the hero (in this order)
1. **Trust strip** — `site.stats.dataBacked` as elegant stat tiles (Fraunces numerals) + logo row of
   "UK registered · WhatsApp support · Free counselling" icons.
2. **3 Global Tools** — three large cards (Finder, Cost Calculator, Eligibility Checker) with icon, benefit line,
   a mini live preview (e.g. "Bachelor in Tier-2 city ≈ 1,500 CNY/month living"), and CTA. Add a small caption:
   "Built from what students in 38 countries search for".
3. **Where you can study** — a horizontal scroller of province cards (top 8 by programmes) linking to
   `/provinces/:province`; plus "See all 21 provinces".
4. **Programme highlights** — 4 tabs: Fully funded (Master & PhD, stipend up to 3,500 CNY), No IELTS required,
   MBBS (6 programmes, show the MBBS disclaimer), English-taught Bachelor — each shows 3 programme cards + link
   to the pre-filtered finder.
5. **Services** — 8 services (`site.services`) in a refined grid; each links to `/services#{id}`.
6. **How it works** — `site.process.steps` as a 5-step timeline + the "Behind every admission letter" checklist
   (`site.process.behindTheScenes`).
7. **Why IFFI Global** — `site.whyUs` (4) beside a navy panel with the crest.
8. **FAQ preview** — 5 published FAQs + "All FAQs".
9. **Final CTA band** — gold gradient band: "Ready to start your China study journey?" + WhatsApp (`ctaJourney`)
   + "Check my eligibility" button.

## 9. THE 3 GLOBAL TOOLS

Shared: each tool page has a navy PageHeader, the data-freshness disclaimer, a currency/country selector where
relevant, shareable URL state (query params), results announced with `aria-live="polite"`, and a WhatsApp CTA
that sends a compact summary. Tools link to each other: Eligibility → matched programmes in the Finder;
Finder card → "Estimate cost" (Calculator pre-filled with `?program=ID`); Map → Province page → Finder.

### 9.1 University & Programme Finder — `/programmes`
- **Layout:** desktop filter rail (left, sticky) + results grid; mobile: sticky "Filters (n)" button → bottom sheet.
  Result count + sort select + active-filter chips (removable) above results. All filters sync to the URL.
- **Filters:** Level (chips); Study field (`tools.finder.fields`, from `program.fields`); Major search (matches
  `majors`, highlights the hit); Province & City (multi-select + a mini 2D map picker); Teaching language
  (English / Chinese); Funding: Fully funded · Monthly stipend · Tuition-free option (`tuitionMinCNYPerYear === 0`);
  No IELTS required; Max tuition (slider on `tuitionMaxListedCNYPerYear`, shown in CNY + selected currency);
  Top 50 in China (`ranking.china ≤ 50`); No interview / no video required.
- **Sort:** Best match · Lowest tuition · Highest stipend · Best China ranking · Most majors.
- **Programme card:** `displayName`; city, province + 中文; badges (level, teaching language, Fully funded,
  Stipend X CNY/mo, Tuition-free option, No IELTS, China rank #N, `status` such as "211 · 985 · C9");
  first 4 majors + "+N more"; tuition line ("Tuition 0–30,000 CNY/yr depending on scholarship"; append "est." when
  `tuitionStandardEstimated`); "Usually closes: {typicalDeadlineMonth}"; actions: Details, ♥ Shortlist, Compare,
  "Estimate cost".
- **Shortlist** (localStorage, max 10): header icon + drawer; **Download PDF** = `window.print()` with a print
  stylesheet that renders a branded one-page-per-3-programmes list (crest, date, programme summaries, disclaimers,
  contact) — students search "china university list pdf"; **Send on WhatsApp** (`shortlist` message with IDs).
- **Compare** (max 3): sticky tray → comparison table (level, location, ranking, teaching language, majors,
  scholarships, tuition, stipend, language requirement in plain words, age, bank statement, documents count,
  interview/video, usual deadline month).
- **Empty state:** suggest which filter to remove (show how many results each removal would give) + WhatsApp CTA.
- Note in the UI: CSC "agency numbers" are not listed — ask us on WhatsApp (`tools.finder.agencyNumberNote`).

**Programme detail — `/programmes/:slug`:** header (displayName, location, badges, share), at-a-glance grid
(level, duration, teaching language, ranking, stipend, tuition range, usual deadline), full majors list
(searchable), scholarships, cost items (`costItems`) + "Estimate my total cost" (calculator pre-filled),
language & requirements explained in plain English from `languagePolicy` / `ageRange` / `bankStatementUSD` /
`interview` / `introVideoRequired`, documents checklist (tickable, printable), location mini-map (2D, province
highlighted, city pin), similar programmes (same field or province), disclaimers, sticky mobile CTA
"Apply with IFFI Global" (WhatsApp `programInterest`). Title: `{displayName} – {n} majors | IFFI Global`.

### 9.2 Study Cost Calculator — `/tools/cost-calculator`
- **Modes:** "Estimate by level & city" or "Use a specific programme" (`?program=ID` pre-fills everything).
- **Inputs:** level; programme (optional searchable select); city (30 cities grouped by tier from
  `tools.costCalculator.cityTiers`, auto-set from programme); scholarship scenario
  (`tools.costCalculator.scholarshipScenarios`); accommodation (shared dorm / single dorm / off-campus — forced to 0
  when the scenario has `accommodationFree`); lifestyle (lean / standard / comfortable); include first-year one-time
  fees (default on); optional "flight + visa" amount in the user's currency; currency selector (flag + code; default
  from `tools.currency.defaultByTimezoneHint` using `Intl.DateTimeFormat().resolvedOptions().timeZone`, else
  `defaultCurrency`).
- **Maths (CNY, per year):**
  - tuition = programme `tuitionStandardCNYPerYear ?? tuitionMaxListedCNYPerYear ?? levelDefaults[level].tuitionMedianCNY`
    × scenario `tuitionFactor`; if `tuitionAndDormCombinedCNYPerYear` exists use it and set accommodation 0;
    Language level uses `courseTotalCNY` for the whole course.
  - accommodation = `accommodationMonthlyCNY[type][tier] × 12` (0 if free); living =
    `livingMonthlyCNY[tier][lifestyle] × 12`; fixed = `insurancePerYear + residencePermitPerYear`;
    first-year extras = `medicalCheckFirstYear + registrationFirstYear + applicationFeeOnce`;
    stipend (fully funded scenario with `stipendCNYPerMonth`) = stipend × 12, shown as income that offsets living.
  - Totals: first year, each later year, whole programme (`levelDefaults[level].durationYears`).
- **Currency:** fetch `tools.currency.liveRatesUrl` (cache 12 h in sessionStorage); on failure try
  `liveRatesFallbackUrl`, then `fallbackRates` (show "rates from {fallbackRatesDate}"). Response keys are lower-case.
- **Output:** large first-year total in the chosen currency (CNY underneath), monthly budget, custom SVG
  donut/stacked bar (tuition · accommodation · living · fees — brand colours, no chart library), "A scholarship
  could save you X", whole-programme total, assumptions list (editable constants, sourced), disclaimer
  (`site.disclaimers.costEstimate`), CTA "Get an exact quote on WhatsApp" (`costEstimate` with a one-line summary),
  "Copy link" to share the scenario.

### 9.3 Scholarship Eligibility Checker — `/tools/eligibility-checker`
- **Stepper** (one question per screen on mobile; progress bar; Back/Next; keyboard friendly; answers kept in
  sessionStorage only — say "Your answers stay in your browser"):
  1. Level (`tools.eligibilityChecker.levels` with the requirement shown under each option)
  2. Age
  3. Last result — percentage, or CGPA + scale (4 / 5 / 10) → approximate % (label it "approx.")
  4. English — IELTS / TOEFL / Duolingo / PTE score, or "English-medium letter", or "No test yet"
  5. Chinese — HSK level 0–6
  6. Preferences — teaching language (English / Chinese / either) + funding (full scholarship only / partial OK /
     self-funded OK) + field of interest (optional)
  7. Bank statement capacity (`bankStatementOptions`) + your country (sets currency & WhatsApp context)
- **Matching:** implement `tools.eligibilityChecker.rules` in `src/lib/eligibility.ts` (pure, unit-testable).
  Classify every programme as **Match**, **Near match** (fails exactly one soft criterion, e.g. IELTS 0.5 short)
  or **Not eligible** (with the reason).
- **Results:** band card from `scoreBands` (Strong / Good / Possible / Needs a plan) with its explanation;
  "You match N programmes (x fully funded, y with stipend)"; top 6 matches as cards + "See all matches" (opens the
  Finder filtered to the matched IDs); **"Unlock more"**: re-run the matcher with IELTS 6.0, HSK 4 and a USD 5,000
  bank statement and show the 2 biggest gains ("IELTS 6.0 would unlock 9 more programmes"); personalised document
  checklist (`site.documentChecklist` + level extras: Master/PhD → recommendation letters, CV, research proposal;
  MBBS → pre-medical transcripts); disclaimer (`tools.eligibilityChecker.disclaimer`); CTAs
  "Book my FREE eligibility assessment" (WhatsApp `eligibilityResult` with a compact summary) and "See my matches".

## 10. OTHER PAGES

- **Province page `/provinces/:province`:** navy hero with the 2D map zoomed to the province (programme cities
  pinned), name + 中文, stats (programmes by level, cities, max stipend, English-taught count, fully funded count),
  living-cost tier note for its cities (from `tools.costCalculator`), programme cards (filtered), "Compare with
  another province", WhatsApp `provinceInterest`. Title: `Study in {Province}, China – {n} programmes | IFFI Global`.
  Unknown province → 404.
- **Tools hub `/tools`:** the 3 tools as hero cards + "why these tools" (demand evidence from
  `tools.demandEvidence`, shown tastefully as "searched in 38 countries").
- **Services:** sticky side index + 8 detailed service sections (`site.services`, anchor ids = `id`) with
  "Ask about this" (`serviceInterest`), the 5-step timeline, CTA.
- **About:** `site.about` story, mission / vision / values cards, "Where we are" (verified offices only in
  production), company details (`site.legal`), values, CTA. A team section exists only behind a feature flag (no team
  data yet).
- **Blog `/blog` + `/blog/:slug`:** 9 posts from `site.blogSeeds` (render `body` paragraphs; reading time;
  deterministic navy/gold SVG cover per slug; related tool CTA — cost post → calculator, CSC/eligibility posts →
  checker, university posts → finder; WhatsApp `blogGuidance`). In development show a "thin content — expand"
  banner (posts are 46–90 words).
- **FAQ:** searchable accordion grouped by topic (Scholarships, Costs, Language, Visa, MBBS, Process); FAQPage
  JSON-LD for published items; "Still have a question?" WhatsApp (`faqQuestion`).
- **Contact:** WhatsApp card (primary, large), call, email, offices, social links, contact form (name*, email*,
  phone/WhatsApp, country, study level, message*, consent checkbox linking to Privacy, hidden honeypot). If
  `VITE_FORM_ENDPOINT` is set, POST JSON to it; otherwise open WhatsApp with the form content pre-filled. Clear
  success / error states.
- **Privacy / Terms / Cookies:** clean, readable templates naming IFFI GLOBAL EDUCATION CONSULTANTS LTD (company no. 16657100, registered
  office from `site.legal`), contact email, data collected (form fields, WhatsApp, cookie choice, analytics if
  accepted), UK GDPR rights; terms: information only, no guarantee of admission/scholarship/visa, fees change yearly.
  Add a visible note "Template — have it reviewed by a professional".
- **404:** elegant navy page with the 2D map and links to Finder, Tools, WhatsApp.

## 11. SEO & SHARING

- Per-route `<title>` / description from `site.seo.routes`; programme and province pages generate their own.
- Canonical `https://www.iffiglobal.com{path}`; Open Graph + Twitter tags with `/og-image.png` (1200 × 630).
- JSON-LD: `Organization` + `ProfessionalService` (name, legalName, url, logo, `sameAs` = Facebook + Instagram,
  contactPoint WhatsApp/phone, address = UK registered office) on every page; `FAQPage` on /faq;
  `BreadcrumbList` on inner pages. Do not use Course schema (it requires university names).
- Keep `public/sitemap.xml` in sync with routes (72 programme, 21 province, 9 blog URLs); `robots.txt` stays.
- Semantic headings (one H1 per page), descriptive link text, `alt` text for every meaningful image.

## 12. PERFORMANCE, ACCESSIBILITY, PRIVACY

- Budgets: LCP < 2.5 s on a mid-range phone (hero text/SVG poster first, 3D lazy), CLS < 0.1, initial JS < 200 KB
  gzip excluding the 3D chunk. Fonts `display=swap`. Route-level code splitting.
- WCAG 2.2 AA: gold focus ring (2 px, offset 2), 44 px touch targets, labels on every input, error text tied with
  `aria-describedby`, dialogs/drawers trap focus and close on Esc, accordion = buttons with `aria-expanded`.
- Analytics: only when `VITE_GA4_ID` is set AND the visitor accepted cookies.
- No personal data leaves the browser except through WhatsApp/mailto or the optional form endpoint.

## 13. BUILD ORDER & DEFINITION OF DONE

Implement in this order. Finish each phase cleanly (app compiles, no broken imports) before the next. If you run
out of room, stop at a phase boundary, list what remains, and continue when the user says **"continue"**.

1. **Foundation** — router + all routes (placeholder pages OK at first), layout (top bar, header, mobile sheet,
   footer with legal disclosure), UI primitives, SEO component, cookie consent, floating WhatsApp, shortlist store,
   `src/lib` helpers (format CNY/currency, whatsapp templates, filters).
2. **Home + hero map** — `ChinaMap2D` (poster/fallback) then `ChinaMap3D` (lazy), all home sections.
3. **Finder** — filters, cards, URL sync, shortlist + PDF print view, compare, programme detail, province pages.
4. **Tools** — cost calculator (with live rates + fallback) and eligibility checker (pure matcher + results).
5. **Content pages** — services, about, blog, FAQ, contact, legal, 404; JSON-LD; polish, a11y and performance pass.

**Definition of done (check every item):**
- [ ] Hero shows the 3D map with all 21 programme provinces raised in gold, 30 city beacons, info card, auto-tour,
      list view, and the SVG fallback (test by forcing the fallback).
- [ ] Clicking a province opens `/provinces/{name}`; clicking a beacon opens the finder filtered by city.
- [ ] Finder filters, sort, URL sync, shortlist (persisted), PDF print view and compare all work on mobile.
- [ ] Cost calculator totals change correctly with scenario/tier/lifestyle; currency converts with live rates and
      falls back offline; WhatsApp summary is pre-filled.
- [ ] Eligibility checker classifies programmes per the rules, shows "unlock more", and links to matched results.
- [ ] No university names anywhere; no invented numbers; disclaimers shown where required; drafts hidden in prod.
- [ ] Footer legal disclosure, Privacy/Terms/Cookies pages, consent-gated analytics.
- [ ] Lighthouse (mobile) ≥ 90 for Accessibility, Best Practices and SEO; no console errors.
- [ ] Looks premium at 360 px, 768 px, 1280 px and 1920 px widths.
