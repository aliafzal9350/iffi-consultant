/**
 * The documents an application needs. Two sources, both IFFI's own:
 *  - the charges list ("Require Documents" per level): the baseline every programme gets;
 *  - the brochure's document list (Program.documents, free text): adds what that university asks for on top.
 * Each kind has the words students see, a numbered sample (components/portal/apply/DocSample.tsx draws it) and the
 * file types it accepts. No server-only imports: the uploader in the browser reads the limits from here.
 */
import type { Program } from '@/types/data';

export type DocKind =
  | 'passport'
  | 'photo'
  | 'application_form'
  | 'health_form'
  | 'education'
  | 'police'
  | 'bank'
  | 'english'
  | 'hsk'
  | 'study_plan'
  | 'personal_statement'
  | 'recommendation'
  | 'cv'
  | 'thesis'
  | 'publications'
  | 'video'
  | 'birth_certificate'
  | 'parent_documents'
  | 'study_gap'
  | 'extracurricular'
  | 'other'
  | 'payment_proof';

export type SampleKind = 'passport' | 'photo' | 'education' | 'police' | 'bank' | 'english' | 'application_form' | 'health_form' | 'letter' | 'recommendation' | 'cv' | 'video' | 'generic';

export const MB = 1024 * 1024;

export const FILE_TYPES = {
  docs: { mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], label: 'PDF, JPG or PNG', maxMB: 10 },
  image: { mime: ['image/jpeg', 'image/png', 'image/webp'], label: 'JPG or PNG', maxMB: 10 },
  video: { mime: ['video/mp4', 'video/quicktime', 'video/webm'], label: 'MP4 or MOV', maxMB: 50 },
} as const;
export type FileTypeKey = keyof typeof FILE_TYPES;

/** A downloadable form the student fills in (served by /portal/forms/[file]). */
export type TemplateKey = 'application_form' | 'health_form';
export const TEMPLATES: Record<TemplateKey, { file: string; label: string; format: string }> = {
  application_form: { file: 'iffi-application-form.docx', label: 'Blank form', format: 'Word' },
  health_form: { file: 'foreigner-physical-examination-form.pdf', label: 'Medical form', format: 'PDF' },
};

export interface DocSpec {
  title: string;
  /** what exactly to upload */
  what: string;
  /** numbered points; the sample drawing puts the same numbers on the picture */
  points: string[];
  avoid: string[];
  files: FileTypeKey;
  maxFiles: number;
  sample: SampleKind;
  template?: TemplateKey;
}

export const DOCS: Record<DocKind, DocSpec> = {
  passport: {
    title: 'Passport',
    what: 'A colour scan or photo of the page with your photo and details.',
    points: [
      'The photo page, not the cover.',
      'The expiry date is clear (at least 6 months left).',
      'The two lines of letters and < signs at the bottom are readable.',
      'All four corners are in the picture.',
    ],
    avoid: ['Glare from a lamp or flash', 'Fingers over the page', 'A black-and-white photocopy'],
    files: 'docs',
    maxFiles: 2,
    sample: 'passport',
  },
  photo: {
    title: 'Passport-size photo',
    what: 'A recent colour photo of your face on a plain white background.',
    points: [
      'Plain white background, no shadows.',
      'Face straight at the camera, both ears visible.',
      'Head and top of the shoulders fill most of the photo.',
      'China uses 33 × 48 mm photos: upload a sharp digital copy.',
    ],
    avoid: ['Selfies or cropped group photos', 'Glasses with glare, caps or filters', 'A photo older than six months'],
    files: 'image',
    maxFiles: 1,
    sample: 'photo',
  },
  application_form: {
    title: 'Application form (signed)',
    what: 'The application form, signed by you. Download it filled in from your answers, print it, sign it, then upload a scan.',
    points: ['Every box is filled in (your online answers do this for you).', 'Your signature and the date at the end: unsigned forms are invalid.', 'Upload every page, in order.'],
    avoid: ['An unsigned form', 'A different form from another agent'],
    files: 'docs',
    maxFiles: 3,
    sample: 'application_form',
    template: 'application_form',
  },
  health_form: {
    title: 'Medical examination form',
    what: "The Foreigner Physical Examination Form, filled in and stamped by a doctor, with the blood test and chest X-ray reports.",
    points: [
      'Your photo, stamped by the hospital over one corner.',
      'Every "Yes / No" question answered.',
      'Height, weight, blood pressure and each exam filled in by the doctor.',
      "The doctor's signature, the hospital stamp and the date.",
    ],
    avoid: ['A form you filled in yourself without a doctor', 'Missing blood test (HIV, syphilis) or chest X-ray reports'],
    files: 'docs',
    maxFiles: 6,
    sample: 'health_form',
    template: 'health_form',
  },
  education: {
    title: 'Education certificates and transcripts',
    what: 'Your certificates (degrees) and transcripts (mark sheets), from high school onwards.',
    points: ['The certificate or degree.', 'The transcript with every subject and mark.', 'Stamps and signatures are visible.', 'Every page, front and back if printed on both sides.'],
    avoid: ['Only the result card from a website', 'Cut-off edges'],
    files: 'docs',
    maxFiles: 10,
    sample: 'education',
  },
  police: {
    title: 'Police clearance certificate',
    what: 'A police character certificate (non-criminal record) from your country.',
    points: ['Issued in your name, matching your passport.', 'The official stamp and signature.', 'The issue date: ask IFFI if yours is older than six months.'],
    avoid: ['An application receipt instead of the certificate'],
    files: 'docs',
    maxFiles: 2,
    sample: 'police',
  },
  bank: {
    title: 'Bank statement',
    what: "A recent statement from your or your guarantor's bank account. An e-statement is fine.",
    points: ["The account holder's name.", 'The bank name or logo.', 'The statement dates.', 'The closing balance.'],
    avoid: ['A screenshot of a banking app without the account holder name'],
    files: 'docs',
    maxFiles: 3,
    sample: 'bank',
  },
  english: {
    title: 'English certificate',
    what: 'IELTS, TOEFL, Duolingo or PTE results, or a letter from your school or university saying you were taught in English.',
    points: ['Your name as in your passport.', 'The overall score (or the medium-of-instruction sentence).', 'The test date or letter date.'],
    avoid: ['A booking confirmation instead of the result'],
    files: 'docs',
    maxFiles: 2,
    sample: 'english',
  },
  hsk: {
    title: 'Chinese certificate (HSK)',
    what: 'Your HSK score report (and HSKK, if you took it).',
    points: ['Your name as in your passport.', 'The HSK level and total score.', 'The test date.'],
    avoid: ['A screenshot without your name'],
    files: 'docs',
    maxFiles: 2,
    sample: 'english',
  },
  study_plan: {
    title: 'Study plan or research proposal',
    what: 'One to two pages: what you want to study or research in China, why, and what you will do after.',
    points: ['A clear title and your name.', 'Your background and research interest.', 'Your plan for each year and your goals after graduating.'],
    avoid: ['Text copied from the internet: universities check'],
    files: 'docs',
    maxFiles: 1,
    sample: 'letter',
  },
  personal_statement: {
    title: 'Personal statement',
    what: 'One page about you: why this programme, why China, and your goals.',
    points: ['Your name at the top.', 'Why you chose this programme.', 'Your goals after graduating.'],
    avoid: ['A generic letter written for another university'],
    files: 'docs',
    maxFiles: 1,
    sample: 'letter',
  },
  recommendation: {
    title: 'Recommendation letters',
    what: 'Two letters from professors or associate professors who taught or supervised you.',
    points: ["On the university's letterhead.", 'Says how they know you and why they recommend you.', 'Signed, with their title, phone and email.'],
    avoid: ['Letters you wrote yourself', 'Unsigned letters'],
    files: 'docs',
    maxFiles: 3,
    sample: 'recommendation',
  },
  cv: {
    title: 'CV / résumé',
    what: 'One or two pages: your education, work, research and skills.',
    points: ['Your name and contact details.', 'Education and work, newest first.', 'Research, publications or projects if you have them.'],
    avoid: ['A CV that is out of date'],
    files: 'docs',
    maxFiles: 1,
    sample: 'cv',
  },
  thesis: {
    title: 'Thesis or final-year project',
    what: 'Your last thesis or final-year project report (the first pages and abstract are enough if it is long).',
    points: ['The title page.', 'The abstract.', "Your supervisor's name."],
    avoid: [],
    files: 'docs',
    maxFiles: 2,
    sample: 'letter',
  },
  publications: {
    title: 'Publications and research work',
    what: 'Papers you published (first page of each) or a list of your research work.',
    points: ['The title and journal or conference.', 'Your name among the authors.', 'The year.'],
    avoid: [],
    files: 'docs',
    maxFiles: 5,
    sample: 'letter',
  },
  video: {
    title: 'Self-introduction video',
    what: 'A short video introducing yourself in English, about 3 to 4 minutes.',
    points: ['Your face clearly visible, in a quiet, bright place.', 'Your name, education and why you chose this programme.', 'About 3 to 4 minutes, MP4 under 50 MB.'],
    avoid: ['Background music or noise', 'Reading from a paper the whole time'],
    files: 'video',
    maxFiles: 1,
    sample: 'video',
  },
  birth_certificate: {
    title: 'Birth certificate',
    what: 'Your birth certificate (or your national birth registration record).',
    points: ['Your name and date of birth match your passport.', 'The official stamp.'],
    avoid: [],
    files: 'docs',
    maxFiles: 2,
    sample: 'generic',
  },
  parent_documents: {
    title: "Parents' ID and income",
    what: "Your parents' passports or national ID cards, and a job or income certificate.",
    points: ["Both sides of each parent's ID card.", 'A job or income certificate from the employer.'],
    avoid: [],
    files: 'docs',
    maxFiles: 6,
    sample: 'generic',
  },
  study_gap: {
    title: 'Study gap explanation',
    what: 'Only if you had a break in your studies: a letter explaining it, with proof (job letter, medical note, etc.).',
    points: ['The dates of the gap.', 'What you did during it, with proof.'],
    avoid: [],
    files: 'docs',
    maxFiles: 3,
    sample: 'letter',
  },
  extracurricular: {
    title: 'Awards and activities',
    what: 'Certificates for awards, competitions, sports or volunteering. Optional, but they help with scholarships.',
    points: ['Your name on each certificate.', 'The organiser and the date.'],
    avoid: [],
    files: 'docs',
    maxFiles: 6,
    sample: 'generic',
  },
  other: {
    title: 'Anything else',
    what: 'Any other document IFFI asks you for.',
    points: ['Write in the file name what it is.'],
    avoid: [],
    files: 'docs',
    maxFiles: 6,
    sample: 'generic',
  },
  payment_proof: {
    title: 'Payment screenshot',
    what: 'A screenshot or receipt of your payment.',
    points: ['The amount.', 'The transaction ID.', 'The date and time.'],
    avoid: [],
    files: 'docs',
    maxFiles: 1,
    sample: 'generic',
  },
};

export const isDocKind = (k: string): k is DocKind => Object.prototype.hasOwnProperty.call(DOCS, k);

export type Need = 'required' | 'recommended' | 'optional';

export interface DocRequirement {
  kind: DocKind;
  need: Need;
  /** what this programme's brochure says about it, when that adds something (a minimum balance, a score) */
  note?: string;
}

export type DocProgram = Pick<Program, 'level' | 'documents' | 'introVideoRequired' | 'languagePolicy' | 'bankStatementUSD' | 'teachingLanguages'>;

/** What to upload for the education documents, by level. */
export function educationWhat(level: string): string {
  if (level === 'PhD') return 'Master and Bachelor degrees with transcripts, plus your high school certificate and transcript.';
  if (level === 'Master') return 'Your Bachelor degree and transcript, plus your high school certificate and transcript.';
  return 'Your high school (Grade 12, FSc, A-Level or equivalent) certificate and transcript, and Grade 10 / Matric if you have it.';
}

/** The documents for one programme, required ones first. */
export function requiredDocuments(p: DocProgram): DocRequirement[] {
  const docs = p.documents ?? [];
  const find = (re: RegExp) => docs.find((d) => re.test(d));
  // a brochure line is worth showing when it adds a number or a condition to the plain name
  const detail = (re: RegExp) => {
    const line = find(re);
    return line && /\d|notari[sz]|embassy|original/i.test(line) ? line : undefined;
  };
  const graduate = p.level === 'Master' || p.level === 'PhD';
  const englishTaught = !p.teachingLanguages?.length || p.teachingLanguages.includes('English');

  const out: DocRequirement[] = [];
  const add = (kind: DocKind, need: Need, note?: string) => out.push({ kind, need, ...(note ? { note } : {}) });

  // the charges list: every level
  add('passport', 'required');
  add('photo', 'required');
  add('application_form', 'required');
  add('education', 'required', detail(/certificate|transcript|degree|diploma/i));
  add('health_form', 'required');
  add('police', 'required', detail(/police|criminal/i));
  add('bank', 'required', p.bankStatementUSD ? `This programme asks for a balance of at least USD ${p.bankStatementUSD.toLocaleString('en-US')}.` : 'No minimum balance unless IFFI tells you otherwise.');

  // English: Bachelor and above in the charges list; the brochure decides how strict
  const englishLine = detail(/english|ielts|toefl/i);
  if (p.level === 'Language' || !englishTaught) add('english', 'optional');
  else if (p.languagePolicy?.type === 'none' || p.languagePolicy?.type === 'internal-test') add('english', 'recommended', 'No IELTS needed for this programme, but an English-medium letter from your school helps.');
  else add('english', 'required', englishLine);

  if (p.languagePolicy?.type === 'hsk' || find(/\bhsk\b|chinese proficiency/i)) add('hsk', 'required', detail(/\bhsk\b|chinese proficiency/i));

  // Master and PhD (charges list), or when the brochure asks
  if (graduate || find(/study plan|research proposal/i)) add('study_plan', 'required');
  if (find(/personal statement/i)) add('personal_statement', 'required');
  if (find(/recommendation/i)) add('recommendation', 'required', detail(/recommendation/i));
  else if (graduate) add('recommendation', 'recommended');
  if (find(/curriculum vitae|resume|\bcv\b/i)) add('cv', 'required');
  else if (graduate) add('cv', 'recommended');
  if (p.level === 'PhD') add('thesis', 'required');
  else if (p.level === 'Master') add('thesis', 'recommended');
  if (p.level === 'PhD' || find(/publication|research work/i)) add('publications', 'recommended');
  if (p.introVideoRequired || find(/video/i)) add('video', 'required', detail(/video/i));
  if (find(/birth certificate/i)) add('birth_certificate', 'required');
  if (find(/parent/i)) add('parent_documents', 'required');
  add('study_gap', find(/study gap/i) ? 'recommended' : 'optional');
  add('extracurricular', 'optional');
  add('other', 'optional');

  const order: Record<Need, number> = { required: 0, recommended: 1, optional: 2 };
  return out.sort((a, b) => order[a.need] - order[b.need]);
}

// ------------------------------------------------------------------------------------ uploaded files, summarised

export type DocStatus = 'pending' | 'accepted' | 'rejected';

export interface UploadedDoc {
  id: string;
  kind: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: DocStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const DOC_COLUMNS = 'id, kind, file_name, mime_type, size_bytes, status, review_note, reviewed_at, created_at';

/** Where one document stands, from the student's side. Rejected files no longer count. */
export type DocState = 'missing' | 'uploaded' | 'accepted' | 'rejected';

export function docState(files: UploadedDoc[]): DocState {
  if (!files.length) return 'missing';
  if (files.some((f) => f.status === 'rejected') && !files.some((f) => f.status !== 'rejected')) return 'rejected';
  if (files.every((f) => f.status === 'accepted')) return 'accepted';
  return 'uploaded';
}

export interface DocSummary {
  requirements: DocRequirement[];
  byKind: Map<string, UploadedDoc[]>;
  /** required documents with no usable file yet (missing, or every file rejected) */
  missing: DocRequirement[];
  rejected: number;
  pending: number;
  accepted: number;
}

export function summariseDocs(requirements: DocRequirement[], files: UploadedDoc[]): DocSummary {
  const byKind = new Map<string, UploadedDoc[]>();
  for (const f of files) byKind.set(f.kind, [...(byKind.get(f.kind) ?? []), f]);
  const missing = requirements.filter((r) => r.need === 'required' && ['missing', 'rejected'].includes(docState(byKind.get(r.kind) ?? [])));
  const listed = files.filter((f) => f.kind !== 'payment_proof');
  return {
    requirements,
    byKind,
    missing,
    rejected: listed.filter((f) => f.status === 'rejected').length,
    pending: listed.filter((f) => f.status === 'pending').length,
    accepted: listed.filter((f) => f.status === 'accepted').length,
  };
}

/**
 * Which missing documents stop the student from signing and paying. The rest can follow later (IFFI then asks for
 * them before sending the application to the university).
 */
export function submissionBlockers(summary: DocSummary): DocRequirement[] {
  // Police clearance, medical examination form, and bank statements can take weeks to issue from local authorities.
  // Letting them follow later allows students to sign and begin processing promptly while core credentials (passport,
  // photo, education certificates) remain strictly required upfront.
  const canFollowLater = new Set<DocKind>(['police', 'health_form', 'bank']);
  return summary.missing.filter((req) => !canFollowLater.has(req.kind as DocKind));
}

export function fmtBytes(n: number): string {
  if (n >= MB) return `${(n / MB).toFixed(n >= 10 * MB ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
