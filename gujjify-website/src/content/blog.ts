/**
 * Blog articles. Slugs, dates and the original posts come from site.blogSeeds; the seeds were
 * 46-90 words each, so every article is expanded here around the keyword research.
 * Every number about programmes is computed from src/data, never typed in by hand.
 * Inline syntax in strings: [link text](/path) and **bold**.
 */
import { meta, programs, site, tools } from '@/data';
import { fmtNumber } from '@/lib/format';
import { hasStipend, isEnglishTaught } from '@/lib/programs';

export type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { note: string };

export type RelatedTool = 'finder' | 'cost' | 'eligibility';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  related: RelatedTool;
  body: Block[];
}

/* Figures used in the articles --------------------------------------------- */
const n = (x: number) => fmtNumber(x);
const count = meta.counts;
const cc = tools.costCalculator;
const byLevel = (l: string) => programs.filter((p) => p.level === l);
const bachelor = byLevel('Bachelor');
const fieldCount = (f: string) => programs.filter((p) => p.fields.includes(f)).length;
const majorCount = (re: RegExp) => programs.filter((p) => p.majors.some((m) => re.test(m))).length;
const stipends = (l: string) => byLevel(l).filter(hasStipend).map((p) => p.stipendCNYPerMonth!);
const bachelorStipends = stipends('Bachelor');
const masterMaxStipend = Math.max(...stipends('Master'));
const phdStipend = Math.max(...stipends('PhD'));
const noIelts = programs.filter((p) => p.noIeltsRequired).length;
const notStated = programs.filter((p) => p.languagePolicy.type === 'not-stated').length;
const englishBachelorEng = bachelor.filter((p) => p.fields.includes('Engineering & Technology') && isEnglishTaught(p)).length;
const top50 = programs.filter((p) => (p.ranking?.china ?? 999) <= 50).length;
const status985 = programs.filter((p) => p.status?.includes('985')).length;
const deadlineMonths = programs.reduce<Record<string, number>>((acc, p) => {
  if (p.typicalDeadlineMonth) acc[p.typicalDeadlineMonth] = (acc[p.typicalDeadlineMonth] ?? 0) + 1;
  return acc;
}, {});
const mayJune = (deadlineMonths.May ?? 0) + (deadlineMonths.June ?? 0);
const withDeadline = Object.values(deadlineMonths).reduce((a, b) => a + b, 0);
const bank5000 = programs.filter((p) => p.bankStatementUSD === 5000).length;
const bachelorTuition = cc.levelDefaults.Bachelor;
const mbbsTuition = cc.levelDefaults.MBBS;
const f = cc.fixedFeesCNY;
const pkr = (cny: number) => fmtNumber(Math.round((cny * (tools.currency.fallbackRates as Record<string, number>).PKR) / 1000) * 1000);
const tier2Year = cc.livingMonthlyCNY.tier2.standard * 12 + cc.accommodationMonthlyCNY.sharedDorm.tier2 * 12 + f.insurancePerYear + f.residencePermitPerYear;
const seed = (slug: string) => site.blogSeeds.find((b) => b.slug === slug)!;

const posts: Omit<BlogPost, 'date'>[] = [
  {
    slug: 'why-study-in-china-2026',
    title: 'Why Study in China in 2026? 7 Reasons Students Choose It',
    description: `Affordable tuition, scholarships that cover everything, ${n(count.englishTaught)} English-taught programmes in our list and safe modern campuses: seven reasons to study in China in 2026.`,
    related: 'finder',
    body: [
      { p: `${seed('why-study-in-china-2026').body[0].split('. ')[0]}. It also hosts one of the largest international student populations in the world. For students from Pakistan, South Asia, Africa and Central Asia it offers degrees from well-equipped universities at a fraction of Western prices, with generous scholarships on top.` },
      { p: 'Here are the seven reasons we hear most often from the students we counsel, backed by the programmes in our current list.' },
      { h2: '1. Tuition you can actually afford' },
      { p: `Across the Bachelor programmes in our list, standard tuition ranges from ${n(bachelorTuition.tuitionRangeCNY[0])} to ${n(bachelorTuition.tuitionRangeCNY[1])} CNY a year, with a median of about ${n(bachelorTuition.tuitionMedianCNY)} CNY. That is before any scholarship. Use the [cost calculator](/tools/cost-calculator) to see these numbers in your own currency.` },
      { h2: '2. Scholarships that cover tuition, housing and a stipend' },
      { p: `${n(count.tuitionFreeOption)} of our ${n(count.programmes)} programmes have a scholarship option that makes tuition free, and ${n(count.fullyFunded)} Master and PhD offers are fully funded: free tuition, a free dorm room and a monthly stipend of up to ${n(phdStipend)} CNY. Read our [guide to scholarships in China](/blog/top-scholarships-for-international-students-in-china) for the details.` },
      { h2: '3. You can study in English' },
      { p: `${n(count.englishTaught)} of the ${n(count.programmes)} programmes in our list are taught in English, including all six MBBS programmes. You do not need to speak Chinese to start, although learning some Mandarin makes daily life much easier.` },
      { h2: '4. Many routes without IELTS' },
      { p: `${n(noIelts)} programmes state clearly that no IELTS or Duolingo score is needed, and another ${n(notStated)} brochures do not mention a language test at all. Some universities run their own short online English test instead. Our [eligibility checker](/tools/eligibility-checker) shows which programmes fit your English level.` },
      { h2: '5. Modern campuses and strong science and engineering' },
      { p: `Chinese universities have invested heavily in laboratories, libraries and housing. Engineering and computing are particularly strong: ${n(fieldCount('Engineering & Technology'))} programmes in our list offer engineering majors and ${n(fieldCount('Computer Science & AI'))} offer computer science or AI.` },
      { h2: '6. Safe cities with large student communities' },
      { p: 'Students consistently describe Chinese cities as safe, with reliable public transport and welcoming international student offices. Most of our programmes are in affordable tier-2 cities in eastern China, such as Nanjing, Hangzhou and Wuhan, rather than the most expensive metropolises.' },
      { h2: '7. A degree that opens doors at home' },
      { p: 'Trade and investment between China and countries such as Pakistan keep growing. Graduates who understand Chinese business culture and speak some Mandarin have an edge with companies working on joint projects, including CPEC.' },
      { h2: 'Where to start' },
      { p: 'With the right guidance the application is simpler than most students expect. Browse the [programme finder](/programmes), check your chances with the [eligibility checker](/tools/eligibility-checker), then send us your marks on WhatsApp for a free assessment.' },
    ],
  },
  {
    slug: 'csc-scholarship-complete-guide',
    title: 'CSC Scholarship: A Complete Step-by-Step Guide',
    description: 'How the Chinese Government Scholarship (CSC) works: Type A and B, what it covers, eligibility, documents, agency numbers, deadlines and common mistakes.',
    related: 'eligibility',
    body: [
      { p: `${seed('csc-scholarship-complete-guide').body[0].split('. ').slice(0, 2).join('. ')}. It is competitive, so a complete, well-prepared file matters. This guide walks through how it works and how to prepare.` },
      { h2: 'What the CSC scholarship covers' },
      { p: 'A full CSC award usually covers tuition, on-campus accommodation, comprehensive medical insurance and a monthly living allowance. The allowance depends on your level. In our current list, fully funded Master offers pay up to ' + n(masterMaxStipend) + ' CNY a month and PhD offers ' + n(phdStipend) + ' CNY a month.' },
      { h2: 'Type A and Type B' },
      { ul: [
        '**Type A (bilateral programme):** you apply through the Chinese embassy or the education authority in your home country, which nominates candidates. Places per country are limited.',
        '**Type B (Chinese University Program):** you apply directly to a designated Chinese university, which selects and nominates you. This is the route most of our students use.',
      ] },
      { p: 'For Type B, the CSC online application asks for the **agency number** of the university you are applying to. Each university has its own number. Using the wrong one sends your file to the wrong place, so ask us for the correct agency number before you submit.' },
      { h2: 'Who is eligible' },
      { ul: [
        `Bachelor: ${tools.eligibilityChecker.levels.Bachelor}.`,
        `Master: ${tools.eligibilityChecker.levels.Master}.`,
        `PhD: ${tools.eligibilityChecker.levels.PhD}.`,
        'Good health and a clean police record.',
        'English (or Chinese) proficiency for the programme you choose. Many universities accept IELTS, TOEFL or Duolingo; some run their own test.',
      ] },
      { p: 'There is no single cut-off mark. Universities look at your whole file: grades, study plan, recommendation letters and timing. Try our [scholarship eligibility checker](/tools/eligibility-checker) to see where you stand.' },
      { h2: 'Documents you will need' },
      { ol: [
        'Passport valid for at least two more years',
        'Highest degree certificate and transcripts, attested',
        'Study plan or research proposal',
        'Two recommendation letters from professors (Master and PhD)',
        'Foreigner Physical Examination Form',
        'Police character certificate (non-criminal record)',
        'English or HSK certificate if you have one',
        'Pre-admission letter from the university, if it issues one',
      ] },
      { p: 'Our [document checklist](/tools/eligibility-checker) builds a personal list for your level.' },
      { h2: 'When to apply' },
      { p: `Scholarship applications for the September intake open several months in advance. In our current list, ${n(mayJune)} of the ${n(withDeadline)} programmes that state a deadline usually close in May or June, and CSC university quotas often fill earlier. Start preparing documents in the autumn before you want to travel.` },
      { h2: 'Mistakes that get applications rejected' },
      { ul: [
        'Applying in the last week, when quotas are already full',
        'A generic study plan that could be about any university',
        'Unattested or unclear scans of certificates',
        'Names spelled differently on the passport, certificates and forms',
        'The wrong agency number on a Type B application',
      ] },
      { note: 'CSC rules and quotas change every year. Check the details for your intake with us before you apply.' },
    ],
  },
  {
    slug: 'top-scholarships-for-international-students-in-china',
    title: 'Top Scholarships for International Students in China',
    description: `CSC, provincial, university and Belt and Road scholarships in China explained, with real figures: ${n(count.fullyFunded)} fully funded offers and ${n(count.tuitionFreeOption)} tuition-free options in our list.`,
    related: 'eligibility',
    body: [
      { p: seed('top-scholarships-for-international-students-in-china').body[0].split(' IFFI Global Education Consultants helps')[0] },
      { h2: '1. Chinese Government Scholarship (CSC)' },
      { p: 'The best-known award, funded by the Chinese government. A full CSC scholarship covers tuition, accommodation, medical insurance and a monthly stipend. See our [complete CSC guide](/blog/csc-scholarship-complete-guide) for Type A and Type B.' },
      { h2: '2. Provincial government scholarships' },
      { p: 'Several provinces fund their own scholarships to attract international students. Programmes in our list mention, for example, a Guangdong Provincial Government Scholarship of 10,000 RMB a year and a Zhejiang Provincial Government Scholarship of 20,000 CNY a year.' },
      { h2: '3. University scholarships (Type A, B, C)' },
      { p: 'Most universities grade their own awards. A typical structure from our brochures:' },
      { ul: [
        '**Type A:** tuition free, often with free accommodation and sometimes a monthly stipend',
        '**Type B:** tuition free, accommodation paid by the student',
        '**Type C:** part of the tuition waived, for example 50%',
      ] },
      { p: `In our list, ${n(bachelorStipends.length)} Bachelor programmes include a monthly stipend of ${n(Math.min(...bachelorStipends))} to ${n(Math.max(...bachelorStipends))} CNY. The type you receive often depends on your marks and a short interview.` },
      { h2: '4. Belt and Road and city scholarships' },
      { p: 'Some universities run Belt and Road scholarships for students from partner countries, and some cities add their own awards for excellent students from the second year onwards.' },
      { h2: '5. Confucius Institute scholarships' },
      { p: 'Aimed at students of Chinese language and international Chinese education, from short courses to Master programmes. Useful if you want to build your HSK level first.' },
      { h2: 'How to improve your chances' },
      { ul: [
        'Apply early: many awards are given in order until the quota is used',
        'Choose universities where your profile is competitive, not only the most famous ones',
        'Write a specific study plan and ask professors who know you for recommendation letters',
        'Get your documents attested before the application opens',
      ] },
      { p: `Fully funded offers in our list: ${n(count.fullyFunded)}. Programmes with a tuition-free option: ${n(count.tuitionFreeOption)}. Filter them in the [programme finder](/programmes?funding=full) or check your profile with the [eligibility checker](/tools/eligibility-checker).` },
    ],
  },
  {
    slug: 'cost-of-studying-in-china',
    title: 'Cost of Studying in China: Tuition, Living & Budget',
    description: 'What it costs to study in China in 2026: tuition by level, hostel and living costs by city, fixed fees and a sample yearly budget in PKR.',
    related: 'cost',
    body: [
      { p: seed('cost-of-studying-in-china').body[0] },
      { h2: 'Tuition by level' },
      { table: {
        head: ['Level', 'Tuition per year (before scholarship)', 'In our list'],
        rows: [
          ['Bachelor', `${n(bachelorTuition.tuitionRangeCNY[0])} to ${n(bachelorTuition.tuitionRangeCNY[1])} CNY (median ${n(bachelorTuition.tuitionMedianCNY)})`, `${n(count.byLevel.Bachelor)} programmes`],
          ['MBBS', `${n(mbbsTuition.tuitionRangeCNY[0])} to ${n(mbbsTuition.tuitionRangeCNY[1])} CNY (median ${n(mbbsTuition.tuitionMedianCNY)})`, `${n(count.byLevel.MBBS)} programmes, 6 years`],
          ['Master', 'Fully funded offers: tuition free', `${n(count.byLevel.Master)} programmes`],
          ['PhD', 'Fully funded: tuition free', `${n(count.byLevel.PhD)} programmes`],
          ['Chinese language', `${n(cc.levelDefaults.Language.courseTotalCNY)} CNY for 6 months incl. hostel`, '1 course'],
        ],
      } },
      { h2: 'Fees everyone pays' },
      { ul: [
        `Medical insurance: about ${n(f.insurancePerYear)} CNY a year`,
        `Residence permit: about ${n(f.residencePermitPerYear)} CNY a year`,
        `First year only: medical check (about ${n(f.medicalCheckFirstYear)} CNY), registration (about ${n(f.registrationFirstYear)} CNY) and sometimes an application fee (about ${n(f.applicationFeeOnce)} CNY)`,
      ] },
      { p: 'These are the most common figures in our programme brochures. Each university sets its own.' },
      { p: `Plan for proof of funds too: ${n(bank5000)} programmes in our list ask for a family bank statement showing USD 5,000 when you apply. It is money you show, not a fee you pay.` },
      { h2: 'Living costs by city' },
      { table: {
        head: ['City tier', 'Examples', 'Living per month', 'Shared dorm per month'],
        rows: (['tier1', 'tier2', 'tier3'] as const).map((t) => [
          t === 'tier1' ? 'Tier 1' : t === 'tier2' ? 'Tier 2' : 'Tier 3',
          cc.cityTiers[t].slice(0, 3).join(', '),
          `${n(cc.livingMonthlyCNY[t].lean)} to ${n(cc.livingMonthlyCNY[t].comfortable)} CNY`,
          `about ${n(cc.accommodationMonthlyCNY.sharedDorm[t])} CNY`,
        ]),
      } },
      { p: 'Living covers food, transport, phone and personal costs. Canteen meals keep the lean budget realistic; eating out and travel push it towards the comfortable figure.' },
      { h2: 'A sample year in a tier-2 city' },
      { p: `A self-funded Bachelor student in a city such as Nanjing or Wuhan, living in a shared dorm on a standard budget, spends roughly **${n(tier2Year)} CNY a year** on rent, living, insurance and the residence permit, which is about ${pkr(tier2Year)} PKR at recent exchange rates. Tuition comes on top, unless a scholarship covers it.` },
      { h2: 'How scholarships change the picture' },
      { p: `With a tuition-free scholarship, your main costs are living and housing. With a fully funded offer, housing is free too and the stipend (up to ${n(phdStipend)} CNY a month for PhD students in our list) can cover most living costs.` },
      { note: 'Run your own numbers in the [study cost calculator](/tools/cost-calculator): it converts every figure into PKR, BDT, INR, NGN and 40 other currencies.' },
    ],
  },
  {
    slug: 'study-engineering-in-china-guide',
    title: 'Study Engineering in China: Everything You Need to Know',
    description: `Engineering degrees in China in English: ${n(fieldCount('Engineering & Technology'))} programmes in our list, the most common majors, costs, scholarships and how to apply from Pakistan.`,
    related: 'finder',
    body: [
      { p: seed('study-engineering-in-china-guide').body.join(' ') },
      { h2: 'Engineering majors you can choose' },
      { p: `In our current list, ${n(fieldCount('Engineering & Technology'))} programmes offer at least one engineering major, and ${n(englishBachelorEng)} of them are English-taught Bachelor programmes. The majors that appear most often:` },
      { ul: [
        `Mechanical engineering and automation (${n(majorCount(/mechanical/i))} programmes)`,
        `Civil engineering (${n(majorCount(/civil eng/i))} programmes)`,
        `Electrical engineering (${n(majorCount(/electrical/i))} programmes)`,
        `Software engineering (${n(majorCount(/software/i))} programmes)`,
        `Computer science (${n(majorCount(/computer science/i))} programmes)`,
      ] },
      { p: 'You will also find chemical, materials, environmental, telecommunications and transport engineering, especially at Master level.' },
      { h2: 'Why engineers choose China' },
      { ul: [
        'Large, modern laboratories and close links between universities and industry',
        'English-taught Bachelor programmes with scholarships that cut or remove tuition',
        'Fully funded Master and PhD offers in engineering fields',
        'Experience that counts with Chinese companies working abroad, including CPEC projects in Pakistan',
      ] },
      { h2: 'What it costs' },
      { p: `Bachelor tuition in our list has a median of about ${n(bachelorTuition.tuitionMedianCNY)} CNY a year before scholarships. Many engineering programmes offer Type A or Type B scholarships that make tuition free. Estimate your total with the [cost calculator](/tools/cost-calculator).` },
      { h2: 'Entry requirements' },
      { ul: [
        `Bachelor: ${tools.eligibilityChecker.levels.Bachelor}, usually with mathematics and physics`,
        `Master: ${tools.eligibilityChecker.levels.Master} in a related field`,
        'English: some programmes ask for IELTS 5.5 to 6.0; several need no IELTS at all',
      ] },
      { p: 'Find engineering programmes in the [programme finder](/programmes?field=Engineering%20%26%20Technology), or ask us which ones fit your marks.' },
    ],
  },
  {
    slug: 'top-10-chinese-universities-for-international-students-2026',
    title: 'Choosing a Chinese University in 2026: 985, 211 and Rankings',
    description: 'What C9, 985, 211 and Double First-Class mean, how much rankings matter, and how to pick a Chinese university that fits your marks, budget and career.',
    related: 'finder',
    body: [
      { p: seed('top-10-chinese-universities-for-international-students-2026').body[0] },
      { p: 'The most famous names are also the hardest to get into and rarely the best value. This guide explains how to read Chinese university labels and rankings, so you can build a shortlist that fits you.' },
      { h2: 'What C9, 985, 211 and Double First-Class mean' },
      { ul: [
        '**Project 211:** a national programme from the 1990s that funded around a hundred leading universities.',
        '**Project 985:** a smaller group within the 211 universities, selected for extra funding to reach world level.',
        '**C9 League:** the nine leading 985 universities, often called China’s Ivy League.',
        '**Double First-Class:** the current national programme that replaced 211 and 985; it recognises whole universities and individual subjects.',
      ] },
      { p: `In our current list, ${n(status985)} programmes are at 985 universities and ${n(top50)} are at universities ranked in China’s top 50.` },
      { h2: 'How much rankings matter' },
      { p: 'Rankings help, but for most students three other things matter more: whether the programme is taught in English, whether a scholarship makes it affordable, and whether the city fits your budget. A tier-2 city university with a full scholarship often beats a famous name you have to pay for in full.' },
      { h2: 'A simple way to build your shortlist' },
      { ol: [
        'Pick your level and field, then filter by teaching language',
        'Keep programmes where your marks and English meet the requirements',
        'Compare scholarships and living costs by city',
        'Check the usual deadline month and the documents list',
        'Shortlist three to five, then ask us to confirm this year’s details',
      ] },
      { p: 'Our [university and programme finder](/programmes) does steps 1 to 4 for you and lets you save your shortlist as a PDF.' },
      { note: site.disclaimers.universityNames },
    ],
  },
  {
    slug: 'how-to-apply-for-chinese-student-visa-2026',
    title: 'How to Apply for a Chinese Student Visa in 2026',
    description: 'Step by step: from admission letter and JW202 to your X1 visa and residence permit. Documents, timing and common mistakes for students applying from Pakistan.',
    related: 'eligibility',
    body: [
      { p: seed('how-to-apply-for-chinese-student-visa-2026').body[0].split(' IFFI Global Education Consultants assists')[0] },
      { h2: 'Step 1: Receive your admission documents' },
      { p: 'After you accept your offer, the university sends your **admission letter** and a **visa application form for study in China**: the JW202 for self-funded and university-scholarship students, or the JW201 for Chinese Government Scholarship students. You need the original or the version your university confirms is acceptable.' },
      { h2: 'Step 2: Prepare your visa file' },
      { ul: [
        'Passport with at least six months of validity and blank pages',
        'Completed online visa application form and confirmation page',
        'Recent passport photo meeting the visa photo rules',
        'Admission letter and JW201 or JW202',
        'Foreigner Physical Examination Form (for X1, study longer than 180 days)',
        'Any extra documents your consulate asks for, such as a police certificate',
      ] },
      { h2: 'Step 3: Submit and collect' },
      { p: 'Submit your file at the Chinese embassy, consulate or visa application service centre that covers your area, and pay the visa fee. Processing usually takes several working days; apply as soon as your documents arrive so you are not rushing before term starts.' },
      { h2: 'Step 4: After you arrive in China' },
      { p: 'An X1 visa lets you enter China. Within 30 days of arrival you apply for a student **residence permit** at the local exit and entry administration, usually with help from your university’s international office. You will often repeat the medical check locally.' },
      { h2: 'X1 or X2?' },
      { p: 'X1 is for study longer than 180 days, which covers degree programmes. X2 is for shorter study such as a one-semester language course. Read [X1 vs X2: what you must know](/blog/china-student-visa-x1-x2) for the differences.' },
      { h2: 'Common mistakes' },
      { ul: [
        'Booking flights before the visa is issued',
        'A medical form that is incomplete or missing the doctor’s stamp',
        'Names that do not match exactly across passport, JW form and admission letter',
        'Leaving the residence permit until after the 30-day window',
      ] },
      { note: 'Visa rules can change. We check your file against the current requirements before you submit.' },
    ],
  },
  {
    slug: 'china-student-visa-x1-x2',
    title: 'Student Visa for China (X1 vs X2): What You Must Know',
    description: 'The difference between China’s X1 and X2 student visas, who needs which, the documents for each and what to do in your first 30 days in China.',
    related: 'eligibility',
    body: [
      { p: seed('china-student-visa-x1-x2').body[0].replace(' IFFI Global Education Consultants prepares your complete visa file so the process is smooth.', '') },
      { h2: 'X1 and X2 at a glance' },
      { table: {
        head: ['', 'X1 visa', 'X2 visa'],
        rows: [
          ['Study length', 'More than 180 days', '180 days or less'],
          ['Typical use', 'Bachelor, MBBS, Master, PhD, long language programmes', 'Short language courses, exchange semesters'],
          ['Medical form', 'Foreigner Physical Examination Form required', 'Usually not required'],
          ['After arrival', 'Apply for a residence permit within 30 days', 'Stay within the dates on the visa'],
        ],
      } },
      { h2: 'Documents for both' },
      { ul: [
        'Valid passport and visa application form',
        'Admission letter from the university',
        'JW201 (Chinese Government Scholarship) or JW202 (self-funded and other scholarships)',
        'Passport photos',
      ] },
      { h2: 'The residence permit' },
      { p: 'The X1 visa itself is normally valid for a single entry. The residence permit you get in China is what lets you stay for your whole programme and travel in and out. Keep your passport, admission letter and medical documents ready for the appointment.' },
      { h2: 'Can I work on a student visa?' },
      { p: 'A student visa or residence permit does not give you the right to work. Part-time work and internships need permission from your university and the local authorities. Plan your budget on the assumption that you will not earn in China; our [cost calculator](/tools/cost-calculator) helps.' },
      { p: 'Ready to apply for admission first? Check which programmes you qualify for with the [eligibility checker](/tools/eligibility-checker).' },
    ],
  },
  {
    slug: 'why-choose-iffi-global-for-study-in-china',
    title: 'Why Choose IFFI Global Education Consultants for Study in China?',
    description: 'How IFFI Global Education Consultants helps students from Pakistan and worldwide with Chinese university admission, CSC scholarships, X1 visas and pre-departure.',
    related: 'eligibility',
    body: [
      { p: seed('why-choose-iffi-global-for-study-in-china').body[0].split(' With years of experience')[0] },
      { h2: 'Real programmes, shown openly' },
      { p: `Our [programme finder](/programmes) shows ${n(count.programmes)} programmes in ${n(count.provinces)} provinces with their fees, scholarships, language rules and documents, before you ever talk to us. ${site.disclaimers.universityNames}` },
      { h2: 'Honest advice' },
      { p: site.about.values },
      { h2: 'Everything in one place' },
      { ul: site.services.map((s) => `**${s.title}:** ${s.summary}`) },
      { h2: 'Fast answers on WhatsApp' },
      { p: `${site.contact.responsePromise} You can also call ${site.contact.phoneDisplay} or email ${site.contact.email}.` },
      { h2: 'A registered company' },
      { p: `${site.legal.footerDisclosure} Students in Pakistan can also meet us in Lahore.` },
      { p: 'Start with a free eligibility check: [answer seven questions](/tools/eligibility-checker) and send us your results.' },
    ],
  },
];

export const BLOG_POSTS: BlogPost[] = posts
  .map((p) => ({ ...p, date: seed(p.slug).date }))
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

export const postBySlug = new Map(BLOG_POSTS.map((p) => [p.slug, p]));

export function wordCount(post: BlogPost): number {
  const text = post.body
    .map((b) => ('p' in b ? b.p : 'h2' in b ? b.h2 : 'h3' in b ? b.h3 : 'note' in b ? b.note : 'ul' in b ? b.ul.join(' ') : 'ol' in b ? b.ol.join(' ') : b.table.rows.flat().join(' ')))
    .join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(post: BlogPost): number {
  return Math.max(2, Math.round(wordCount(post) / 200));
}
