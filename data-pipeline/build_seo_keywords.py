"""Rank the keyword research per page and write src/data/seo-keywords.json (used for <meta name="keywords">).

Reads both keyword CSVs (Google autocomplete, 2026-10-05):
  Gujjify_Keyword_Research_Global.csv        10,325 rows - keyword x market (38 markets)
  Gujjify_Keyword_Research_Autocomplete.csv   1,843 rows - Pakistan-focused autocomplete

Each research "tool / page" bucket is mapped to a site route; buckets without a page yet are printed as gaps.
Meta keywords do not move Google rankings - the same ranked list is what titles, H1s and copy should target
(iffi-consultant/scripts/seo-audit.mjs checks that).
"""
import csv, collections, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
KIT_DATA = ROOT / 'iffi-consultant' / 'src' / 'data'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else KIT_DATA / 'seo-keywords.json'
PER_PAGE = 10
BRAND = ["IFFI Consultant", "IFFI Consultant study in China", "IFFI consultants"]

glob = list(csv.DictReader(open(ROOT / "Gujjify_Keyword_Research_Global.csv", encoding="utf-8-sig")))
auto = list(csv.DictReader(open(ROOT / "Gujjify_Keyword_Research_Autocomplete.csv", encoding="utf-8-sig")))
tools = json.load(open(KIT_DATA / "tools.json", encoding="utf-8"))
provinces = json.load(open(KIT_DATA / "provinces.json", encoding="utf-8"))

# research bucket -> site route (both CSVs use slightly different labels)
BUCKET_ROUTE = {
    "Cost calculator": "/tools/cost-calculator", "Cost calculator (PKR)": "/tools/cost-calculator",
    "University finder / agency no.": "/programmes", "University & scholarship finder": "/programmes",
    "Eligibility checker": "/tools/eligibility-checker",
    "Visa guide": "/services", "Attestation & visa guide": "/services",
    "Documents & forms": "/services", "Document checklist & forms": "/services",
    "Study plan & letters": "/services", "Study plan / letter templates": "/services",
    "Deadline tracker": "/faq",
    "MBBS comparison": "level:MBBS",
    "": "/",
}
NO_PAGE_YET = {"HSK tools", "CGPA / grade converter", "CGPA/percentage converter", "Deadline tracker",
               "MBBS comparison", "Study plan & letters", "Study plan / letter templates", "Documents & forms",
               "Document checklist & forms"}

# --- filters ------------------------------------------------------------------------------------------
# other markets' country names: the site targets Pakistan first, so "pakistan(i)" stays allowed
countries = {c["country"].lower() for c in tools["currency"]["currencies"]} - {"pakistan", "china"}
DEMONYMS = {"indian", "nepali", "nepalese", "bangladeshi", "nigerian", "ghanaian", "kenyan", "indonesian",
            "vietnamese", "filipino", "egyptian", "sri lankan", "afghan", "uzbek", "kazakh", "ethiopian",
            "cameroonian", "zambian", "tanzanian", "ugandan", "moroccan", "algerian", "sudanese", "somali",
            "malaysian", "thai", "turkish", "iranian", "iraqi", "yemeni", "arab", "african", "us", "uk", "usa",
            # markets that appear in autocomplete suffixes but are not in the currency list
            "grenada", "south africa", "jamaica", "trinidad", "zimbabwe", "malawi", "rwanda", "mali", "senegal",
            "ivory coast", "liberia", "sierra leone", "gambia", "sudan", "somalia", "yemen", "jordan", "syria",
            "lebanon", "palestine", "iraq", "iran", "afghanistan", "tajikistan", "kyrgyzstan", "turkmenistan",
            "mongolia", "russia", "ukraine", "myanmar", "cambodia", "laos", "philippines", "mauritius", "madagascar",
            "mozambique", "angola", "namibia", "botswana", "benin", "togo", "niger", "chad", "burkina faso", "guinea",
            "congo", "gabon", "haiti", "fiji", "maldives", "bhutan", "oman", "qatar", "kuwait", "bahrain", "saudi",
            "uae", "dubai", "canada", "australia", "germany", "france", "italy", "spain", "brazil", "mexico",
            "japan", "korea", "singapore", "india", "nepal", "bangladesh", "nigeria", "ghana", "kenya", "egypt"}
COUNTRY_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, countries | DEMONYMS), key=len, reverse=True)) + r")\b")
# never surface university names (data rule) - "<city> university", "<city> medical university", famous names
places = {p["name"].lower() for p in provinces} | {c["name"].lower() for p in provinces for c in p["cities"]}
UNI_RE = re.compile(
    r"\b(" + "|".join(map(re.escape, sorted(places))) + r")\s+(medical |normal |agricultural |jiaotong |polytechnic )?university\b"
    r"|\b(tsinghua|peking|fudan|tongji|nankai|xiamen|beihang|renmin|jiao ?tong|sun yat|hust|ustc|china medical university)\b"
)
OLD_YEAR_RE = re.compile(r"\b20(1\d|2[0-5])\b")
ASCII_RE = re.compile(r"^[a-z0-9 .,&'/+-]+$")
# other agencies, social sites and non-buying intent
NOISE_RE = re.compile(r"\b(reddit|quora|youtube|wikipedia|malishaedu|photos?|whatsapp group|webinar|meaning|name|history|vocab|official)\b")


def clean(k: str) -> str:
    return re.sub(r"\s+", " ", k.strip().lower())


def allowed(k: str) -> bool:
    words = k.split()
    return (2 <= len(words) <= 7 and ASCII_RE.match(k) and not COUNTRY_RE.search(k)
            and not UNI_RE.search(k) and not OLD_YEAR_RE.search(k) and not NOISE_RE.search(k))


# --- evidence per keyword -----------------------------------------------------------------------------
markets = collections.defaultdict(set)      # keyword -> markets it autocompletes in (global file)
buckets = collections.defaultdict(collections.Counter)
for r in glob:
    if r["source"] != "autocomplete en":
        continue
    k = clean(r["keyword"])
    markets[k].add(r["market"])
    buckets[k][r["maps_to_tool"]] += 1
pk_auto = set()
for r in auto:
    k = clean(r["keyword"])
    pk_auto.add(k)
    buckets[k][r["maps_to_tool_or_page"]] += 1


def score_keyword(keyword: str, market_count: int, in_pk_autocomplete: bool) -> float:
    """How strongly a keyword should represent its page. Higher = listed first.

    market_count       - in how many of the 38 markets Google autocompletes it (0-38): global, durable demand
    in_pk_autocomplete - it also appears in the Pakistan-focused autocomplete file: the core market
    len(keyword.split()) - longer = more specific (converts better) but fewer searches

    TODO(you): this baseline treats every market equally and gives Pakistan a flat bonus. Tune it to the
    client's priorities - e.g. weight Pakistan higher if most leads come from there, or reward 3-5 word
    long-tail phrases that a new domain can actually rank for.
    """
    words = len(keyword.split())
    return market_count + (6 if in_pk_autocomplete else 0) - max(0, words - 5) * 1.5


def norm(k: str) -> frozenset:
    stop = {"for", "in", "the", "of", "to", "a", "and", "with", "students", "student"}
    return frozenset(w.rstrip("s") for w in k.split() if w not in stop)


def top(cands: list[str], n: int = PER_PAGE) -> list[str]:
    ranked = sorted(set(cands), key=lambda k: (-score_keyword(k, len(markets.get(k, ())), k in pk_auto), k))
    out, seen, prefixes = [], set(), collections.Counter()
    for k in ranked:
        key, pre = norm(k), " ".join(k.split()[:2])
        if key in seen or prefixes[pre] >= 3:
            continue
        seen.add(key)
        prefixes[pre] += 1
        out.append(k)
        if len(out) == n:
            break
    return out


keywords = [k for k in buckets if allowed(k)]
by_route = collections.defaultdict(list)
for k in keywords:
    bucket = buckets[k].most_common(1)[0][0]
    route = BUCKET_ROUTE.get(bucket)
    if route:
        by_route[route].append(k)

routes = {r: top(ks) for r, ks in by_route.items() if not r.startswith("level:")}
general = by_route["/"]
routes["/tools"] = top(routes["/tools/cost-calculator"][:4] + routes["/tools/eligibility-checker"][:3] + routes["/programmes"][:3])
routes["/about"] = top([k for k in keywords if re.search(r"consultan|counsel|study in china (from |for )?pakistan|how to study in china", k)], 6)
routes["/contact"] = routes["/about"][:5]
routes["/blog"] = top([k for k in general if re.search(r"how|guide|requirement|process|step|apply|tips", k)])

levels = {
    "MBBS": top(by_route["level:MBBS"] + [k for k in keywords if re.search(r"\b(mbbs|medicine|medical)\b", k)]),
    "Bachelor": top([k for k in keywords if re.search(r"\b(bachelor|undergraduate|bs)\b", k)]),
    "Master": top([k for k in keywords if re.search(r"\b(master|masters|ms|mba|postgraduate)\b", k)]),
    "PhD": top([k for k in keywords if re.search(r"\b(phd|doctoral|doctorate)\b", k)]),
    "Language": top([k for k in keywords if re.search(r"\b(chinese language|language course|hsk|learn chinese)\b", k)]),
}

data = {
    "generated": "2026-10-05 keyword research",
    "note": "Built by data-pipeline/build_seo_keywords.py - do not edit by hand.",
    "brand": BRAND,
    "routes": dict(sorted(routes.items())),
    "levels": levels,
}
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

print(f"wrote {OUT} ({OUT.stat().st_size} bytes) from {len(keywords)} usable keywords")
for r, ks in data["routes"].items():
    print(f"  {r:<28} {', '.join(ks[:4])}")
gap = collections.Counter()
for k, c in buckets.items():
    for b, n in c.items():
        if b in NO_PAGE_YET:
            gap[b] += n
print("demand with no dedicated page yet:", ", ".join(f"{b} {n}" for b, n in gap.most_common()))
