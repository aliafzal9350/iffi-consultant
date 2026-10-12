# IFFI Global Education Consultants: website

The new **iffiglobal.com**: a study-in-China site for IFFI Global Education Consultants (IFFI GLOBAL EDUCATION CONSULTANTS LTD). React 19 + TypeScript + Vite 8 +
Tailwind CSS v4, prerendered to static HTML for SEO, with a 3D programme map of China and three free tools.
`MASTER_PROMPT.md` is the full specification the site implements.

## What is in it

| Area | Where |
|---|---|
| Home with the 3D China programme map (React Three Fiber, SVG fallback, list view) | `src/pages/Home.tsx`, `src/components/map/*` |
| University & Programme Finder: filters, URL sync, shortlist, PDF print sheet, compare | `src/pages/Finder.tsx`, `src/components/programmes/*`, `src/lib/filters.ts` |
| 72 programme pages and 21 province pages | `src/pages/ProgrammeDetail.tsx`, `src/pages/ProvincePage.tsx` |
| Study Cost Calculator (live exchange rates with offline fallback) | `src/pages/CostCalculator.tsx`, `src/lib/cost.ts`, `src/lib/currency.ts` |
| Scholarship Eligibility Checker (pure matcher + "unlock more") | `src/pages/EligibilityChecker.tsx`, `src/lib/eligibility.ts` |
| Services, About, FAQ, Contact, Privacy, Terms, Cookies, 404 | `src/pages/*` |
| Blog: 9 articles written around the keyword research | `src/content/blog.ts` |
| Titles, descriptions, canonicals, Open Graph, JSON-LD | `src/components/ui/Seo.tsx`, `src/lib/seo.ts` |

Data comes only from `src/data/*.json` (read-only, see `DATA_DICTIONARY.md`). University names are never shown.

## Run it locally

```powershell
npm install
npm run dev        # http://localhost:5173 (shows draft content with amber "Draft" badges)
npm run build      # type-check, client build, server build, prerender -> dist/
npm run preview    # serve dist/ at http://localhost:4173
```

`npm run build` writes one HTML file per route (116 pages) plus `sitemap.xml`, so search engines and WhatsApp /
Facebook link previews see real content and tags. The browser then hydrates the same markup.

## Deploy to Hostinger

1. Back up the old site in `public_html`.
2. Run `npm run build` and upload **the contents of `dist/`** (including `.htaccess`) to `public_html`.

`public/.htaccess` forces `https://www.`, serves clean URLs from the prerendered `.html` files, returns a real 404
page, 301-redirects the old PHP URLs (`about.php`, `blog-post.php?slug=…`), and sets caching and security headers.

Optional environment variables (create `.env` before building):

```
VITE_GA4_ID=G-XXXXXXX          # Google Analytics 4, loads only after the visitor accepts cookies
VITE_FORM_ENDPOINT=https://…   # contact form POST target (JSON). Without it the form opens WhatsApp pre-filled.
```

## Before going live (client approvals)

Hidden in production until confirmed (they render only in `npm run dev`, marked "Draft"):
- [ ] Marketing stats (1200+ students, 80+ universities, 500+ scholarships, 7+ years): what do they count?
- [ ] 5 draft FAQs (marks needed, MBBS & PM&DC, Chinese required, total costs, hostels); check PM&DC wording.
- [ ] Testimonial from Instagram: written permission from the student.
- [ ] Full Lahore office address and whether there is a China office.

Also:
- [ ] Have the Privacy Policy, Terms and Cookie Policy reviewed by a professional (`src/pages/legal/*`).
- [ ] `site.json` blog seed for "top-10-chinese-universities…" still contains university names in its second
      paragraph. The site never shows it, but it ships inside the data bundle; remove it in `data-pipeline/build_site_data.py`.
- [ ] Logo: ask for the SVG master (original in a Canva Education workspace, design `DAHNTCmo-8Q`).
- [ ] Companies House: the confirmation statement is overdue (was due 31 Aug 2026).
- [ ] Fresh brochures for the 2027 intakes (all programme data is from 2024-2025).

## Updating the data

The JSON files are generated from the research repository (`data-pipeline/` scripts) from the brochures and the
keyword research. To update: regenerate, copy the JSON into `src/data/`, run `npm run typecheck`, then `npm run build`.
Blog figures, counts, tool constants and the sitemap all recalculate from the data automatically.
