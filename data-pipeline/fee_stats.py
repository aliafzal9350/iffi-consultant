"""Most common fixed fees across the 72 programmes (feeds the cost calculator defaults)."""
import json, re, collections, statistics
from pathlib import Path

ps = json.load(open(Path(__file__).resolve().parent.parent / "iffi-consultant/src/data/programs.json", encoding="utf-8"))
PAT = {
    "insurance": r"insurance[^:]*:\s*([\d,]{3,5})",
    "residencePermit": r"(?:residen(?:ce|t) permit|visa extension)[^:]*:\s*([\d,]{3,5})",
    "medicalCheck": r"(?:medical|health check)[^:]*:\s*(?:around |approx\.? )?([\d,]{3,5})",
    "registration": r"registration[^:]*:\s*([\d,]{3,5})",
    "applicationFee": r"application fees?[^:]*:\s*([\d,]{3,5})",
}
vals = collections.defaultdict(list)
for p in ps:
    seen = set()
    for t in p["costItems"]:
        for k, pat in PAT.items():
            m = re.search(pat, t, re.I)
            if m and k not in seen:
                vals[k].append(int(m.group(1).replace(",", "")))
                seen.add(k)
for k, v in vals.items():
    c = collections.Counter(v)
    print(f"{k:<16} n={len(v):>2}  mode={c.most_common(1)[0][0]:>5}  median={statistics.median(v):>6}  "
          f"range={min(v)}-{max(v)}  top={c.most_common(4)}")

# stipends & fully funded
st = [p["stipendCNYPerMonth"] for p in ps if p["stipendCNYPerMonth"]]
print("stipend programmes:", len(st), "median", statistics.median(st), "max", max(st))
print("tuitionMin==0 (some scholarship makes tuition free):", sum(p["tuitionMinCNYPerYear"] == 0 for p in ps))
std = [p["tuitionStandardCNYPerYear"] or p["tuitionMaxListedCNYPerYear"] for p in ps
       if (p["tuitionStandardCNYPerYear"] or p["tuitionMaxListedCNYPerYear"]) and p["level"] == "Bachelor"]
print("Bachelor tuition listed: n", len(std), "median", statistics.median(std), "range", min(std), max(std))
mb = [p["tuitionStandardCNYPerYear"] for p in ps if p["level"] == "MBBS"]
print("MBBS tuition: median", statistics.median(mb), "range", min(mb), max(mb))
ages = [p["ageLimit"] for p in ps if p["ageLimit"]]
print("age limits:", ages)
print("bank statement:", collections.Counter(p["bankStatementUSD"] for p in ps))
print("language policy types:", collections.Counter(p["languagePolicy"]["type"] for p in ps))
print("teaching languages:", collections.Counter(tuple(p["teachingLanguages"] or ["not stated"]) for p in ps))
print("ranking provided:", sum(bool(p["ranking"]) for p in ps), "| top-50 China:",
      [(p["id"], p["city"], p["ranking"]["china"]) for p in ps if p["ranking"] and p["ranking"].get("china", 999) <= 50])
print("deadline months:", collections.Counter(p["deadline2025"][5:7] for p in ps if p["deadline2025"]))
print("intro video:", sum(p["introVideoRequired"] for p in ps), "| interview stated:", sum(bool(p["interview"]) for p in ps))
