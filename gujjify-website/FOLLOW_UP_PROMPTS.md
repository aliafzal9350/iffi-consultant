# Follow-up prompts for AI Studio

Use these after the MASTER_PROMPT run. Send one at a time and check the preview in between.
Each prompt is written to keep the rules from MASTER_PROMPT.md in force.

---

## 1. Continue an unfinished build
```
Continue implementing MASTER_PROMPT.md from the next unfinished phase. First list which phases and
definition-of-done items are complete, then build the next phase completely. Keep all non-negotiable rules.
```

## 2. Hero map polish (if the 3D map looks flat, cluttered or slow)
```
Polish the hero ChinaMap3D to a premium standard:
- programme provinces: gold physical material with visible depth (1.0 + programCount x 0.18), crisp gold edge lines,
  subtle bevel; other provinces: dark navy, low, matte;
- 30 city beacons with thin additive light beams and staggered pulse rings; province-wide programmes as hollow rings;
- calm camera: ~55 degree tilt framed on eastern China, slow breathing sway, gentle pointer parallax, no scroll zoom;
- auto-tour through provinces by programme count every 4 s with the info card; pause on interaction;
- keep 60 fps: memoised geometry, DPR max 1.75, frameloop "demand" when idle, pause when off-screen;
- the SVG ChinaMap2D poster must match the 3D colours and show instantly while 3D loads.
Do not change any data.
```

## 3. Mobile pass
```
Do a mobile-first review at 360 x 740 and 390 x 844: header + menu sheet, hero (copy first, 440 px map card,
tap to select provinces, no auto-tour), finder bottom-sheet filters, sticky CTAs, tool steppers, tables
(convert to stacked cards), 44 px touch targets, no horizontal scroll. Fix everything you find.
```

## 4. Data-integrity audit (run before publishing)
```
Audit the whole codebase against the data rules in MASTER_PROMPT.md section 2:
1) search for any university names, invented statistics, testimonials, fees, deadlines or rankings that do not
   come from src/data; 2) confirm every programme number is read from programs.json; 3) confirm the
   data-freshness, university-names, cost, eligibility and MBBS disclaimers render where required;
4) confirm deadline2025 is never shown as a date; 5) confirm draft FAQs, marketing stats, the testimonial and
unverified offices are hidden in production. Report findings as a table, then fix them.
```

## 5. Accessibility & SEO audit
```
Audit for WCAG 2.2 AA and SEO: one H1 per page, heading order, colour contrast (no small gold text on light
backgrounds), focus visible, keyboard paths through the map list view, finder, compare tray, drawers and both
tools, aria-live on tool results, form labels/errors, alt text; per-route titles/descriptions/canonicals, Open
Graph tags, Organization + ProfessionalService + FAQPage + BreadcrumbList JSON-LD, sitemap routes match the router.
Fix everything and summarise the changes.
```

## 6. Performance pass
```
Optimise performance: route-level code splitting, lazy-load the 3D map chunk after first paint, avoid layout
shift in the hero, memoise filter results, debounce search, cache exchange rates for 12 h, and make sure the
initial JS (excluding the 3D chunk) is under 200 KB gzip. Report bundle sizes before and after.
```

## 7. (Optional) Roman-Urdu touches for the Pakistani audience
```
Add a small EN / Roman-Urdu toggle that changes only the hero subheadline, the main CTAs and the WhatsApp
pre-filled messages (keep the rest English). Write natural Roman Urdu like the brand's Instagram captions,
e.g. "China mein scholarship ke sath admission - free consultation". Store strings in a dictionary file.
```

## 8. (Optional) "Ask IFFI Global" AI assistant — only if the client wants it
```
Add an "Ask IFFI Global" chat drawer powered by the Gemini API through a server-side function (never expose the key
in the browser). Ground every answer ONLY in src/data (programmes, provinces, site FAQ, tools constants); if the
answer is not in the data, say so and offer WhatsApp. Never name universities, never promise admission or
scholarships, always add the data-freshness note to programme answers, and end with a "Continue on WhatsApp"
button that pre-fills the conversation summary. Rate-limit and show a privacy notice.
```

## 9. Deploy to Hostinger (static) — run locally, not in AI Studio
```
npm install
npm run build
# upload the contents of dist/ (including .htaccess) to public_html on Hostinger
```
`public/.htaccess` already handles https + www, SPA routing and 301 redirects from the old PHP URLs.
