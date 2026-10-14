/**
 * Builds the knowledge base for the "Ask IFFI" assistant: src/data/rag-index.json.
 *
 * Every chunk comes from what the website publishes: programmes, provinces, published FAQs, services, process,
 * cost tables, eligibility rules, contacts and the blog articles. Drafts, deadline dates (2025) and anything the
 * client has not confirmed stay out. Each chunk is embedded with Gemini (gemini-embedding-2, 768 dims) and the
 * vector stored as int8 + scale (base64) to keep the file small.
 *
 *   npm run build            # optional but recommended first: blog articles are read from the built HTML
 *   npm run rag:index        # needs GEMINI_API_KEY in .env.local
 *
 * Re-run whenever src/data or the blog changes, then commit src/data/rag-index.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = (f) => JSON.parse(fs.readFileSync(path.join(root, 'src/data', f), 'utf8'));
const site = data('site.json');
const tools = data('tools.json');
const meta = data('meta.json');
const programs = data('programs.json');
const provinces = data('provinces.json');

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-2';
const DIMS = 768;

function loadEnv() {
  const f = path.join(root, '.env.local');
  if (!process.env.GEMINI_API_KEY && fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

/* ---------- helpers that mirror src/lib/programs.ts wording ---------- */
const n = (v) => new Intl.NumberFormat('en-US').format(v);
const slugProvince = (name) => name.toLowerCase().replace(/[^a-z]/g, '');
const LEVEL = { Bachelor: 'Bachelor', MBBS: 'MBBS', Master: 'Master', PhD: 'PhD', Language: 'Chinese language course' };

function teaching(p) {
  const l = p.teachingLanguages || [];
  if (!l.length) return p.chineseTaught ? 'Chinese-taught' : 'teaching language not stated';
  if (l.includes('English') && l.includes('Chinese')) return 'taught in English or Chinese';
  return `${l[0]}-taught`;
}
function tuition(p) {
  if (p.courseTotalCNY != null) return `${n(p.courseTotalCNY)} CNY for the whole course, hostel included`;
  const max = p.tuitionMaxListedCNYPerYear ?? p.tuitionStandardCNYPerYear;
  const min = p.tuitionMinCNYPerYear;
  if (min != null && max != null && min !== max) return `tuition ${n(min)}-${n(max)} CNY per year depending on scholarship`;
  if (max != null) return `tuition ${n(max)} CNY per year${p.tuitionStandardEstimated ? ' (estimated)' : ''}`;
  if (min === 0) return p.fullyFunded ? 'tuition-free (fully funded)' : 'tuition-free scholarship option';
  return 'tuition on request';
}
function language(p) {
  const lp = p.languagePolicy || {};
  const tests = [lp.ielts && `IELTS ${Number(lp.ielts).toFixed(1)}`, lp.toefl && `TOEFL ${lp.toefl}`, lp.duolingo && `Duolingo ${lp.duolingo}`, lp.pte && `PTE ${lp.pte}`].filter(Boolean);
  switch (lp.type) {
    case 'none': return 'No IELTS, Duolingo or other English test required (as stated in the brochure).';
    case 'internal-test': return 'No IELTS needed: the university runs its own online English test.';
    case 'english-test': return `Minimum English score: ${tests.join(' or ')}.${lp.hsk ? ` Chinese-taught track: HSK ${lp.hsk}.` : ''}`;
    case 'any-english': return 'Any English certificate accepted (IELTS, TOEFL, Duolingo or similar).';
    case 'hsk': return `Taught in Chinese: HSK ${lp.hsk} required.`;
    default: return 'The brochure does not state the language requirement - ask us.';
  }
}
const HIDDEN_DETAIL = /important notice|highly recommended|benefits listed|program purpose|recognition/i;

/* ---------- corpus ---------- */
const chunks = [];
const add = (id, title, url, text) => chunks.push({ id, title, url, text: text.replace(/[ \t]+/g, ' ').trim() });

add('overview', 'Overview of the programme list', '/programmes',
  `${site.brand.name} currently lists ${meta.counts.programmes} programmes in ${meta.counts.provinces} Chinese provinces and ${meta.counts.cities} cities. ` +
  `By level: ${Object.entries(meta.counts.byLevel).map(([k, v]) => `${LEVEL[k] ?? k} ${v}`).join(', ')}. ` +
  `${meta.counts.englishTaught} are English-taught, ${meta.counts.fullyFunded} Master and PhD offers are fully funded, ${meta.counts.withStipend} include a monthly stipend, ` +
  `${meta.counts.tuitionFreeOption} have a tuition-free scholarship option. ${site.disclaimers.dataFreshness} ${site.disclaimers.universityNames}`);

for (const p of programs) {
  const where = p.city ? `${p.city}, ${p.province}` : `${p.province} (province-wide, city shared on request)`;
  const facts = [
    `Programme ${p.id}: ${p.displayName}. Level: ${p.levelDetail && !/see note/i.test(p.levelDetail) ? p.levelDetail : LEVEL[p.level]}. Location: ${where}. ${teaching(p)}.`,
    p.duration && `Duration: ${p.duration}.`,
    `Costs: ${tuition(p)}.`,
    p.stipendCNYPerMonth ? `Stipend: ${n(p.stipendCNYPerMonth)} CNY per month.` : null,
    p.fullyFunded ? 'Fully funded offer (free tuition and dormitory plus stipend).' : null,
    p.scholarships?.length ? `Scholarships: ${p.scholarships.join('; ')}.` : null,
    p.costItems?.length ? `Fees listed in the brochure: ${p.costItems.join('; ')}.` : null,
    `Language: ${language(p)}`,
    p.ranking?.china ? `Ranking as stated in the brochure: #${p.ranking.china} in China${p.ranking.world ? `, #${p.ranking.world} in the world` : ''}.` : null,
    p.ageRange && (p.ageRange.min || p.ageRange.max) ? `Age: ${p.ageRange.min ?? ''}${p.ageRange.max ? `-${p.ageRange.max}` : '+'}.` : null,
    p.bankStatementUSD ? `Bank statement: at least USD ${n(p.bankStatementUSD)}.` : null,
    p.interview ? `Interview: ${p.interview}.` : null,
    p.introVideoRequired ? 'A self-introduction video is required.' : null,
    p.typicalDeadlineMonth ? `Applications usually close in ${p.typicalDeadlineMonth} (typical month; confirm the current deadline with us).` : null,
    p.documents?.length ? `Documents: ${p.documents.join('; ')}.` : null,
    p.level === 'MBBS' ? site.disclaimers.mbbsRecognition : null,
  ].filter(Boolean).join(' ');
  add(`programme-${p.id}`, `${p.id} ${p.displayName}`, `/programmes/${p.slug}`, facts);
  const majors = p.majors || [];
  for (let i = 0; i < majors.length; i += 60) {
    add(`programme-${p.id}-majors-${i / 60}`, `${p.id} ${p.displayName} - majors`, `/programmes/${p.slug}`,
      `Majors offered in programme ${p.id} (${p.displayName}, ${where})${majors.length > 60 ? `, part ${i / 60 + 1}` : ''}: ${majors.slice(i, i + 60).join(', ')}.`);
  }
  const sections = Object.entries(p.details || {}).filter(([t, lines]) => !HIDDEN_DETAIL.test(t) && lines?.length);
  if (sections.length) {
    const text = sections.map(([t, lines]) => `${t.replace(/\s*\[img heading\]/i, '').replace(/"/g, '')}: ${lines.filter((l) => !/\bphotos?:/i.test(l)).join('; ')}`).join(' ');
    add(`programme-${p.id}-details`, `${p.id} ${p.displayName} - brochure details`, `/programmes/${p.slug}`, `More details for programme ${p.id}: ${text}`.slice(0, 2400));
  }
}

for (const p of provinces) {
  const levels = Object.entries(p.programsByLevel || {}).map(([k, v]) => `${LEVEL[k] ?? k} ${v}`).join(', ');
  add(`province-${slugProvince(p.name)}`, `Study in ${p.name}`, `/provinces/${slugProvince(p.name)}`,
    `${p.name} (${p.nameZh}), capital ${p.capital}: ${p.programCount} programmes (${levels}). ` +
    `Cities with programmes: ${p.cities.length ? p.cities.map((c) => c.name).join(', ') : 'province-wide offers only'}. ` +
    `${p.englishTaughtCount} English-taught, ${p.fullyFundedCount} fully funded${p.maxStipendCNYPerMonth ? `, stipends up to ${n(p.maxStipendCNYPerMonth)} CNY per month` : ''}. ` +
    `Programme ids: ${p.programIds.join(', ')}. ${p.sampleMajors?.length ? `Popular majors: ${p.sampleMajors.slice(0, 8).join(', ')}.` : ''}`);
}

site.faq.filter((f) => f.status === 'published').forEach((f, i) => add(`faq-${i}`, `FAQ: ${f.q}`, '/faq', `Q: ${f.q} A: ${f.a}`));
for (const s of site.services) add(`service-${s.id}`, `Service: ${s.title}`, `/services#${s.id}`, `${s.title}. ${s.summary} ${s.detail ?? ''}`);
add('process', site.process.title, '/services',
  `${site.process.title}: ${site.process.steps.map((s, i) => `${i + 1}. ${s.title} - ${s.text}`).join(' ')} Behind the scenes: ${site.process.behindTheScenes.join(', ')}.`);
add('about', `About ${site.brand.name}`, '/about', `${site.about.body} Mission: ${site.about.mission} Values: ${site.about.values} ${site.whyUs.map((w) => `${w.title}: ${w.text}`).join(' ')}`);
add('documents', 'Documents checklist', '/programmes', `Typical documents for a China application: ${site.documentChecklist.general.join('; ')}.`);
add('contact', `Contact ${site.brand.name}`, '/contact',
  `WhatsApp and phone: ${site.contact.phoneDisplay}. ${site.contact.email ? `Email: ${site.contact.email}. ` : ''}${site.contact.responsePromise} ${site.contact.hours}. ` +
  `Office: ${site.contact.offices[0].city}, ${site.contact.offices[0].country} (visits by appointment - message on WhatsApp first). Counselling is free.`);

const cc = tools.costCalculator;
const tierLine = (t) => `${t}: lean ${n(cc.livingMonthlyCNY[t].lean)}, standard ${n(cc.livingMonthlyCNY[t].standard)}, comfortable ${n(cc.livingMonthlyCNY[t].comfortable)} CNY per month`;
add('costs-living', 'Living costs in China by city tier', '/tools/cost-calculator',
  `Typical student living costs (excluding tuition) - ${['tier1', 'tier2', 'tier3'].map(tierLine).join('; ')}. ` +
  `Tier-1 cities: ${cc.cityTiers.tier1.join(', ')}. Tier-2: ${cc.cityTiers.tier2.join(', ')}. Tier-3: ${cc.cityTiers.tier3.join(', ')}. ${site.disclaimers.costEstimate}`);
add('costs-accommodation', 'Accommodation and fixed fees', '/tools/cost-calculator',
  `Monthly accommodation - shared dorm: ${Object.entries(cc.accommodationMonthlyCNY.sharedDorm).map(([t, v]) => `${t} ${n(v)} CNY`).join(', ')}; single dorm: ` +
  `${Object.entries(cc.accommodationMonthlyCNY.singleDorm).map(([t, v]) => `${t} ${n(v)} CNY`).join(', ')}; off-campus shared flat: ` +
  `${Object.entries(cc.accommodationMonthlyCNY.offCampusShared).map(([t, v]) => `${t} ${n(v)} CNY`).join(', ')}. ` +
  `Fixed fees: insurance about ${n(cc.fixedFeesCNY.insurancePerYear)} CNY per year, residence permit about ${n(cc.fixedFeesCNY.residencePermitPerYear)} CNY per year, ` +
  `medical check about ${n(cc.fixedFeesCNY.medicalCheckFirstYear)} CNY and registration about ${n(cc.fixedFeesCNY.registrationFirstYear)} CNY in the first year, ` +
  `application fee about ${n(cc.fixedFeesCNY.applicationFeeOnce)} CNY once. Scholarship scenarios in the calculator: ${cc.scholarshipScenarios.map((s) => s.label).join('; ')}.`);
const el = tools.eligibilityChecker;
add('eligibility', 'Scholarship eligibility basics', '/tools/eligibility-checker',
  `Academic requirement by level - ${Object.entries(el.levels).map(([k, v]) => `${LEVEL[k] ?? k}: ${v}`).join('; ')}. ` +
  `Marks guide: ${el.scoreBands.map((b) => `${b.minPercent}%+ ${b.band}: ${b.text}`).join(' ')} ${el.disclaimer ?? site.disclaimers.eligibility}`);
add('disclaimers', 'Important notes', '/terms', Object.values(site.disclaimers).join(' '));

// Blog: the published article text (from the build), otherwise the original posts
const blogDir = path.join(root, '.next/server/app/blog');
let blogSource = 'site.json blogSeeds';
if (fs.existsSync(blogDir)) {
  blogSource = '.next/server/app/blog/*.html';
  for (const f of fs.readdirSync(blogDir).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(blogDir, f), 'utf8');
    const title = (html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? f).replace(/<[^>]+>/g, '').trim();
    const article = html.match(/<article[^>]*>(.*?)<\/article>/s)?.[1] ?? '';
    const slug = f.replace(/\.html$/, '');
    const parts = article.split(/<h2[^>]*>/);
    parts.forEach((part, i) => {
      const heading = i === 0 ? 'Introduction' : part.split(/<\/h2>/)[0].replace(/<[^>]+>/g, '').trim();
      const text = part.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
      if (text.length > 60) add(`blog-${slug}-${i}`, `${title} - ${heading}`, `/blog/${slug}`, `${title}. ${text}`.slice(0, 2400));
    });
  }
} else {
  for (const b of site.blogSeeds) add(`blog-${b.slug}`, b.title, `/blog/${b.slug}`, `${b.title}. ${(b.body || []).join(' ')}`);
}

/* ---------- embeddings ---------- */
loadEnv();
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('GEMINI_API_KEY missing (put it in .env.local)');

// Free tier: 100 embedding requests per minute (each chunk counts), so batches of 80 and a wait on 429
async function embedBatch(batch, attempt = 0) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      requests: batch.map((c) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: `${c.title}\n${c.text}` }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        title: c.title,
        outputDimensionality: DIMS,
      })),
    }),
  });
  const j = await res.json();
  if (res.status === 429 && attempt < 5) {
    const wait = Number(j.error?.message?.match(/retry in ([\d.]+)s/)?.[1] ?? 60) + 2;
    process.stdout.write(`
rate limited, waiting ${Math.round(wait)} s
`);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return embedBatch(batch, attempt + 1);
  }
  if (!res.ok) throw new Error(`embedding failed: ${res.status} ${j.error?.message}`);
  return j.embeddings.map((e) => e.values);
}

/** int8 quantisation: v_i ~ q_i * scale, plenty for cosine similarity */
function quantise(v) {
  const norm = Math.hypot(...v) || 1;
  const unit = v.map((x) => x / norm);
  const scale = Math.max(...unit.map(Math.abs)) / 127 || 1;
  const q = Int8Array.from(unit.map((x) => Math.round(x / scale)));
  return { scale: Number(scale.toPrecision(6)), b64: Buffer.from(q.buffer).toString('base64') };
}

const out = [];
console.log(`${chunks.length} chunks`);
for (let i = 0; i < chunks.length; i += 80) {
  const batch = chunks.slice(i, i + 80);
  const vectors = await embedBatch(batch);
  batch.forEach((c, k) => out.push({ ...c, vec: quantise(vectors[k]) }));
  process.stdout.write(`embedded ${out.length}/${chunks.length}\r`);
}

const index = { generated: new Date().toISOString().slice(0, 10), model: EMBED_MODEL, dims: DIMS, blogSource, chunks: out };
const file = path.join(root, 'src/data/rag-index.json');
fs.writeFileSync(file, JSON.stringify(index));
console.log(`\nwrote ${path.relative(root, file)}: ${out.length} chunks, ${Math.round(fs.statSync(file).size / 1024)} KB (blog from ${blogSource})`);
