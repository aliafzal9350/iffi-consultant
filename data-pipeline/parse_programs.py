"""Parse Extracted_Features_All_Programs.txt into structured JSON for the website.

Outputs (to OUT_DIR): programs.json, provinces.json, majors.json + prints a QA report.
University names were removed from the source on purpose - never add them back.
"""
import re, json, os, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent  # research folder
KIT_DATA = ROOT / 'gujjify-website' / 'src' / 'data'

SRC = ROOT / "Extracted_Features_All_Programs.txt"
OUT_DIR = os.environ.get("OUT_DIR", str(KIT_DATA))
lines = open(SRC, encoding="utf-8").read().split("\n")

MARKER = re.compile(r"\s*\[(?:CHECK|ADDED|IMG|AGENCY|DERIVED)[^\]]*\]")


def clean(s):
    s = MARKER.sub("", s)
    s = re.sub(r"(\d)\s?NY\b", r"\1 CNY", s)            # "26000NY" -> "26000 CNY"
    s = re.sub(r"\bTOF+E+L\b", "TOEFL", s, flags=re.I)  # TOFFEL / TOFEL
    s = s.replace("The belt and Initiative Scholarship", "Belt and Road Scholarship")
    s = s.replace("[University]", "the university")
    return re.sub(r"\s{2,}", " ", s).strip(" .;")


# ---------------------------------------------------------------- geography
PROVINCES = {  # name: (adcode, chinese, capital, lat, lng, type)
    "Beijing": (110000, "北京", "Beijing", 39.9042, 116.4074, "Municipality"),
    "Tianjin": (120000, "天津", "Tianjin", 39.0842, 117.2009, "Municipality"),
    "Hebei": (130000, "河北", "Shijiazhuang", 38.0428, 114.5149, "Province"),
    "Liaoning": (210000, "辽宁", "Shenyang", 41.8057, 123.4315, "Province"),
    "Heilongjiang": (230000, "黑龙江", "Harbin", 45.8038, 126.5349, "Province"),
    "Shanghai": (310000, "上海", "Shanghai", 31.2304, 121.4737, "Municipality"),
    "Jiangsu": (320000, "江苏", "Nanjing", 32.0603, 118.7969, "Province"),
    "Zhejiang": (330000, "浙江", "Hangzhou", 30.2741, 120.1551, "Province"),
    "Anhui": (340000, "安徽", "Hefei", 31.8206, 117.2272, "Province"),
    "Fujian": (350000, "福建", "Fuzhou", 26.0745, 119.2965, "Province"),
    "Jiangxi": (360000, "江西", "Nanchang", 28.6820, 115.8579, "Province"),
    "Shandong": (370000, "山东", "Jinan", 36.6512, 117.1201, "Province"),
    "Henan": (410000, "河南", "Zhengzhou", 34.7466, 113.6253, "Province"),
    "Hubei": (420000, "湖北", "Wuhan", 30.5928, 114.3055, "Province"),
    "Hunan": (430000, "湖南", "Changsha", 28.2282, 112.9388, "Province"),
    "Guangdong": (440000, "广东", "Guangzhou", 23.1291, 113.2644, "Province"),
    "Guangxi": (450000, "广西", "Nanning", 22.8170, 108.3669, "Autonomous Region"),
    "Sichuan": (510000, "四川", "Chengdu", 30.5728, 104.0668, "Province"),
    "Yunnan": (530000, "云南", "Kunming", 25.0389, 102.7183, "Province"),
    "Shaanxi": (610000, "陕西", "Xi'an", 34.3416, 108.9398, "Province"),
    "Gansu": (620000, "甘肃", "Lanzhou", 36.0611, 103.8343, "Province"),
}
CITIES = {  # city: (province, lat, lng)  - approximate city-centre coordinates
    "Beijing": ("Beijing", 39.9042, 116.4074), "Changsha": ("Hunan", 28.2282, 112.9388),
    "Changzhou": ("Jiangsu", 31.8107, 119.9741), "Chengdu": ("Sichuan", 30.5728, 104.0668),
    "Dazhou": ("Sichuan", 31.2096, 107.4680), "Fuzhou": ("Fujian", 26.0745, 119.2965),
    "Ganzhou": ("Jiangxi", 25.8310, 114.9333), "Guangzhou": ("Guangdong", 23.1291, 113.2644),
    "Hangzhou": ("Zhejiang", 30.2741, 120.1551), "Harbin": ("Heilongjiang", 45.8038, 126.5349),
    "Jinhua": ("Zhejiang", 29.0790, 119.6474), "Kunming": ("Yunnan", 25.0389, 102.7183),
    "Nanchong": ("Sichuan", 30.8378, 106.1107), "Nanjing": ("Jiangsu", 32.0603, 118.7969),
    "Nanning": ("Guangxi", 22.8170, 108.3669), "Nantong": ("Jiangsu", 31.9802, 120.8943),
    "Neijiang": ("Sichuan", 29.5803, 105.0584), "Shanghai": ("Shanghai", 31.2304, 121.4737),
    "Shaoxing": ("Zhejiang", 29.9958, 120.5861), "Shenzhen": ("Guangdong", 22.5431, 114.0579),
    "Shijiazhuang": ("Hebei", 38.0428, 114.5149), "Tianjin": ("Tianjin", 39.0842, 117.2009),
    "Wenzhou": ("Zhejiang", 27.9938, 120.6994), "Wuhan": ("Hubei", 30.5928, 114.3055),
    "Xi'an": ("Shaanxi", 34.3416, 108.9398), "Xuzhou": ("Jiangsu", 34.2058, 117.2840),
    "Yangzhou": ("Jiangsu", 32.3936, 119.4127), "Zhenjiang": ("Jiangsu", 32.1878, 119.4250),
    "Zhengzhou": ("Henan", 34.7466, 113.6253), "Zibo": ("Shandong", 36.8131, 118.0548),
}

# ---------------------------------------------------------------- city index (SECTION 2)
loc = {}  # id -> (city or None, province)
start = lines.index("SECTION 2 - CITY INDEX")
for ln in lines[start:start + 60]:
    m = re.match(r"^  (\S.*?)\s{3,}((?:[BMPLA]{1,2}-\d+[, ]*)+.*)$", ln)
    if not m or ln.strip().startswith("City (Province)"):
        continue
    place, ids = m.group(1), m.group(2)
    pm = re.match(r"^(.*?) Province \(no city given\)$", place)
    if pm:
        city, prov = None, pm.group(1)
    else:
        name = re.sub(r"\s*\[[^\]]*\]", "", place)          # drop [ADDED]/[CHECK...]
        cm = re.match(r"^(.*?)\s*\((.*?)\)\s*$", name)
        city = cm.group(1) if cm else name.strip()
        prov = cm.group(2) if cm else city
        if prov == "near Beijing":
            prov = "Tianjin"
        if city == "Zhanjiang":                              # source typo, see [CHECK]
            city = "Zhenjiang"
    for pid in re.findall(r"[BMPLA]{1,2}-\d+", ids):
        loc[pid] = (city, prov)

# MBBS table (SECTION 4) is a table, not blocks
MBBS = [("M-01", "Nantong", 26000, "3000-4,000 CNY"), ("M-02", "Yangzhou", 30000, "4,000-6,000 CNY"),
        ("M-03", "Nanchong", 32000, "6,000 CNY"), ("M-04", "Wuhan", 40000, "6,000 CNY"),
        ("M-05", "Guangzhou", 40000, "6,000 CNY"), ("M-06", "Zhengzhou", 35000, "5500 CNY")]

# ---------------------------------------------------------------- program blocks
hdr = re.compile(r"^\[((?:B|P|MA|L)-\d+)\]\s+(.*)$")
idx = [i for i, l in enumerate(lines) if hdr.match(l)]
programs = []
for n, i in enumerate(idx):
    end = idx[n + 1] - 1 if n + 1 < len(idx) else len(lines)
    block = lines[i + 2:end]
    # stop at a section bar
    for j, l in enumerate(block):
        if l.startswith("=====") or l.startswith("SECTION "):
            block = block[:j]
            break
    pid = hdr.match(lines[i]).group(1)
    kv, sections, cur_key, cur_sec, parent = {}, collections.OrderedDict(), None, None, ""
    for l in block:
        if not l.strip() or set(l.strip()) == {"-"}:
            cur_key = None
            continue
        m = re.match(r"^  (\S.*?) \.{2,} ?(.*)$", l)
        if m:
            cur_key, cur_sec = m.group(1).strip(), None
            kv[cur_key] = m.group(2).strip()
            continue
        # section headings: ALL-CAPS at 2 spaces, or nested at 4 spaces (B-39 style),
        # or nested "Fees:" / "Rules:" sub-headings
        m = re.match(r"^(  |    )([A-Z0-9][A-Z0-9 /&,\-'():.+\"\[\]]{2,}.*|Fees:|Rules:)$", l)
        if m and re.match(r"^(?:\d+(?:ST|ND|RD|TH) )?[A-Z]{2,}", m.group(2)) or (m and m.group(2) in ("Fees:", "Rules:")):
            name = m.group(2).strip()
            if name.startswith("PROGRAM "):
                parent = name
            if name in ("Fees:", "Rules:"):          # nested under "PROGRAM n: ..."
                name = f"{parent} - {name[:-1].upper()}"
            cur_sec, cur_key = name, None
            sections[cur_sec] = []
            continue
        m = re.match(r"^\s{3,}(?:-|\d+\.)\s+(.*)$", l)
        if m and cur_sec:
            sections[cur_sec].append(m.group(1).strip())
            continue
        if l.startswith("      ") and cur_sec and sections[cur_sec]:
            sections[cur_sec][-1] += " " + l.strip()          # continuation of an item
        elif l.startswith("      ") and cur_key:
            kv[cur_key] += " " + l.strip()                     # continuation of a value

    city, prov = loc.get(pid, (None, None))
    level_raw = kv.get("Level", "")
    level = ("Master" if pid == "B-10" else "Bachelor") if pid.startswith("B") else \
        {"P": "PhD", "MA": "Master", "L": "Language"}[pid.split("-")[0]]

    majors, majors_lang = [], set()
    for sec, items in sections.items():
        if sec.startswith("MAJORS"):
            # table-style rows ("Civil Engineering    Type A    Free") -> first column only
            majors += [clean(re.split(r"\s{3,}", x)[0]) for x in items]
            for lang in ("ENGLISH", "CHINESE", "BILINGUAL"):
                if lang in sec:
                    majors_lang.add(lang.title())
    taught = kv.get("Taught in") or ""
    if taught:
        majors_lang |= {t.strip().title() for t in re.split(r"\bor\b|/|,", clean(taught)) if t.strip()}
    if pid.startswith("P"):
        majors_lang.add("English")
    docs = []
    for sec, items in sections.items():
        if sec.startswith(("DOCUMENTS", "REQUIRED DOCUMENTS")):
            docs += [clean(x) for x in items]
    schol = [clean(x) for s, it in sections.items() if s.startswith("SCHOLARSHIP") for x in it]
    fees = [clean(x) for s, it in sections.items() if "FEE" in s for x in it]
    other = {clean(s.title()): [clean(x) for x in it] for s, it in sections.items()
             if not s.startswith(("MAJORS", "DOCUMENTS", "REQUIRED DOCUMENTS", "SCHOLARSHIP")) and "FEE" not in s and it}

    rk = kv.get("Ranking", "")
    nums = re.findall(r"(?:Country|National)\s+Rank(?:ing)?\s+(\d+)|World\s+Rank(?:ing)?\s+([\d\-]+)", rk)
    ranking = {}
    for c, w in nums:
        if c:
            ranking["china"] = int(c)
        if w:
            ranking["world"] = w

    programs.append({
        "id": pid, "level": level, "levelDetail": clean(level_raw) or None,
        "city": city, "province": prov, "cityKnown": city is not None,
        "intake": clean(kv.get("Intake", "")) or None,
        "duration": clean(kv.get("Duration", "")) or None,
        "teachingLanguages": sorted(majors_lang) or None,
        "ranking": ranking or None,
        "status": clean(kv.get("Status", "")) or None,
        "majors": majors,
        "scholarships": schol, "fees": fees,
        "tuition": clean(kv.get("Tuition fee", "")) or None,
        "dorm": clean(kv.get("Dorm fee", "")) or None,
        "stipendText": clean(kv.get("Monthly stipend", "")) or None,
        "totalFee": clean(kv.get("Total fee", "")) or None,
        "languageRequirement": clean(kv.get("LANGUAGE", "")) or None,
        "interview": clean(kv.get("INTERVIEW", "")) or None,
        "deadlineText": clean(kv.get("DEADLINE", kv.get("Intake / deadline", ""))) or None,
        "documents": docs,
        "headline": clean(kv.get("Headline", "")) or None,
        "details": other,
        "_all": [(s, clean(x)) for s, it in sections.items() for x in it] +
                [("KV:" + k, clean(v)) for k, v in kv.items()],
    })

for mid, city, tuition, hostel in MBBS:
    programs.append({
        "id": mid, "level": "MBBS", "levelDetail": "MBBS (Bachelor of Medicine & Bachelor of Surgery)",
        "city": city, "province": CITIES[city][0], "cityKnown": True,
        "intake": "September 2025", "duration": "6 years (including internship)",
        "teachingLanguages": ["English"], "ranking": None, "status": None,
        "majors": ["MBBS (Clinical Medicine)"], "scholarships": [],
        "fees": [f"Tuition: {tuition:,} CNY/year", f"Hostel: {hostel}/year",
                 "Insurance: 800 CNY/year", "Registration: 400-500 CNY/year",
                 "Medical check-up: 400-450 CNY (1st year only)"],
        "tuition": f"{tuition:,} CNY/year", "dorm": f"{hostel}/year", "stipendText": None,
        "totalFee": None, "languageRequirement": "English-taught (no test stated)",
        "interview": None, "deadlineText": None,
        "documents": ["Passport", "Photo", "Grade 12 / A Level / High School certificate and transcript",
                      "Medical check-up report", "Non-criminal record", "Bank statement",
                      "Application form", "Extra-curricular activities (if applicable)"],
        "headline": None, "details": {"Recognition (as stated in source)": ["WHO listed"]},
        "tuitionCNYPerYear": tuition,
    })

# ---------------------------------------------------------------- curated facts (SECTION 11)
NO_IELTS = {"B-01", "B-05", "B-12", "B-14", "B-18", "B-21", "L-01"}
STIPEND = {**{f"P-0{i}": 3500 for i in range(1, 6)}, "B-10": 3000,
           **{f"MA-{i:02d}": 3000 for i in (1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 16)},
           "B-06": 2000, "B-03": 1800, "MA-17": 1700, "B-17": 1500, "MA-15": 1500, "B-05": 1400,
           "B-11": 1400, "MA-07": 1400, "B-04": 1000, "B-08": 1000, "B-21": 1000, "B-41": 800,
           "B-15": 500, "MA-12": 500, "B-43": 417}
TUITION_FREE = {"B-07": "all years", "B-18": "all years", "B-19": "all years", "B-21": "year 1",
                "B-34": "year 1", "B-35": "year 1", "B-43": "year 1"}
AGE = {"B-32": "17-25", "B-20": "18-22 (Type A) / 18-25 (Type B)", "B-22": "18-27", "B-10": "18-35",
       "B-17": "up to 30", "B-15": "below 45", "L-01": "no age limit"}
DEADLINE = {"B-39": "2025-02-28", "B-27": "2025-03-25", "B-13": "2025-04-30", "B-22": "2025-04-30",
            "B-08": "2025-05-01", "B-09": "2025-05-15", "B-10": "2025-05-15", "B-17": "2025-05-15",
            "B-14": "2025-05-20", **{k: "2025-05-30" for k in ("B-01", "B-03", "B-05", "B-24", "B-32", "B-34")},
            "B-15": "2025-05-31", "B-04": "2025-06-10", "B-06": "2025-06-10", "B-30": "2025-06-10",
            "B-07": "2025-06-15", "B-18": "2025-06-15", "B-35": "2025-06-15",
            **{k: "2025-06-30" for k in ("B-11", "B-12", "B-33", "B-36", "B-38")},
            "B-16": "2025-07-10", "B-29": "2025-07-10", "B-37": "2025-07-15",
            "B-20": "2025-07-30", "B-25": "2025-07-30", "B-42": "2025-07-30", "B-31": "2025-08-10",
            "B-26": "2025-08-15", "B-41": "2025-08-15", "B-40": "2025-08-20", "B-43": "2025-08",
            "B-28": "2025-09-15"}
BANK_5000 = {"B-13", "B-16", "B-26", "B-27", "B-28", "B-29", "B-30", "B-31", "B-34", "B-35", "B-36",
             "B-37", "B-38", "B-40", "B-42", "B-39", "MA-02", "MA-03", "MA-11"}
VIDEO = {"B-04", "B-10", "B-15", "B-19", "B-21", "B-23", "B-33", "L-01"}

TUI = re.compile(r"(original |full |implied full |normal )?tuition(?: fees?)?(?: after scholarship)?(?: is)?"
                 r"(?: \([^)]*\))?\s*:?\s*~?\s*([\d,]{3,7})(?:\s*-\s*([\d,]{3,7}))?\s*(?:CNY|RMB|yuan)?\b"
                 r"[^/;]*?(?:/|per)\s*(year|semester)", re.I)
# number-first form: "student pays 5500 CNY/Year tuition"
TUI2 = re.compile(r"([\d,]{3,7})\s*(?:CNY|RMB|yuan)\s*/\s*(year)\s+tuition", re.I)
# value-only rows inside a tuition/fee table section: "Liberal arts programs: 16,000 CNY/Year"
TUI3 = re.compile(r"([\d,]{4,7})\s*(?:CNY|RMB|yuan)?\s*/\s*(year)", re.I)
COMBINED = re.compile(r"tuition \+ accommodation combined:\s*([\d,]{3,7})", re.I)
FREE = re.compile(r"tuition(?: fees?)?\s*:\s*(?:full )?free|tuition(?: fees?)? free|\bfree tuition", re.I)


def lp(type="english-test", **kw):
    return {"type": type, **kw}


ANY_EN = "IELTS / TOEFL / Duolingo or any other English certificate"
LANG = {  # SECTION 11.1 + 11.2 of the programs file (curated by the analyst, by program ID)
    "B-02": lp(ielts=5.5, toefl=68), "B-03": lp(ielts=6.0, toefl=75, note="or equivalent proof of proficiency"),
    "B-06": lp(ielts=6.0, toefl=80, hsk=4, hskScore=180,
               note="IELTS 6.0 / TOEFL 80 preferred; HSK-4 (180+) for the Chinese-taught track"),
    "B-10": lp(ielts=6.0, toefl=80, note="HSK-3 needed to graduate"),
    "B-11": lp(ielts=6.0, duolingo=100), "B-15": lp(ielts=6.0, toefl=69, note="a 3-minute video can replace IELTS"),
    "B-17": lp(ielts=6.0, toefl=80, sat=1150, pte=55, duolingo=115, note="or Cambridge English B"),
    "B-19": lp(duolingo=95), "B-08": lp("any-english", note=ANY_EN), "B-16": lp("any-english", note=ANY_EN),
    "B-32": lp("hsk", hsk=4, hskScore=180), "B-25": lp("hsk", hsk=4, note="HSK-4 / HSK-5 for the scholarship"),
    "B-09": lp("internal-test", note="University online entrance exam / internal English test"),
    "B-18": lp("internal-test", note="No IELTS - internal English test"),
    **{k: lp(ielts=6.0, toefl=80) for k in ("MA-02", "MA-07", "MA-10", "MA-11")},
    "MA-17": lp(ielts=6.0, toefl=80, note="or any valid English certificate"),
    "MA-05": lp(ielts=6.0, toefl=60), "MA-12": lp(ielts=5.5, toefl=70, note="or any English certificate"),
    "MA-15": lp("unspecified", note="Language certificate required (test not specified)"),
    "MA-16": lp("unspecified", note="Language certificate required (test not specified)"),
    **{k: lp("hsk", hsk=5) for k in ("MA-01", "MA-04", "MA-06")},
    "MA-14": lp("hsk", hsk=5, hskScore=180), "MA-03": lp("hsk", hsk=5, note="plus HSKK intermediate (60)"),
    "MA-08": lp("hsk", hsk=4), "MA-13": lp("hsk", hsk=4), "MA-09": lp("hsk", hsk=4, hskScore=200),
    **{f"P-0{i}": lp("unspecified", note="English proficiency proof required (test not specified)")
       for i in range(1, 6)},
    "L-01": lp("none", note="No language test required"),
}

FIELDS = [  # (field, include pattern, exclude pattern) - first match wins
    ("Medicine & Health", r"mbbs|medic|clinical|nursing|pharm|public health|stomatolog|dentist|"
                          r"chinese medicine|biomedical|health|surgery|anesthes|rehabilitat|"
                          r"medical imaging|traditional chinese|anatom|dermatolog|immunolog|neurolog|"
                          r"oncolog|ophthalm|orthop|otolaryng|otorhino|paediat|pediat|patholog|"
                          r"physiolog|psychiat|radiat|radiograph|acupunct|histolog|embryolog|venere", r"^$"),
    ("Computer Science & AI", r"computer|software|artificial intelligence|\bai\b|data science|big data|"
                              r"cyber|information security|internet of things|network engineering|"
                              r"digital media technology|intelligent science|pattern recognition|"
                              r"intelligent system", r"^$"),
    ("Business & Economics", r"business|manag|econom|trade|financ|accounting|marketing|\bmba\b|"
                             r"commerce|logistics|tourism|hotel|hospitality|audit", r"^$"),
    ("Law & Social Sciences", r"\blaw\b|legal|politic|international relations|public administration|"
                              r"sociolog|psycholog|social work|diploma|marxis|\bmpa\b", r"^$"),
    ("Languages, Education & Humanities", r"language|chinese|english|literature|linguist|educat|teaching|"
                                          r"history|philosoph|translat|journalism|chinese international",
     r"engineering"),
    ("Arts, Design, Media & Sports", r"design|\bart\b|arts|music|media|film|animation|fashion|broadcast|"
                                     r"sport|dance|public relation", r"engineering"),
    ("Agriculture, Food & Environment", r"agricult|agronom|horticult|food|crop|animal|veterinar|forest|"
                                        r"plant|soil|aquacult|fisher|ecolog|environment|water resource|tea\b|"
                                        r"rural|agrost", r"^$"),
    ("Science & Mathematics", r"math|physic|chemi|biolog|biotech|geolog|statist|geograph|ocean|astronom|"
                              r"science|zoolog", r"engineering"),
    ("Engineering & Technology", r"engineer|mechan|electric|civil|automat|robot|material|petroleum|power|"
                                 r"energy|electron|communication|telecom|manufactur|vehicle|aero|architect|"
                                 r"textile|mining|hydraul|bridge|transport|survey|construct|instrument|"
                                 r"technolog|structur|geotechn|signal|control|circuit|thermal|refrigerat|"
                                 r"packag|optic|metallurg|naval|ship|safety|weld|machin|planning|"
                                 r"water supply|drainage", r"^$"),
]


def field_of(major):
    m = major.lower()
    for name, inc, exc in FIELDS:
        if re.search(inc, m) and not re.search(exc, m):
            return name
    return "Other"

for p in programs:
    pid = p["id"]
    p["noIeltsRequired"] = pid in NO_IELTS
    p["stipendCNYPerMonth"] = STIPEND.get(pid)
    if pid.startswith(("P-", "MA-")):
        p["tuitionFree"] = "all years (scholarship)"
    else:
        p["tuitionFree"] = TUITION_FREE.get(pid)
    p["fullyFunded"] = pid.startswith(("P-", "MA-")) or pid == "B-10"
    p["ageLimit"] = AGE.get(pid)
    p["deadline2025"] = DEADLINE.get(pid)
    p["bankStatementUSD"] = 5000 if pid in BANK_5000 else (3000 if pid in ("B-20", "B-25") else
                                                           2500 if pid in ("B-32", "L-01") else None)
    p["introVideoRequired"] = pid in VIDEO
    if pid == "L-01":
        p["majors"] = ["Chinese Language (Mandarin) - 6-month non-degree course"]
        p["teachingLanguages"] = ["Chinese"]
    langs = p["teachingLanguages"] or []
    p["chineseTaught"] = "Chinese" in langs

    # ---- tuition: every "tuition ... <n>[-<m>] CNY/RMB/yuan ... /year|semester" mention
    std, payable, sem, free, combined, implied = [], [], [], False, None, []
    all_items = p.pop("_all", [])
    COST = re.compile(r"tuition|accommodation|dorm|hostel|insurance|registration|medical|health check|visa|"
                      r"residen|application fee|textbook|bedding|deposit|book", re.I)
    p["costItems"] = list(dict.fromkeys(
        (t + " (estimated)" if t.lower().startswith("implied full tuition") else t)
        for s, t in all_items if COST.search(t) and re.search(r"\d", t)
        and (not s.startswith("KV:") or re.search(r"Tuition fee|Dorm fee|Total fee|DEPOSIT", s))))
    for sec, txt in all_items:
        if txt.lower().startswith("implied full tuition"):
            m = re.search(r"([\d,]{4,7})", txt)
            if m:
                implied.append(int(m.group(1).replace(",", "")))
            continue
        is_std_ctx = bool(re.search(r"ORIGINAL|STANDARD|NORMAL", sec))
        hits = 0
        for m in TUI.finditer(txt):
            hits += 1
            lo = int(m.group(2).replace(",", ""))
            hi = int((m.group(3) or m.group(2)).replace(",", ""))
            if m.group(4).lower() == "semester":
                sem.append(lo)
                continue
            if lo < 1000:                                    # e.g. "Tuition fee: 3 years" noise
                continue
            (std if (m.group(1) or is_std_ctx) else payable).extend([lo, hi])
        for m in TUI2.finditer(txt):
            hits += 1
            payable.append(int(m.group(1).replace(",", "")))
        if not hits and re.search(r"TUITION", sec) and not re.search(r"accommodation|insurance|fee", txt, re.I):
            for m in TUI3.finditer(txt):                     # "Liberal arts programs: 16,000 CNY/Year"
                (std if is_std_ctx else payable).append(int(m.group(1).replace(",", "")))
        if not hits and "STANDARD FEES" in sec and re.match(r"tuition", txt, re.I):
            for m in TUI3.finditer(txt):                     # "Tuition fees (Bachelor Degree)  22000/Year"
                std.append(int(m.group(1).replace(",", "")))
        cm = COMBINED.search(txt)
        if cm:
            combined = int(cm.group(1).replace(",", ""))
        if FREE.search(txt):
            free = True
    if "tuitionCNYPerYear" in p:                              # MBBS table value
        std = [p["tuitionCNYPerYear"]]
    if not (std or payable) and sem and pid != "B-39":         # B-23: 3750/semester = 7500/year
        payable = [2 * min(sem)]
    p["tuitionStandardEstimated"] = False
    if not std and implied:                                    # B-04 / B-11 style "implied" figures
        std, p["tuitionStandardEstimated"] = implied, True
    allv = std + payable
    # standard = only figures the source labels original / standard / normal / full (or estimated)
    p["tuitionStandardCNYPerYear"] = max(std) if std else None
    # every annual tuition figure the brochure lists (with or without scholarship)
    p["tuitionMaxListedCNYPerYear"] = max(allv) if allv else None
    # best case: 0 when any scholarship type (or the programme itself) makes tuition free
    p["tuitionMinCNYPerYear"] = 0 if (free or p["tuitionFree"]) else (min(allv) if allv else None)
    p["tuitionPerSemesterCNY"] = min(sem) if pid == "B-39" and sem else None
    p["tuitionAndDormCombinedCNYPerYear"] = combined
    p.pop("tuitionCNYPerYear", None)

    # ---- manual overrides where the brochure uses a table / no period (checked by hand)
    OVERRIDES = {
        "B-14": {"tuitionMinCNYPerYear": 0, "tuitionMaxListedCNYPerYear": 5000,
                 "tuitionNote": "Type A majors free; Type B majors pay 5000 CNY after scholarship"},
        "B-01": {"tuitionMaxListedCNYPerYear": 7500, "tuitionMinCNYPerYear": 7500,
                 "tuitionNote": "7500 CNY paid on arrival; Belt and Road Scholarship of 20,000 CNY/year "
                                "is refunded each semester"},
        "L-01": {"courseTotalCNY": 5000, "tuitionNote": "5,000 RMB in total for 6 months, tuition + hostel"},
    }
    p.update(OVERRIDES.get(pid, {}))
    p.setdefault("tuitionNote", None)
    if not p.get("costItems"):                               # MBBS table / fully funded programmes
        p["costItems"] = p["fees"] or [x for x in (
            p["tuition"] and f"Tuition: {p['tuition']}", p["dorm"] and f"Dormitory: {p['dorm']}",
            p["stipendText"] and f"Monthly stipend: {p['stipendText']}",
            pid.startswith("P-") and "Tuition: Free | Dormitory: Free | Stipend: 3500 CNY/month") if x]

    # ---- language policy (curated from SECTION 11.1 / 11.2)
    p["languagePolicy"] = LANG.get(pid) or (
        {"type": "none", "note": "No IELTS/Duolingo required (as stated)"} if pid in NO_IELTS
        else {"type": "not-stated", "note": "Not stated in the brochure - ask IFFI Global"})

    # ---- study fields (broad categories for the finder)
    p["fields"] = sorted({field_of(m) for m in p["majors"]} - {None})

    # ---- numeric age range + application window (for the eligibility checker / cards)
    AGE_RANGE = {"B-32": (17, 25), "B-20": (18, 25), "B-22": (18, 27), "B-10": (18, 35),
                 "B-17": (None, 30), "B-15": (None, 44)}
    a = AGE_RANGE.get(pid)
    p["ageRange"] = {"min": a[0], "max": a[1]} if a else None
    MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
              "October", "November", "December"]
    d = p["deadline2025"]
    p["typicalDeadlineMonth"] = MONTHS[int(d[5:7]) - 1] if d else (
        "Rolling (until seats fill)" if pid in ("B-19", "B-21") else None)
    if p["province"] in PROVINCES:
        p["provinceCode"] = PROVINCES[p["province"]][0]
    c = CITIES.get(p["city"]) if p["city"] else None
    cap = PROVINCES.get(p["province"])
    p["coordinates"] = {"lat": c[1], "lng": c[2]} if c else ({"lat": cap[3], "lng": cap[4]} if cap else None)
    p["coordinatesApproximate"] = c is None
    p["displayName"] = (f"{p['level']} programme in {p['city']}" if p["city"]
                        else f"{p['level']} programme in {p['province']} Province")
    p["slug"] = re.sub(r"[^a-z0-9]+", "-", f"{pid} {p['level']} {p['city'] or p['province']}".lower()).strip("-")

programs.sort(key=lambda p: (["Bachelor", "MBBS", "Master", "PhD", "Language"].index(p["level"]),
                             int(p["id"].split("-")[1]) + (0 if p["id"] != "B-10" else 0)))

# ---------------------------------------------------------------- provinces summary
prov_out = []
for name, (code, zh, capital, lat, lng, kind) in PROVINCES.items():
    ps = [p for p in programs if p["province"] == name]
    if not ps:
        continue
    levels = collections.Counter(p["level"] for p in ps)
    cities = sorted({p["city"] for p in ps if p["city"]})
    stip = [p["stipendCNYPerMonth"] for p in ps if p["stipendCNYPerMonth"]]
    majors = collections.Counter(m for p in ps for m in p["majors"])
    prov_out.append({
        "name": name, "nameZh": zh, "adcode": code, "type": kind, "capital": capital,
        "center": {"lat": lat, "lng": lng}, "programCount": len(ps),
        "programsByLevel": dict(levels), "cities": [
            {"name": c, "lat": CITIES[c][1], "lng": CITIES[c][2],
             "programIds": [p["id"] for p in ps if p["city"] == c]} for c in cities],
        "provinceWideProgramIds": [p["id"] for p in ps if not p["city"]],
        "maxStipendCNYPerMonth": max(stip) if stip else None,
        "fullyFundedCount": sum(1 for p in ps if p["fullyFunded"]),
        "englishTaughtCount": sum(1 for p in ps if "English" in (p["teachingLanguages"] or [])),
        "sampleMajors": [m for m, _ in majors.most_common(6)],
        "programIds": [p["id"] for p in ps],
    })
prov_out.sort(key=lambda x: -x["programCount"])

os.makedirs(OUT_DIR, exist_ok=True)
json.dump(programs, open(os.path.join(OUT_DIR, "programs.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(prov_out, open(os.path.join(OUT_DIR, "provinces.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- QA report
print("programs:", len(programs), dict(collections.Counter(p["level"] for p in programs)))
print("missing location:", [p["id"] for p in programs if not p["province"]])
print("no majors:", [p["id"] for p in programs if not p["majors"]])
print("no teaching language:", [p["id"] for p in programs if not p["teachingLanguages"]])
print("provinces:", len(prov_out))
for pr in prov_out:
    print(f"  {pr['name']:<13}{pr['nameZh']:<5} {pr['programCount']:>2} progs {pr['programsByLevel']}  cities={[c['name'] for c in pr['cities']]} prov-wide={pr['provinceWideProgramIds']}")
print("cities:", len({p['city'] for p in programs if p['city']}))
print("English-taught:", sum('English' in (p['teachingLanguages'] or []) for p in programs),
      "| Chinese-taught:", sum(p['chineseTaught'] for p in programs),
      "| fully funded:", sum(p['fullyFunded'] for p in programs),
      "| with stipend:", sum(bool(p['stipendCNYPerMonth']) for p in programs),
      "| no IELTS:", sum(p['noIeltsRequired'] for p in programs))
print("total majors listed:", sum(len(p['majors']) for p in programs),
      "| unique:", len({m.lower() for p in programs for m in p['majors']}))
print("tuition standard:", sum(p['tuitionStandardCNYPerYear'] is not None for p in programs),
      "| max listed:", sum(p['tuitionMaxListedCNYPerYear'] is not None for p in programs),
      "| min:", sum(p['tuitionMinCNYPerYear'] is not None for p in programs))
for p in programs:
    print(f"   {p['id']:<6} std={p['tuitionStandardCNYPerYear']!s:<6} max={p['tuitionMaxListedCNYPerYear']!s:<6}"
          f" min={p['tuitionMinCNYPerYear']!s:<6} comb={p['tuitionAndDormCombinedCNYPerYear']!s:<5}"
          f" lang={p['languagePolicy']['type']:<13} n_fields={len(p['fields'])} majors={len(p['majors'])}")
fc = collections.Counter(field_of(m) for p in programs for m in p["majors"])
print("major fields:", dict(fc))
print("OTHER majors:", sorted({m for p in programs for m in p["majors"] if field_of(m) == "Other"}))
b39 = next(p for p in programs if p["id"] == "B-39")
print("B-39 majors:", b39["majors"], "langs:", b39["teachingLanguages"])
