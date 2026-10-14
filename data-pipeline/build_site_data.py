"""Generate site.json, tools.json and meta.json for the IFFI Consultant website kit.

Copy comes from Gujjify_Website_Extraction.txt (typos fixed), the Instagram captions (SECTION 13 of
that file) and computed statistics from programs.json / the keyword-research CSVs.
"""
import json, os, statistics, collections, csv, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent  # research folder
KIT_DATA = ROOT / 'iffi-consultant' / 'src' / 'data'

OUT = sys.argv[1] if len(sys.argv) > 1 else str(KIT_DATA)
ps = json.load(open(os.path.join(OUT, "programs.json"), encoding="utf-8"))
provs = json.load(open(os.path.join(OUT, "provinces.json"), encoding="utf-8"))
fx = json.load(open(HERE / "inputs" / "fx_cny.json", encoding="utf-8"))
KW = ROOT / "Gujjify_Keyword_Research_Global.csv"
kw = list(csv.DictReader(open(KW, encoding="utf-8-sig")))

BRAND = "IFFI Consultant"
SITE_URL = "https://www.ifficonsultant.com"
WA = "923264570214"
EMAIL = "ifficonsultant@gmail.com"
n = len(ps)
english = sum("English" in (p["teachingLanguages"] or []) for p in ps)
funded = sum(p["fullyFunded"] for p in ps)
stipend = sum(bool(p["stipendCNYPerMonth"]) for p in ps)
free_option = sum(p["tuitionMinCNYPerYear"] == 0 for p in ps)
cities = len({p["city"] for p in ps if p["city"]})

site = {
    "brand": {
        "name": BRAND, "shortName": BRAND, "wordmarkMain": "IFFI", "wordmarkSub": "CONSULTANT",
        "tagline": "Your Gateway to Study in China",
        "taglineAlt": ["Study in China Made Easy", "Study in China with Confidence",
                       "Your Gateway to China Education"],
        "description": "IFFI Consultant helps students from Pakistan and around the world win admissions, "
                       "scholarships and X1/X2 student visas for Chinese universities - from the first question "
                       "to arrival in China.",
        "logo": {"mark": "src/assets/brand/logo-mark-gold.png",
                 "variants": ["logo-mark-gold.png", "logo-mark-white.png", "logo-mark-navy.png"],
                 "description": "Crown above a split shield monogram. Transparent PNG variants were generated "
                                "from the original black-on-white logo; ask the client for an SVG master."},
        "fonts": {"heading": "Fraunces", "body": "Poppins"},
        "colors": {"navy": "#0d1f3f", "navy2": "#13294f", "navy3": "#1c3a6b", "gold": "#c8a24c",
                   "gold2": "#e0bd6b", "goldSoft": "#f7efdd", "ink": "#1d2738", "muted": "#697185",
                   "line": "#e7eaf1", "bg": "#f6f8fc", "card": "#ffffff", "good": "#2f9e6e",
                   "whatsapp": "#25d366", "error": "#c0392b"},
    },
    "contact": {
        "phoneDisplay": "+92 326 4570214", "phoneE164": "+923264570214", "whatsappNumber": WA,
        # Instagram / Facebook / UK company belonged to Gujjify - left empty until IFFI confirms its own
        "whatsappUrl": f"https://wa.me/{WA}", "email": EMAIL,
        "responsePromise": "We usually reply within minutes on WhatsApp.",
        "hours": "Open 24/7 on WhatsApp",
        "offices": [
            {"label": "Pakistan office", "city": "Lahore", "country": "Pakistan",
             "address": "Lakshmi Station, Lahore, Pakistan", "verified": False,
             "note": "Address as written on Facebook - confirm the full street address with the client"},
            {"label": "China", "city": None, "country": "China", "address": None, "verified": False,
             "note": "Listed on the old site with no city - confirm before publishing"},
        ],
    },
    "social": {
        "facebook": None,
        "instagram": None,
        "whatsapp": f"https://wa.me/{WA}",
        "email": f"mailto:{EMAIL}",
        "phone": "tel:+923264570214",
    },
    "legal": {
        "companyName": None, "companyNumber": None, "registeredIn": None, "registeredOffice": None,
        "footerDisclosure": None,
        "note": "IFFI's legal entity, registered address and governing law are not confirmed yet - ask the client.",
        "copyright": f"© 2026 {BRAND}. All rights reserved.",
        "credit": "Designed & Developed by RAVISN",
        "pagesRequired": ["Privacy Policy", "Terms of Service", "Cookie Policy"],
    },
    "navigation": [
        {"label": "Home", "path": "/"}, {"label": "Programmes", "path": "/programmes"},
        {"label": "Tools", "path": "/tools", "children": [
            {"label": "Cost Calculator", "path": "/tools/cost-calculator"},
            {"label": "University Finder", "path": "/programmes"},
            {"label": "Eligibility Checker", "path": "/tools/eligibility-checker"}]},
        {"label": "Services", "path": "/services"}, {"label": "About", "path": "/about"},
        {"label": "Blog", "path": "/blog"}, {"label": "FAQ", "path": "/faq"},
        {"label": "Contact", "path": "/contact"},
    ],
    "hero": {
        "eyebrow": "Study in China Made Easy",
        "headline": "Study in China", "headlineAccent": "with Confidence",
        "subheadline": "Admissions, scholarships and student visas for Chinese universities - from your first "
                       "question to your arrival in China. Explore real programmes across China on the map.",
        "primaryCta": {"label": "Free Consultation on WhatsApp", "whatsappMessageKey": "heroConsultation"},
        "secondaryCta": {"label": "Explore Programmes", "path": "/programmes"},
        "mapCaption": f"{n} programmes · {len(provs)} provinces · {cities} cities",
    },
    "stats": {
        "dataBacked": [
            {"value": n, "label": "Programmes in our current list"},
            {"value": len(provs), "label": "Provinces & municipalities"},
            {"value": cities, "label": "Cities"},
            {"value": english, "label": "English-taught programmes"},
            {"value": funded, "label": "Fully funded Master & PhD offers"},
            {"value": free_option, "label": "Programmes with a tuition-free scholarship option"},
            {"value": "3,500 CNY", "label": "Highest monthly stipend (PhD)"},
        ],
        "marketingClaims": {
            "items": [{"value": "1200+", "label": "Students Guided"}, {"value": "80+", "label": "Partner Universities"},
                      {"value": "500+", "label": "Scholarships Won"}, {"value": "7+", "label": "Years Experience"}],
            "publish": False,
            "note": "From the old website. Do NOT show until the client confirms what they count (company "
                    "incorporated Aug 2025; UK advertising rules require evidence for such claims).",
        },
    },
    "services": [
        {"id": "admission", "icon": "Landmark", "title": "University Admission Guidance",
         "summary": "End-to-end admission support for top Chinese universities, from shortlisting to offer letter.",
         "detail": "Our experts help you choose the right Chinese university and programme based on your academic "
                   "background, budget and career goals. We handle the complete application - preparing your file, "
                   "submitting to multiple universities, and following up until you receive your official "
                   "admission letter and JW202 form."},
        {"id": "scholarship", "icon": "Award", "title": "Scholarship Assistance (CSC & University)",
         "summary": "Maximise your chances for CSC, Confucius Institute, provincial and university scholarships.",
         "detail": "China offers some of the most generous scholarships in the world. We guide you through the "
                   "Chinese Government Scholarship (CSC), Confucius Institute Scholarship, provincial and university "
                   "scholarships - eligibility checks, study plan and recommendation-letter preparation, and on-time "
                   "submission for the strongest possible application."},
        {"id": "visa", "icon": "BookUser", "title": "Student Visa (X1 / X2) Processing",
         "summary": "Complete X1/X2 student visa filing and visa-process preparation.",
         "detail": "Once you receive your admission letter and JW202/JW201 form, we prepare your full student visa "
                   "application (X1 for study longer than 180 days, X2 for shorter study), fill the forms correctly, "
                   "arrange the document checklist and prepare you for the visa process."},
        {"id": "attestation", "icon": "FileCheck2", "title": "Document Attestation & Translation",
         "summary": "Degree, transcript and document attestation, notarisation and certified translation.",
         "detail": "We arrange attestation and legalisation of your academic and personal documents (IBCC, HEC, MOFA "
                   "and the Chinese Embassy where required) and provide certified English/Chinese translations so "
                   "your file is accepted without delays."},
        {"id": "hsk", "icon": "Languages", "title": "Chinese Language & HSK Preparation",
         "summary": "HSK preparation and Chinese language coaching for study and daily life.",
         "detail": "For Chinese-taught programmes and everyday life in China, we offer HSK preparation guidance and "
                   "connect you with quality language resources and tutors, so you arrive confident and ready."},
        {"id": "predeparture", "icon": "PlaneTakeoff", "title": "Pre-departure & Airport Pickup",
         "summary": "Orientation, travel guidance and airport pickup in China.",
         "detail": "Before you fly, we give you a complete pre-departure orientation - what to pack, customs, banking, "
                   "SIM card and registration. On arrival, we help arrange airport pickup and settling-in support in "
                   "your destination city."},
        {"id": "accommodation", "icon": "Home", "title": "Accommodation Assistance",
         "summary": "On-campus and off-campus accommodation booking support.",
         "detail": "We help you secure suitable accommodation - university dormitories or trusted off-campus options "
                   "- within your budget, arranged before you arrive."},
        {"id": "counselling", "icon": "Compass", "title": "Free Counselling & Programme Selection",
         "summary": "One-on-one counselling to pick the right city, university and programme.",
         "detail": "Not sure where to start? Book a free counselling session. We assess your profile and recommend "
                   "the best-fit programmes, cities and budget plan for studying in China."},
    ],
    "whyUs": [
        {"icon": "HandHeart", "title": "End-to-End Support",
         "text": "Admissions, scholarships, visa and pre-departure - all under one roof."},
        {"icon": "Medal", "title": "Scholarship Experts",
         "text": "Deep experience with CSC, Confucius Institute and university scholarships."},
        {"icon": "ShieldCheck", "title": "Honest & Transparent",
         "text": "Clear guidance with no false promises - your success is our priority."},
        {"icon": "MessageCircle", "title": "Fast WhatsApp Help",
         "text": "Quick answers whenever you need them, right on WhatsApp."},
    ],
    "process": {
        "title": "Your Journey in 5 Simple Steps",
        "steps": [
            {"title": "Free Eligibility Assessment", "text": "Share your marks, goals and budget on WhatsApp or our form."},
            {"title": "University & Scholarship Selection", "text": "We shortlist the best-fit programmes and scholarships for you."},
            {"title": "Complete Application Support", "text": "Study plan, documents, attestation and on-time submission."},
            {"title": "Admission Letter & Visa", "text": "JW202/JW201, X1/X2 visa file and visa-process preparation."},
            {"title": "Fly & Settle In", "text": "Pre-departure briefing, airport pickup and university registration."},
        ],
        "behindTheScenes": ["University Selection", "Document Attestation", "Study Plan & SOP Preparation",
                            "Application Submission", "University Follow-ups", "Visa File Preparation"],
        "note": "5-step version from Instagram (2026-07-18); the old website used 4 steps - confirm with client.",
    },
    "about": {
        "title": "Helping Students Reach Top Chinese Universities",
        "body": "IFFI Consultant is a dedicated China study consultancy helping students from Pakistan and beyond "
                "achieve their dream of studying at top Chinese universities. With deep knowledge of the Chinese "
                "admission and scholarship system, our mission is to make the entire journey - admissions, "
                "scholarships, visa and pre-departure - simple, transparent and successful. We treat every student "
                "like family, offering honest advice and complete support at every step.",
        "mission": "To make studying in China accessible, simple and successful for every deserving student through "
                   "honest, expert guidance at every step.",
        "vision": "To be the most trusted China study consultancy - known for transparency, results, and treating "
                  "every student like family.",
        "values": "Honesty, dedication and student-first service. We never make false promises - your success and "
                  "trust are everything to us.",
    },
    "faq": [
        {"q": "Is it expensive to study in China?", "status": "published",
         "a": "No. China is one of the most affordable study destinations. Tuition is low compared to Western "
              "countries, and many students study on full or partial scholarships such as CSC, which can cover "
              "tuition, accommodation and a monthly stipend."},
        {"q": "Do I need to know Chinese to study in China?", "status": "published",
         "a": f"Not always. {english} of the {n} programmes in our current list are taught in English. "
              "Chinese-taught programmes ask for an HSK certificate (usually HSK 4 or 5) - and we help you prepare. "
              "Basic Chinese still makes daily life much easier."},
        {"q": "What scholarships can IFFI Consultant help me apply for?", "status": "published",
         "a": "We assist with the Chinese Government Scholarship (CSC), Confucius Institute Scholarship, provincial "
              "scholarships and individual university scholarships, depending on your profile and programme."},
        {"q": "How long does the admission process take?", "status": "published",
         "a": "It varies by university and intake, but typically the admission process takes 4-10 weeks. Most "
              "September-intake deadlines in our list fall in May and June, so applying early is very important."},
        {"q": "Which documents do I need to apply?", "status": "published",
         "a": "Generally: passport (valid 2+ years), academic certificates and transcripts, a study plan or "
              "personal statement, recommendation letters, a medical examination form, a police character "
              "certificate and passport-size photos. We give you a personalised checklist."},
        {"q": "Is studying in China safe for international students?", "status": "published",
         "a": "Yes. China is considered very safe, with modern campuses, good public transport and large, "
              "welcoming international student communities in most major cities."},
        {"q": "Do you help with the student visa?", "status": "published",
         "a": "Yes. After your admission letter and JW202/JW201 form, we prepare your complete X1/X2 student visa "
              "application and guide you through the entire process."},
        {"q": "How do I get started?", "status": "published",
         "a": "Contact us on WhatsApp or fill in the contact form for a FREE counselling session. We will assess "
              "your profile and recommend the best universities and scholarships for you."},
        {"q": "How many marks do I need for a scholarship?", "status": "draft-needs-client-approval",
         "a": "There is no single cut-off. Universities look at your whole profile - grades, study plan, "
              "recommendation letters and timing. Many students with 70-75% marks still win scholarships when they "
              "apply to the right universities before the deadline. Try our free Eligibility Checker or send us "
              "your marks on WhatsApp."},
        {"q": "Can I practise in Pakistan after completing MBBS in China?", "status": "draft-verify-with-PMDC",
         "a": "To practise in Pakistan you must meet the Pakistan Medical & Dental Council (PM&DC) rules for "
              "foreign medical graduates, including its licensing requirements. Recognition depends on the specific "
              "university and your year of enrolment, so we check each university against the latest PM&DC "
              "guidance before you apply."},
        {"q": "Is learning Chinese mandatory?", "status": "draft-needs-client-approval",
         "a": f"Not for English-taught programmes ({english} of {n} in our list). Some universities ask "
              "international students to pass HSK 3 before graduating, and Chinese-taught programmes require HSK 4-5 "
              "at application."},
        {"q": "What are the total tuition and living costs?", "status": "draft-needs-client-approval",
         "a": "In our current list, Bachelor tuition before scholarships ranges from about 2,000 to 39,900 CNY per "
              "year (median about 14,000 CNY), MBBS from 26,000 to 40,000 CNY per year, and the Master and PhD offers "
              "are fully funded. Living costs are roughly 800-4,000 CNY a month depending on the city. Use our Cost "
              "Calculator for an estimate in your own currency."},
        {"q": "What are hostels and student life like?", "status": "draft-needs-client-approval",
         "a": "Most universities offer on-campus dormitories - shared rooms are the cheapest and many scholarships "
              "include free accommodation. Single rooms and off-campus options cost more. Campuses have canteens, "
              "sports facilities and large international student communities."},
    ],
    # The only testimonial found was given to Gujjify (the previous brand): never reuse it for IFFI.
    # Add IFFI students' stories here, with written permission, and "publish": True once approved.
    "testimonials": [],
    "documentChecklist": {
        "general": ["Matric / FSc / A-Level certificates & transcripts (or your country's equivalent)",
                    "Valid passport (2+ years)", "Passport-size photos (white background)",
                    "Foreigner physical (medical) examination form", "Police character certificate",
                    "English proficiency proof (IELTS is optional for many programmes)",
                    "Study plan / motivation letter", "Recommendation letters (Master & PhD: two from professors)",
                    "Bank statement (some programmes: USD 2,500-5,000)",
                    "Self-introduction video (some programmes)"],
        "source": "Instagram checklist (2026-07-19) + programme brochures",
    },
    "programmesPromoted": [
        {"name": "MBBS", "text": "English-medium medicine (6 years incl. internship)"},
        {"name": "Engineering", "text": "Civil, Mechanical, Electrical & CPEC career opportunities"},
        {"name": "Computer Science", "text": "AI, Data Science & Software Development"},
        {"name": "BBA / MBA", "text": "Business education with global exposure"},
        {"name": "And more", "text": "Pharmacy, Economics, Chinese Language and many other programmes"},
    ],
    "whatsapp": {
        "number": WA,
        "messages": {
            "default": "Hello IFFI Consultant, I want to study in China.",
            "heroConsultation": "Hello IFFI Consultant, I want a free consultation for studying in China.",
            "ctaJourney": "Hello IFFI Consultant, I want to start my China study journey.",
            "aboutServices": "Hello IFFI Consultant, I would like to know more about your services.",
            "serviceInterest": "Hello IFFI Consultant, I am interested in: {service}",
            "chooseService": "Hello IFFI Consultant, I need help choosing the right service.",
            "faqQuestion": "Hello IFFI Consultant, I have a question about studying in China.",
            "blogGuidance": "Hello IFFI Consultant, I read your article and want guidance.",
            "programInterest": "Hello IFFI Consultant, I am interested in programme {id} ({level}, {location}).",
            "shortlist": "Hello IFFI Consultant, here is my programme shortlist: {ids}. Please advise.",
            "costEstimate": "Hello IFFI Consultant, my cost estimate: {summary}. Please send me an exact quote.",
            "eligibilityResult": "Hello IFFI Consultant, my eligibility check: {summary}. Please assess my profile.",
            "provinceInterest": "Hello IFFI Consultant, I want to study in {province}, China.",
            "chatSummary": "Hello IFFI Consultant, I was using your website assistant. My questions: {summary}",
        },
    },
    "blogSeeds": [
        {"slug": "study-engineering-in-china-guide", "title": "Study Engineering in China: Everything You Need to Know", "date": "2026-06-29"},
        {"slug": "top-10-chinese-universities-for-international-students-2026", "title": "Top 10 Chinese Universities for International Students in 2026", "date": "2026-06-29"},
        {"slug": "top-scholarships-for-international-students-in-china", "title": "Top Scholarships for International Students in China", "date": "2026-06-29"},
        {"slug": "how-to-apply-for-chinese-student-visa-2026", "title": "How to Apply for a Chinese Student Visa in 2026", "date": "2026-06-29"},
        {"slug": "why-choose-iffi-consultant-for-study-in-china", "title": "Why Choose IFFI Consultant for Study in China?", "date": "2026-06-29"},
        {"slug": "why-study-in-china-2026", "title": "Why Study in China in 2026? Top 7 Reasons", "date": "2026-06-23"},
        {"slug": "csc-scholarship-complete-guide", "title": "CSC Scholarship: A Complete Step-by-Step Guide", "date": "2026-06-23"},
        {"slug": "china-student-visa-x1-x2", "title": "Student Visa for China (X1 vs X2): What You Must Know", "date": "2026-06-23"},
        {"slug": "cost-of-studying-in-china", "title": "Cost of Studying in China: Tuition, Living & Budget", "date": "2026-06-23"},
    ],
    "seo": {
        "siteUrl": SITE_URL,
        "routes": {
            "/": {"title": "Study in China with Scholarships | IFFI Consultant",
                  "description": f"Explore {n} China programmes in {len(provs)} provinces - CSC & university "
                                 "scholarships, costs and X1 visa support. Free eligibility check and WhatsApp counselling."},
            "/programmes": {"title": "China University & Scholarship Finder 2026-27 | IFFI Consultant",
                            "description": "Filter China programmes by level, major, city, teaching language, scholarship "
                                           "and stipend. Shortlist, compare and download your list as PDF."},
            "/tools/cost-calculator": {"title": "Study in China Cost Calculator - Tuition + Living | IFFI Consultant",
                                       "description": "Estimate tuition, hostel and living costs in China by city and "
                                                      "scholarship - shown in PKR, BDT, NGN, IDR and 40+ currencies."},
            "/tools/eligibility-checker": {"title": "China Scholarship (CSC) Eligibility Checker | IFFI Consultant",
                                           "description": "Check your eligibility for Chinese university scholarships "
                                                          "in 2 minutes - with or without IELTS - and see matching programmes."},
            "/services": {"title": "China Admission, CSC Scholarship & X1 Visa Services | IFFI Consultant",
                          "description": "Admissions, scholarships, X1/X2 visas, attestation, HSK and pre-departure "
                                         "support for studying in China."},
            "/about": {"title": "About IFFI Consultant - China Study Experts",
                       "description": "A China study consultancy (IFFI Consultant) helping students from Pakistan and "
                                      "worldwide reach Chinese universities."},
            "/faq": {"title": "Study in China FAQ - Scholarships, Costs, Visa | IFFI Consultant",
                     "description": "Answers about scholarships, marks, IELTS, MBBS, costs, hostels and student visas for China."},
            "/contact": {"title": "Contact IFFI Consultant - WhatsApp +92 326 4570214",
                         "description": "Free counselling for studying in China. WhatsApp, call or email IFFI Consultant."},
            "/blog": {"title": "Study in China Guides & News | IFFI Consultant Blog",
                      "description": "Guides on CSC scholarships, China student visas, costs and universities."},
        },
        "oldUrlRedirects": {
            "/index.php": "/", "/about.php": "/about", "/services.php": "/services", "/blog.php": "/blog",
            "/faq.php": "/faq", "/contact.php": "/contact", "/blog-post.php?slug={slug}": "/blog/{slug}",
        },
    },
    "disclaimers": {
        "dataFreshness": "Programme details come from university brochures for the 2024-2025 intakes. Fees, "
                         "scholarships and deadlines change every year - confirm the latest details with IFFI Consultant "
                         "before applying.",
        "universityNames": "University names are shared during your free consultation.",
        "costEstimate": "Estimates only. Living costs are typical student budgets by city tier; exchange rates update "
                        "daily. Ask us for an exact quote.",
        "eligibility": "Indicative only - this is not an admission or scholarship decision. Final decisions are "
                       "made by universities and scholarship bodies.",
        "mbbsRecognition": "Recognition by your home medical council (e.g. PM&DC in Pakistan) depends on the "
                           "university and year - we verify it for each student before applying.",
    },
}

# ------------------------------------------------------------------ tools.json
tool_counts = collections.Counter(r["maps_to_tool"] for r in kw if r["maps_to_tool"])
tool_markets = {t: len({r["market"] for r in kw if r["maps_to_tool"] == t}) for t in tool_counts}
market_counts = collections.Counter(r["market"] for r in kw)
MARKETS = [("PK", "Pakistan", "PKR"), ("ID", "Indonesia", "IDR"), ("VN", "Vietnam", "VND"),
           ("KZ", "Kazakhstan", "KZT"), ("EG", "Egypt", "EGP"), ("BD", "Bangladesh", "BDT"),
           ("IN", "India", "INR"), ("UZ", "Uzbekistan", "UZS"), ("MY", "Malaysia", "MYR"),
           ("TH", "Thailand", "THB"), ("CM", "Cameroon", "XAF"), ("NP", "Nepal", "NPR"),
           ("LK", "Sri Lanka", "LKR"), ("PH", "Philippines", "PHP"), ("SD", "Sudan", "SDG"),
           ("ZA", "South Africa", "ZAR"), ("NG", "Nigeria", "NGN"), ("KE", "Kenya", "KES"),
           ("ET", "Ethiopia", "ETB"), ("UG", "Uganda", "UGX"), ("MM", "Myanmar", "MMK"),
           ("ZM", "Zambia", "ZMW"), ("GH", "Ghana", "GHS"), ("KG", "Kyrgyzstan", "KGS"),
           ("TZ", "Tanzania", "TZS"), ("MN", "Mongolia", "MNT"), ("LA", "Laos", "LAK"),
           ("KH", "Cambodia", "KHR"), ("RW", "Rwanda", "RWF"), ("ZW", "Zimbabwe", "ZWG"),
           ("MW", "Malawi", "MWK"), ("TJ", "Tajikistan", "TJS"), ("AF", "Afghanistan", "AFN"),
           ("GM", "Gambia", "GMD"), ("SO", "Somalia", "SOS"), ("LR", "Liberia", "LRD"),
           ("SL", "Sierra Leone", "SLE"), ("SN", "Senegal", "XOF")]
flag = lambda cc: "".join(chr(0x1F1E6 + ord(c) - 65) for c in cc)
rates = fx["cny"]
currencies = [{"country": name, "countryCode": cc, "currency": cur, "flag": flag(cc),
               "keywordDemand": market_counts.get(cc, 0)} for cc, name, cur in MARKETS]
currencies += [{"country": c, "countryCode": cc, "currency": cur, "flag": flag(cc), "keywordDemand": 0}
               for cc, c, cur in (("US", "United States", "USD"), ("GB", "United Kingdom", "GBP"),
                                  ("EU", "Euro area", "EUR"), ("CN", "China", "CNY"))]
TIER1 = ["Beijing", "Shanghai", "Shenzhen", "Guangzhou"]
TIER2 = ["Tianjin", "Hangzhou", "Nanjing", "Chengdu", "Wuhan", "Xi'an", "Zhengzhou", "Changsha", "Kunming",
         "Harbin", "Fuzhou", "Shijiazhuang", "Nanning", "Wenzhou", "Changzhou", "Nantong", "Shaoxing",
         "Hefei", "Nanchang", "Shenyang", "Lanzhou"]
TIER3 = ["Yangzhou", "Zhenjiang", "Xuzhou", "Jinhua", "Dazhou", "Neijiang", "Nanchong", "Ganzhou", "Zibo"]
bach = [p["tuitionStandardCNYPerYear"] or p["tuitionMaxListedCNYPerYear"] for p in ps
        if p["level"] == "Bachelor" and (p["tuitionStandardCNYPerYear"] or p["tuitionMaxListedCNYPerYear"])]
mbbs = [p["tuitionStandardCNYPerYear"] for p in ps if p["level"] == "MBBS"]

tools = {
    "demandEvidence": {
        "source": "Gujjify_Keyword_Research_Global.csv - 10,325 Google-autocomplete keywords, 38 markets, 2026-10-05",
        "ranking": [{"tool": t, "keywords": c, "markets": tool_markets[t]} for t, c in tool_counts.most_common()],
        "selected": ["Cost calculator", "University finder / agency no.", "Eligibility checker"],
    },
    "currency": {
        "base": "CNY",
        "liveRatesUrl": "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cny.json",
        "liveRatesFallbackUrl": "https://latest.currency-api.pages.dev/v1/currencies/cny.json",
        "liveRatesShape": "{ date: 'YYYY-MM-DD', cny: { pkr: 41.2, usd: 0.149, ... } } (lower-case codes)",
        "fallbackRatesDate": fx["date"],
        "fallbackRates": {c["currency"]: round(rates[c["currency"].lower()], 6) if c["currency"] != "CNY" else 1
                          for c in currencies},
        "currencies": currencies,
        "defaultByTimezoneHint": {"Asia/Karachi": "PKR", "Asia/Dhaka": "BDT", "Asia/Kolkata": "INR",
                                  "Africa/Lagos": "NGN", "Asia/Jakarta": "IDR", "Asia/Ho_Chi_Minh": "VND",
                                  "Africa/Nairobi": "KES", "Africa/Cairo": "EGP", "Asia/Almaty": "KZT",
                                  "Asia/Tashkent": "UZS", "Asia/Kathmandu": "NPR", "Asia/Colombo": "LKR"},
        "defaultCurrency": "PKR",
    },
    "costCalculator": {
        "note": "Fixed fees = most common values in the programme brochures. Living and accommodation = typical "
                "2026 student budgets by city tier (estimates - editable).",
        "fixedFeesCNY": {
            "insurancePerYear": 800, "residencePermitPerYear": 400,
            "medicalCheckFirstYear": 400, "registrationFirstYear": 450, "applicationFeeOnce": 400,
            "evidence": "insurance 800 in 38/44 programmes; residence permit 400 in 26/35 (800 in 9); medical "
                        "check 400 in 25/47; registration 400-500; application fee 400-800",
        },
        "cityTiers": {"tier1": TIER1, "tier2": TIER2, "tier3": TIER3},
        "livingMonthlyCNY": {   # food + utilities/mobile + transport + personal (excl. rent & tuition)
            "tier1": {"lean": 1200, "standard": 2000, "comfortable": 3500},
            "tier2": {"lean": 900, "standard": 1500, "comfortable": 2800},
            "tier3": {"lean": 700, "standard": 1100, "comfortable": 2000},
        },
        "accommodationMonthlyCNY": {
            "sharedDorm": {"tier1": 900, "tier2": 600, "tier3": 400},
            "singleDorm": {"tier1": 1500, "tier2": 1000, "tier3": 750},
            "offCampusShared": {"tier1": 2500, "tier2": 1600, "tier3": 1100},
        },
        "levelDefaults": {
            "Bachelor": {"durationYears": 4, "tuitionMedianCNY": statistics.median(bach),
                         "tuitionRangeCNY": [min(bach), max(bach)]},
            "MBBS": {"durationYears": 6, "tuitionMedianCNY": statistics.median(mbbs),
                     "tuitionRangeCNY": [min(mbbs), max(mbbs)]},
            "Master": {"durationYears": 3, "tuitionMedianCNY": 20000, "tuitionRangeCNY": [0, 30000],
                       "note": "All 17 Master offers in the list are fully funded; self-funded example B-10: 20,000/yr"},
            "PhD": {"durationYears": 4, "tuitionMedianCNY": 0, "tuitionRangeCNY": [0, 0],
                    "note": "All 5 PhD offers are fully funded with 3,500 CNY/month stipend"},
            "Language": {"durationYears": 0.5, "courseTotalCNY": 5000,
                         "note": "6-month Nanning course: 5,000 RMB total incl. hostel"},
        },
        "scholarshipScenarios": [
            {"id": "self", "label": "Self-funded", "tuitionFactor": 1, "accommodationFree": False},
            {"id": "partial", "label": "Partial scholarship (50% tuition)", "tuitionFactor": 0.5, "accommodationFree": False},
            {"id": "tuition", "label": "Tuition-free scholarship", "tuitionFactor": 0, "accommodationFree": False},
            {"id": "full", "label": "Fully funded (tuition + dorm free + stipend)", "tuitionFactor": 0,
             "accommodationFree": True, "useProgrammeStipend": True},
        ],
        "optionalOneTime": ["X1/X2 visa fee (varies by country)", "Flight to China", "Document attestation"],
    },
    "eligibilityChecker": {
        "levels": {
            "Bachelor": "Completed (or final year of) 12 years of school - FSc, A-Level, HSC or equivalent",
            "MBBS": "12 years of school with Biology/Chemistry (pre-medical) - FSc, A-Level, HSC or equivalent",
            "Master": "Completed Bachelor's degree",
            "PhD": "Completed Master's degree",
            "Language": "No academic requirement (6-month non-degree course)",
        },
        "gradeInput": {"modes": ["percentage", "cgpa"], "cgpaScales": [4.0, 5.0, 10.0],
                       "conversion": "approxPercent = cgpa / scale * 100 (approximation - label it as such)"},
        "scoreBands": [
            {"minPercent": 80, "band": "Strong", "text": "Strong scholarship profile - aim for full scholarships."},
            {"minPercent": 70, "band": "Good", "text": "Good chances - many 70-75% students win scholarships with a strong application."},
            {"minPercent": 60, "band": "Possible", "text": "Partial scholarships and tuition-free options are realistic."},
            {"minPercent": 0, "band": "Needs a plan", "text": "Consider language-year routes or self-funded options - talk to us."},
        ],
        "englishTests": [{"id": "ielts", "label": "IELTS", "max": 9, "step": 0.5},
                         {"id": "toefl", "label": "TOEFL iBT", "max": 120, "step": 1},
                         {"id": "duolingo", "label": "Duolingo", "max": 160, "step": 5},
                         {"id": "pte", "label": "PTE Academic", "max": 90, "step": 1},
                         {"id": "moi", "label": "English medium-of-instruction letter (no test)"}],
        "hskLevels": [0, 1, 2, 3, 4, 5, 6],
        "bankStatementOptions": [{"label": "Under USD 2,500", "value": 0}, {"label": "USD 2,500-4,999", "value": 2500},
                                 {"label": "USD 5,000 or more", "value": 5000}],
        "rules": [
            "level must match (Master includes programme B-10)",
            "ageRange (if present) must contain the student's age",
            "languagePolicy: none / internal-test -> pass; english-test -> any provided test >= threshold "
            "(near miss = within IELTS 0.5 / TOEFL 10 / Duolingo 10 / PTE 5); any-english -> any test or MOI letter; "
            "hsk -> HSK >= required; unspecified / not-stated -> pass with 'may ask for English proof' note",
            "teaching-language preference filters English / Chinese / either",
            "bankStatementUSD (if present) must be <= the student's bank-statement capacity",
            "funding 'full scholarship only' keeps programmes where fullyFunded or tuitionMinCNYPerYear == 0",
            "MA-15 needs at least 70% in the last degree",
        ],
        "disclaimer": site["disclaimers"]["eligibility"],
    },
    "finder": {
        "filters": ["level", "fields", "majorSearch", "province", "city", "teachingLanguage",
                    "scholarship (fully funded / stipend / tuition-free option)", "noIeltsRequired",
                    "maxTuitionCNY", "rankingTopChina", "interviewOrVideoRequired"],
        "fields": ["Engineering & Technology", "Computer Science & AI", "Business & Economics", "Medicine & Health",
                   "Science & Mathematics", "Agriculture, Food & Environment", "Languages, Education & Humanities",
                   "Law & Social Sciences", "Arts, Design, Media & Sports"],
        "sort": ["Best match", "Lowest tuition", "Highest stipend", "Best China ranking", "Most majors"],
        "shortlistMax": 10, "compareMax": 3,
        "pdfExport": "window.print() with a print stylesheet (users search 'china university list pdf')",
        "agencyNumberNote": "Users search for CSC 'agency numbers'; that data is not in our dataset - answer in "
                            "the FAQ and route to WhatsApp.",
    },
}

meta = {
    "generated": "2026-10-07",
    "sources": {
        "programmes": "Extracted_Features_All_Programs.txt (7 brochures/forms; university names removed on purpose)",
        "website": "Gujjify_Website_Extraction.txt (old gujjify.com site - copy reused with the brand name replaced)",
        "keywords": "Gujjify_Keyword_Research_Global.csv + Gujjify_Keyword_Research_Autocomplete.csv",
        "geo": "Alibaba DataV GeoAtlas China provinces, simplified (china-provinces.geo.json)",
        "fx": f"fawazahmed0 currency-api, {fx['date']}",
    },
    "counts": {"programmes": n, "provinces": len(provs), "cities": cities,
               "byLevel": dict(collections.Counter(p["level"] for p in ps)),
               "englishTaught": english, "fullyFunded": funded, "withStipend": stipend,
               "tuitionFreeOption": free_option},
    "intakes": "Bachelor/MBBS: September 2025 brochure; Master & PhD: September 2024 brochures; "
               "Language: 2026 flyer. All listed deadlines (2025) have passed - show them as 'typical month'.",
    "rules": ["Never show or invent university names", "Never invent programmes, fees or deadlines",
              "Always show the data-freshness disclaimer near programme data"],
}

# original blog text (the client's own words, from the saved old-site pages) - no third-party images
import re, html as _html
# posts whose slug changed with the rebrand still read the old saved page
OLD_POST_FILES = {"why-choose-iffi-consultant-for-study-in-china": "why-choose-gujjify-consultant-for-study-in-china"}
for post in site["blogSeeds"]:
    raw = open(HERE / "inputs" / "old-site-posts" / (OLD_POST_FILES.get(post["slug"], post["slug"]) + ".html"), encoding="utf-8").read()
    art = raw[raw.find('<div class="article'):raw.find('<div style="margin-top:28px')]
    post["body"] = [_html.unescape(re.sub(r"<[^>]+>", "", x)).strip().replace("Gujjify Consultant", BRAND)
                    for x in re.findall(r"<p>(.*?)</p>", art, re.S)]
    post["status"] = "thin - expand to 800+ words before relaunch"
    post["coverImage"] = None   # old covers were hot-linked third-party images - do not reuse

json.dump(site, open(os.path.join(OUT, "site.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(tools, open(os.path.join(OUT, "tools.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for f in ("site.json", "tools.json", "meta.json"):
    print(f, os.path.getsize(os.path.join(OUT, f)), "bytes")
print("counts:", meta["counts"])
print("tool ranking:", tools["demandEvidence"]["ranking"][:4])
