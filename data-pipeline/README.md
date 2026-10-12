# data-pipeline — regenerate the website data

Turns the research files in this folder's parent into the JSON used by `iffi-consultant/src/data/`.
Run from this folder with Python 3.11+ (standard library only). On Windows use `py -3 -X utf8` so the QA
report can print Chinese province names.

```powershell
python parse_programs.py                                   # Extracted_Features_All_Programs.txt -> programs.json + provinces.json
python simplify_geo.py inputs/china_full.json ../iffi-consultant/src/data/provinces.json ../iffi-consultant/src/data/china-provinces.geo.json
python build_site_data.py                                  # -> site.json, tools.json, meta.json
python build_seo_keywords.py                               # both keyword CSVs -> seo-keywords.json (meta keywords per page)
cd ../iffi-consultant; npm run typecheck                    # validates the JSON against src/types/data.ts
```

| Script | Reads | Writes |
|---|---|---|
| `parse_programs.py` | `../Extracted_Features_All_Programs.txt` | `programs.json`, `provinces.json` (prints a QA report) |
| `simplify_geo.py` | `inputs/china_full.json` (DataV GeoAtlas), `provinces.json` | `china-provinces.geo.json` (simplified, English names, programme counts) |
| `build_site_data.py` | `programs.json`, `provinces.json`, `inputs/fx_cny.json`, `../Gujjify_Keyword_Research_Global.csv`, `inputs/old-site-posts/*.html` | `site.json`, `tools.json`, `meta.json` |
| `build_seo_keywords.py` | both keyword CSVs, `tools.json`, `provinces.json` | `seo-keywords.json` (top 10 per route + per level; prints demand with no page yet) |
| `fee_stats.py` | `programs.json` | prints fee / stipend / requirement statistics |
| `kw_deep.py` | both keyword CSVs | prints tool demand by region and local-language seeds |

Notes
- When new brochures arrive: update `Extracted_Features_All_Programs.txt` (same block format), re-run, check the
  QA report (`missing location`, `no majors`), then commit; Vercel redeploys the site.
- Curated per-programme facts (language minimums, stipends, age limits, 2025 deadlines, overrides) live in
  dictionaries near the top of `parse_programs.py` — they mirror SECTION 11 of the programmes file.
- `inputs/fx_cny.json` is the offline fallback for exchange rates (2026-10-06); the website fetches live rates.
- Site copy (services, FAQ, legal, SEO, WhatsApp messages) is authored inside `build_site_data.py`. Brand and
  domain are the `BRAND` / `SITE_URL` constants at the top; unconfirmed contacts and legal fields are `None`.
- Keyword ranking: `score_keyword()` in `build_seo_keywords.py` decides the order (market coverage, Pakistan
  autocomplete, length). Tune it, re-run, then `npm run build && npm run seo:audit` in the website folder.
- University names must never be added back to the data.
