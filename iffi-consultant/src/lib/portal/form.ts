/**
 * The application form: IFFI's "Application Form for Foreign Students" (外国留学生入学申请表) written as data.
 * One schema drives the student's form, the server's checks before saving, the staff view and the printable form.
 * No server-only imports: the form component in the browser uses this file too.
 *
 * Every value is a string ('' = empty, checkboxes 'yes' | ''), and repeatable rows are arrays of strings, so the
 * server can sanitise anything the browser sends by keeping only the known fields.
 */
import { CURRENCIES } from '@/lib/currency';
import { ENGLISH_TESTS } from './quiz';
import type { FormSectionKey } from './application';

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'month' | 'number' | 'select' | 'radio' | 'textarea' | 'checkbox';

export interface Option {
  value: string;
  label: string;
}

/** What the form needs to know about the programme, worked out on the server and passed to the browser. */
export interface FormContext {
  level: string; // Bachelor | MBBS | Master | PhD | Language
  majors: string[];
  teaching: string[];
  /** e.g. "September 2025" from the brochure */
  intake: string | null;
  duration: string | null;
}

export type Row = Record<string, string>;
export type SectionValues = Record<string, string | Row[]>;

type When = (v: SectionValues, ctx: FormContext) => boolean;

export interface FieldDef {
  name: string;
  label: string;
  /** the label on the official Chinese form, shown small and on the printable form */
  zh?: string;
  type: FieldType;
  required?: boolean | When;
  /** an empty list turns a select into a text box */
  options?: Option[] | ((ctx: FormContext) => Option[]);
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  width?: 'full' | 'half' | 'third';
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal';
  /** UPPER CASE as typed (passport numbers) */
  upper?: boolean;
  /** suggestions while typing (a datalist) */
  suggest?: 'countries';
  showIf?: When;
  check?: (value: string, v: SectionValues, ctx: FormContext) => string | null;
}

export interface GroupDef {
  name: string;
  label: string;
  zh?: string;
  hint?: string | ((ctx: FormContext) => string);
  fields: FieldDef[];
  min: (ctx: FormContext) => number;
  max: number;
  addLabel: string;
  /** "School 2", "Job 1" */
  itemLabel: string;
}

export interface BlockDef {
  title?: string;
  zh?: string;
  hint?: string;
  fields?: FieldDef[];
  group?: GroupDef;
  /** a read-only note instead of fields */
  note?: 'iffi-reference';
}

export interface SectionDef {
  key: FormSectionKey;
  title: string;
  zh: string;
  lede: string;
  blocks: BlockDef[];
}

// ---------------------------------------------------------------------------------------------------- options

export const COUNTRY_NAMES = CURRENCIES.filter((c) => c.countryCode !== 'EU')
  .map((c) => c.country)
  .sort((a, b) => a.localeCompare(b));
export const countryName = (code: string) => CURRENCIES.find((c) => c.countryCode === code)?.country ?? '';

const GENDER: Option[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];
const MARITAL: Option[] = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];
const HEALTH: Option[] = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'condition', label: 'I have a health condition' },
];
const DIPLOMA: Option[] = [
  { value: 'high_school', label: 'High school (Grade 12, FSc, A-Level)' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'Doctorate (PhD)' },
];
const ENGLISH: Option[] = [
  ...ENGLISH_TESTS.map((t) => ({ value: t.id, label: t.id === 'moi' ? 'English-medium letter from my school' : t.label })),
  { value: 'none', label: 'No English test' },
];
const HSK: Option[] = [{ value: '0', label: 'No HSK' }, ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `HSK ${n}` }))];
const HSKK: Option[] = [
  { value: 'none', label: 'No HSKK' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const FUNDING: Option[] = [
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'self', label: 'Self-support (my family pays)' },
  { value: 'other', label: 'Other' },
];
const GUARANTOR: Option[] = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'self', label: 'Myself' },
  { value: 'relative', label: 'Another relative' },
  { value: 'sponsor', label: 'A sponsor or organisation' },
];

export const DEGREE_LABEL: Record<string, string> = {
  Bachelor: "Bachelor's degree",
  MBBS: 'Bachelor of Medicine (MBBS)',
  Master: "Master's degree",
  PhD: 'Doctoral degree (PhD)',
  Language: 'Non-degree (Chinese language course)',
};

export const OTHER = '__other';

// ------------------------------------------------------------------------------------------------- checks

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9][0-9\s\-()]{6,19}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(v: string): Date | null {
  if (!DAY.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageOn(v: string): number | null {
  const d = parseDay(v);
  if (!d) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

const email = (v: string) => (EMAIL.test(v) ? null : 'Enter a valid email address.');
const phone = (v: string) => (PHONE.test(v) ? null : 'Enter the number with the country code, for example +92 300 1234567.');
const month = (v: string) => (MONTH.test(v) ? null : 'Pick the month and year.');
const noPoBox = (v: string) => (/\bp\.?\s*o\.?\s*box\b/i.test(v) ? 'Write a street address: universities cannot post to a P.O. box.' : null);

/** Months a passport must still be valid on the day it is checked (Chinese visas need at least six). */
export const PASSPORT_MIN_MONTHS = 6;

export function passportProblem(expiry: string, today = new Date()): string | null {
  const d = parseDay(expiry);
  if (!d) return 'Enter the expiry date from your passport.';
  const limit = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + PASSPORT_MIN_MONTHS, today.getUTCDate()));
  if (d <= today) return 'This passport has expired. Renew it first: universities and the visa office need a valid passport.';
  if (d < limit) return `Your passport expires within ${PASSPORT_MIN_MONTHS} months. Renew it before applying: the Chinese visa needs more time on it.`;
  return null;
}

// --------------------------------------------------------------------------------------------- the sections

const notLate = (prefix: 'father' | 'mother'): When => (v) => v[`${prefix}Late`] !== 'yes';

function parentFields(prefix: 'father' | 'mother', label: string, zh: string): FieldDef[] {
  const show = notLate(prefix);
  return [
    { name: `${prefix}Late`, label: `My ${label.toLowerCase()} has passed away`, type: 'checkbox' },
    { name: `${prefix}Name`, label: `${label}'s full name`, zh: `${zh} 姓名`, type: 'text', required: show, showIf: show, maxLength: 100, width: 'half', autoComplete: 'off' },
    { name: `${prefix}Age`, label: 'Age', type: 'number', required: show, showIf: show, width: 'third', inputMode: 'numeric', check: (v) => (/^\d{2,3}$/.test(v) && +v >= 25 && +v <= 110 ? null : 'Enter their age in years.') },
    { name: `${prefix}Occupation`, label: 'Occupation', zh: '职业', type: 'text', required: show, showIf: show, maxLength: 100, width: 'half' },
    { name: `${prefix}Phone`, label: 'Phone', zh: '电话', type: 'tel', required: show, showIf: show, width: 'half', inputMode: 'tel', check: phone },
    { name: `${prefix}Email`, label: 'Email', zh: '邮箱', type: 'email', showIf: show, width: 'half', inputMode: 'email', check: email, hint: 'Optional.' },
  ];
}

function addressFields(prefix: 'present' | 'permanent', when?: When): FieldDef[] {
  const req: boolean | When = when ?? true;
  return [
    { name: `${prefix}Country`, label: 'Country', type: 'text', suggest: 'countries', required: req, showIf: when, width: 'third', maxLength: 60, autoComplete: 'country-name' },
    { name: `${prefix}City`, label: 'City', type: 'text', required: req, showIf: when, width: 'third', maxLength: 60, autoComplete: 'address-level2' },
    { name: `${prefix}Postcode`, label: 'Postcode', type: 'text', showIf: when, width: 'third', maxLength: 12, autoComplete: 'postal-code', hint: 'Leave empty if there is none.' },
    {
      name: `${prefix}Detail`,
      label: 'Full address',
      zh: '详细地址',
      type: 'textarea',
      required: req,
      showIf: when,
      maxLength: 300,
      placeholder: 'House number, street, area or district',
      hint: 'Not a P.O. box.',
      autoComplete: 'street-address',
      check: noPoBox,
    },
  ];
}

export const SECTIONS: Record<FormSectionKey, SectionDef> = {
  personal: {
    key: 'personal',
    title: 'About you',
    zh: '申请人信息',
    lede: 'Write your name exactly as it is printed in your passport. The university copies it onto your admission letter and visa form.',
    blocks: [
      {
        title: 'Name as in your passport',
        zh: '护照姓名',
        fields: [
          { name: 'surname', label: 'Surname (family name)', zh: '姓 Surname', type: 'text', maxLength: 60, width: 'half', upper: true, autoComplete: 'family-name', hint: 'Leave empty only if your passport shows no surname.' },
          { name: 'givenName', label: 'Given names', zh: '名 Given name', type: 'text', required: true, maxLength: 80, width: 'half', upper: true, autoComplete: 'given-name' },
          {
            name: 'chineseName',
            label: 'Chinese name',
            zh: '中文姓名',
            type: 'text',
            maxLength: 6,
            width: 'half',
            hint: 'Optional, up to 6 Chinese characters. Leave empty if you do not have one.',
            check: (v) => (/^[\u3400-\u9FFF]{1,6}$/.test(v) ? null : 'Use Chinese characters only (up to 6), or leave it empty.'),
          },
        ],
      },
      {
        title: 'Birth and nationality',
        fields: [
          { name: 'gender', label: 'Gender', zh: '性别', type: 'radio', options: GENDER, required: true },
          {
            name: 'dateOfBirth',
            label: 'Date of birth',
            zh: '出生日期',
            type: 'date',
            required: true,
            width: 'half',
            autoComplete: 'bday',
            check: (v) => {
              const age = ageOn(v);
              return age != null && age >= 14 && age <= 65 ? null : 'Enter your date of birth as in your passport.';
            },
          },
          { name: 'placeOfBirth', label: 'Place of birth', zh: '出生地点', type: 'text', required: true, maxLength: 80, width: 'half', placeholder: 'City, country' },
          { name: 'nationality', label: 'Nationality', zh: '国籍', type: 'text', suggest: 'countries', required: true, maxLength: 60, width: 'half' },
          { name: 'nativeLanguage', label: 'Native language', zh: '母语', type: 'text', required: true, maxLength: 40, width: 'half', placeholder: 'For example Urdu' },
          { name: 'maritalStatus', label: 'Marital status', zh: '婚否', type: 'select', options: MARITAL, required: true, width: 'half' },
          { name: 'religion', label: 'Religion', zh: '宗教', type: 'text', maxLength: 40, width: 'half', hint: 'Optional.' },
          { name: 'healthStatus', label: 'Health', zh: '健康状况', type: 'select', options: HEALTH, required: true, width: 'half' },
          {
            name: 'healthNote',
            label: 'Tell us about the condition',
            type: 'textarea',
            maxLength: 500,
            required: (v) => v.healthStatus === 'condition',
            showIf: (v) => v.healthStatus === 'condition',
            hint: 'Only IFFI and the university see this. It helps them arrange support.',
          },
          { name: 'hobbies', label: 'Hobbies', zh: '爱好', type: 'text', maxLength: 120, hint: 'Optional.' },
        ],
      },
      {
        title: 'Passport',
        fields: [
          {
            name: 'passportNumber',
            label: 'Passport number',
            zh: '护照号码',
            type: 'text',
            required: true,
            maxLength: 15,
            width: 'half',
            upper: true,
            autoComplete: 'off',
            check: (v) => (/^[A-Z0-9]{5,15}$/.test(v.replace(/\s/g, '')) ? null : 'Use the letters and numbers exactly as in your passport.'),
          },
          {
            name: 'passportExpiry',
            label: 'Passport valid until',
            zh: '护照有效期',
            type: 'date',
            required: true,
            width: 'half',
            hint: `It must be valid for at least ${PASSPORT_MIN_MONTHS} more months.`,
            check: (v) => passportProblem(v),
          },
        ],
      },
      {
        title: 'What you do now',
        fields: [
          { name: 'highestDiploma', label: 'Highest qualification', zh: '最高学历', type: 'select', options: DIPLOMA, required: true, width: 'half' },
          { name: 'occupation', label: 'Occupation', zh: '职业', type: 'text', required: true, maxLength: 80, width: 'half', placeholder: 'Student' },
          { name: 'institution', label: 'School, university or employer', zh: '工作或学习单位', type: 'text', maxLength: 120, hint: 'Where you study or work now. Optional.' },
        ],
      },
    ],
  },

  contact: {
    key: 'contact',
    title: 'Contact and address',
    zh: '联系方式',
    lede: 'The university posts your admission letter (and JW202) to your present address, so write it the way a courier would need it.',
    blocks: [
      {
        title: 'How to reach you',
        fields: [
          { name: 'mobile', label: 'Mobile (WhatsApp)', zh: '手机', type: 'tel', required: true, width: 'half', inputMode: 'tel', autoComplete: 'tel', check: phone },
          { name: 'telephone', label: 'Other phone', zh: '电话', type: 'tel', width: 'half', inputMode: 'tel', check: phone, hint: 'Optional.' },
          { name: 'email', label: 'Email', zh: '电子邮件', type: 'email', required: true, inputMode: 'email', autoComplete: 'email', check: email },
        ],
      },
      {
        title: 'Present address (where the admission letter is posted)',
        zh: '联系地址（录取通知书邮寄地址）',
        fields: [
          ...addressFields('present'),
          { name: 'presentContact', label: 'Who receives the post there', type: 'text', maxLength: 80, hint: 'Optional: only if it is not you, for example your father.' },
        ],
      },
      {
        title: 'Permanent home address',
        zh: '永久居住地址',
        fields: [
          { name: 'permanentSame', label: 'Same as my present address', type: 'checkbox' },
          ...addressFields('permanent', (v) => v.permanentSame !== 'yes'),
        ],
      },
    ],
  },

  education: {
    key: 'education',
    title: 'Education and languages',
    zh: '教育背景与语言能力',
    lede: 'Start with high school and add every school or university after it, newest last. Your certificates go in the Documents step.',
    blocks: [
      {
        group: {
          name: 'schools',
          label: 'Education from high school onwards',
          zh: '教育背景（从高中起）',
          hint: (ctx) =>
            ctx.level === 'PhD' ? 'Add high school, your Bachelor and your Master.' : ctx.level === 'Master' ? 'Add high school and your Bachelor.' : 'Add your high school (Grade 12, FSc, A-Level or equivalent).',
          min: (ctx) => (ctx.level === 'PhD' ? 3 : ctx.level === 'Master' ? 2 : 1),
          max: 6,
          addLabel: 'Add another school',
          itemLabel: 'School',
          fields: [
            { name: 'institution', label: 'School or university', zh: '学校', type: 'text', required: true, maxLength: 120 },
            { name: 'certificate', label: 'Qualification', zh: '所获学历', type: 'text', required: true, maxLength: 100, placeholder: 'For example FSc Pre-Medical', width: 'full' },
            { name: 'from', label: 'From', type: 'month', required: true, width: 'half', check: month },
            { name: 'to', label: 'To', type: 'month', required: true, width: 'half', hint: 'Expected month if you are still studying.', check: month },
          ],
        },
      },
      {
        group: {
          name: 'jobs',
          label: 'Work experience',
          zh: '工作经历',
          hint: (ctx) => (ctx.level === 'PhD' ? 'PhD applicants add at least one job (the official form asks for it).' : 'Optional. Leave empty if you have not worked.'),
          min: (ctx) => (ctx.level === 'PhD' ? 1 : 0),
          max: 5,
          addLabel: 'Add a job',
          itemLabel: 'Job',
          fields: [
            { name: 'employer', label: 'Employer', zh: '工作单位', type: 'text', required: true, maxLength: 120 },
            { name: 'position', label: 'Position', zh: '职务及职称', type: 'text', required: true, maxLength: 100 },
            { name: 'from', label: 'From', type: 'month', required: true, width: 'half', check: month },
            { name: 'to', label: 'To', type: 'month', required: true, width: 'half', check: month },
          ],
        },
      },
      {
        title: 'Languages',
        zh: '语言能力',
        fields: [
          { name: 'englishTest', label: 'English test', zh: '英语能力', type: 'select', options: ENGLISH, required: true, width: 'half' },
          {
            name: 'englishScore',
            label: 'Overall score',
            type: 'number',
            inputMode: 'decimal',
            width: 'half',
            showIf: (v) => !['none', 'moi', ''].includes(String(v.englishTest ?? '')),
            required: (v) => !['none', 'moi', ''].includes(String(v.englishTest ?? '')),
            check: (val, v) => {
              const t = ENGLISH_TESTS.find((x) => x.id === v.englishTest);
              const n = Number(val);
              return Number.isFinite(n) && n > 0 && n <= (t?.max ?? 999) ? null : `Enter your ${t?.label ?? 'test'} score${t?.max ? ` (up to ${t.max})` : ''}.`;
            },
          },
          { name: 'hskLevel', label: 'Chinese test (HSK)', zh: '汉语水平 HSK', type: 'select', options: HSK, required: true, width: 'half' },
          { name: 'hskScore', label: 'HSK score', type: 'number', inputMode: 'numeric', width: 'half', showIf: (v) => !!v.hskLevel && v.hskLevel !== '0', hint: 'Optional.' },
          { name: 'hskkLevel', label: 'Speaking test (HSKK)', type: 'select', options: HSKK, width: 'half' },
          { name: 'hskkScore', label: 'HSKK score', type: 'number', inputMode: 'numeric', width: 'half', showIf: (v) => !!v.hskkLevel && v.hskkLevel !== 'none', hint: 'Optional.' },
        ],
      },
    ],
  },

  study: {
    key: 'study',
    title: 'Study plan in China',
    zh: '留学中国计划',
    lede: 'What you want to study and how you will pay for it. Pick a major from this programme if you can: IFFI checks every choice with the university.',
    blocks: [
      {
        fields: [
          {
            name: 'major',
            label: 'Major you want to study',
            zh: '申请学习专业',
            type: 'select',
            required: true,
            options: (ctx) => (ctx.majors.length ? [...ctx.majors.map((m) => ({ value: m, label: m })), { value: OTHER, label: 'Another major (write it below)' }] : []),
            maxLength: 120,
          },
          {
            name: 'majorOther',
            label: 'Which major?',
            type: 'text',
            maxLength: 120,
            showIf: (v) => v.major === OTHER,
            required: (v) => v.major === OTHER,
          },
          {
            name: 'medium',
            label: 'Teaching language',
            zh: '授课语言',
            type: 'select',
            required: true,
            width: 'half',
            options: (ctx) => {
              const langs = ctx.teaching.flatMap((l) => (l === 'Bilingual' ? ['English', 'Chinese'] : [l]));
              const unique = [...new Set(langs.length ? langs : ['English', 'Chinese'])];
              return unique.map((l) => ({ value: l, label: l }));
            },
          },
          { name: 'degree', label: 'Degree', zh: '申请学位', type: 'text', required: true, width: 'half', maxLength: 60 },
          { name: 'durationFrom', label: 'Start', zh: '学习期限 自', type: 'month', required: true, width: 'half', check: month },
          {
            name: 'durationTo',
            label: 'End',
            zh: '至',
            type: 'month',
            required: true,
            width: 'half',
            check: (val, v) => month(val) ?? (typeof v.durationFrom === 'string' && val <= v.durationFrom ? 'The end must be after the start.' : null),
          },
          { name: 'funding', label: 'How you will pay', zh: '经费来源', type: 'radio', options: FUNDING, required: true },
          { name: 'fundingOther', label: 'Explain', type: 'text', maxLength: 120, showIf: (v) => v.funding === 'other', required: (v) => v.funding === 'other' },
        ],
      },
    ],
  },

  family: {
    key: 'family',
    title: 'Family and guarantor',
    zh: '申请人亲属情况与担保人',
    lede: 'The university asks for both parents and for the person who pays for your studies (the financial guarantor).',
    blocks: [
      { title: 'Father', zh: '父亲', fields: parentFields('father', 'Father', '父亲') },
      { title: 'Mother', zh: '母亲', fields: parentFields('mother', 'Mother', '母亲') },
      {
        group: {
          name: 'relatives',
          label: 'Other family member',
          hint: 'Optional, for example a brother or a guardian.',
          min: () => 0,
          max: 2,
          addLabel: 'Add a family member',
          itemLabel: 'Family member',
          fields: [
            { name: 'relation', label: 'Relationship', zh: '关系', type: 'text', required: true, maxLength: 40, width: 'half', placeholder: 'Brother' },
            { name: 'name', label: 'Full name', zh: '姓名', type: 'text', required: true, maxLength: 100, width: 'half' },
            { name: 'occupation', label: 'Occupation', zh: '职业', type: 'text', maxLength: 100, width: 'half' },
            { name: 'phone', label: 'Phone', zh: '电话', type: 'tel', maxLength: 30, width: 'half', check: phone },
          ],
        },
      },
      {
        title: 'Financial guarantor',
        zh: '经济担保人或机构',
        hint: 'The person (or organisation) who pays for your studies and living costs in China.',
        fields: [
          { name: 'guarantorRelation', label: 'Who is it?', type: 'select', options: GUARANTOR, required: true, width: 'half' },
          { name: 'guarantorName', label: 'Full name', zh: '姓名', type: 'text', required: true, maxLength: 100, width: 'half' },
          { name: 'guarantorOrganization', label: 'Where they work', zh: '工作机构', type: 'text', required: true, maxLength: 120, width: 'half', hint: 'Employer or business name.' },
          { name: 'guarantorPhone', label: 'Phone', zh: '电话', type: 'tel', required: true, width: 'half', inputMode: 'tel', check: phone },
          { name: 'guarantorEmail', label: 'Email', zh: '邮箱', type: 'email', width: 'half', inputMode: 'email', check: email, hint: 'Optional.' },
          { name: 'guarantorAddress', label: 'Address', zh: '联系地址', type: 'textarea', required: true, maxLength: 300 },
        ],
      },
      { title: 'Reference and guarantor in China', zh: '推荐单位与在华事务担保人', note: 'iffi-reference' },
    ],
  },
};

// ------------------------------------------------------------------------------------------ reading the schema

export const optionsOf = (f: FieldDef, ctx: FormContext): Option[] => (typeof f.options === 'function' ? f.options(ctx) : (f.options ?? []));
export const isShown = (f: FieldDef, v: SectionValues, ctx: FormContext) => !f.showIf || f.showIf(v, ctx);
const isRequired = (f: FieldDef, v: SectionValues, ctx: FormContext) => (typeof f.required === 'function' ? f.required(v, ctx) : Boolean(f.required));
export const fieldsOf = (s: SectionDef) => s.blocks.flatMap((b) => b.fields ?? []);
export const groupsOf = (s: SectionDef) => s.blocks.flatMap((b) => (b.group ? [b.group] : []));
const str = (v: SectionValues, name: string) => (typeof v[name] === 'string' ? (v[name] as string) : '');
export const rowsOf = (v: SectionValues, name: string): Row[] => (Array.isArray(v[name]) ? (v[name] as Row[]) : []);

/** The words for a stored value: option labels instead of codes, "Yes" for ticked boxes. */
export function displayValue(f: FieldDef, value: string, ctx: FormContext): string {
  if (!value) return '';
  if (f.type === 'checkbox') return value === 'yes' ? 'Yes' : '';
  const opt = optionsOf(f, ctx).find((o) => o.value === value);
  return opt?.label ?? value;
}

// -------------------------------------------------------------------------------------------------- checks

export type Errors = Record<string, string>;

function checkField(f: FieldDef, value: string, v: SectionValues, ctx: FormContext): string | null {
  if (!value) return isRequired(f, v, ctx) ? (f.type === 'radio' || f.type === 'select' ? 'Choose one.' : 'This is required.') : null;
  const opts = optionsOf(f, ctx);
  if ((f.type === 'select' || f.type === 'radio') && opts.length && !opts.some((o) => o.value === value)) return 'Choose one of the options.';
  return f.check ? f.check(value, v, ctx) : null;
}

/**
 * Every problem in one part of the form. Keys are field names, `group.index.field` for a row, or the group name when
 * there are too few rows. Runs in the browser before saving and again on the server.
 */
export function validateSection(key: FormSectionKey, v: SectionValues, ctx: FormContext): Errors {
  const s = SECTIONS[key];
  const errors: Errors = {};
  for (const f of fieldsOf(s)) {
    if (!isShown(f, v, ctx)) continue;
    const e = checkField(f, str(v, f.name), v, ctx);
    if (e) errors[f.name] = e;
  }
  for (const g of groupsOf(s)) {
    const rows = rowsOf(v, g.name);
    const min = g.min(ctx);
    if (rows.length < min) errors[g.name] = min === 1 ? `Add at least one ${g.itemLabel.toLowerCase()}.` : `Add at least ${min}: ${typeof g.hint === 'function' ? g.hint(ctx) : (g.hint ?? '')}`.trim();
    rows.forEach((row, i) => {
      for (const f of g.fields) {
        const e = checkField(f, row[f.name] ?? '', v, ctx);
        if (e) errors[`${g.name}.${i}.${f.name}`] = e;
      }
      if (row.from && row.to && MONTH.test(row.from) && MONTH.test(row.to) && row.to < row.from) errors[`${g.name}.${i}.to`] = 'This must be after "From".';
    });
  }
  return errors;
}

/** Keep only the fields this part has, as trimmed strings of a sensible length. Anything else the browser sends is dropped. */
export function sanitizeSection(key: FormSectionKey, raw: unknown): SectionValues {
  const s = SECTIONS[key];
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const clean = (f: FieldDef, val: unknown) => {
    if (typeof val !== 'string') return '';
    let out = val.trim().slice(0, f.maxLength ?? (f.type === 'textarea' ? 500 : 120));
    if (f.upper) out = out.toUpperCase();
    if (f.type === 'checkbox') out = out === 'yes' ? 'yes' : '';
    return out;
  };
  const out: SectionValues = {};
  for (const f of fieldsOf(s)) out[f.name] = clean(f, input[f.name]);
  for (const g of groupsOf(s)) {
    const rows = Array.isArray(input[g.name]) ? (input[g.name] as unknown[]) : [];
    out[g.name] = rows.slice(0, g.max).map((r) => {
      const row = r && typeof r === 'object' ? (r as Record<string, unknown>) : {};
      return Object.fromEntries(g.fields.map((f) => [f.name, clean(f, row[f.name])]));
    });
  }
  return out;
}

/** What the student saved for one part (answers only, without the bookkeeping fields). */
export function savedSection(form: Record<string, unknown>, key: FormSectionKey): SectionValues {
  const raw = form[key];
  return raw && typeof raw === 'object' ? sanitizeSection(key, raw) : {};
}

// ------------------------------------------------------------------------------------------------- prefill

export interface PrefillFacts {
  email: string;
  fullName: string | null;
  whatsapp: string | null;
  study: { date_of_birth: string | null; country: string; english_test: string; english_score: number | null; hsk: number; funding: string } | null;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** "September 2025" -> the next September from today as "2026-09" (brochure intakes are from past years). */
export function nextIntakeMonth(intake: string | null, today = new Date()): string {
  const m = intake ? MONTHS.findIndex((name) => intake.toLowerCase().includes(name)) : -1;
  if (m < 0) return '';
  const year = today.getUTCMonth() < m ? today.getUTCFullYear() : today.getUTCFullYear() + 1;
  return `${year}-${String(m + 1).padStart(2, '0')}`;
}

function addYears(ym: string, duration: string | null): string {
  const years = duration?.match(/(\d+(?:\.\d+)?)\s*years?/i);
  const months = duration?.match(/(\d+)\s*months?/i);
  const add = years ? Math.round(Number(years[1]) * 12) : months ? Number(months[1]) : 0;
  if (!MONTH.test(ym) || !add) return '';
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) + add;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** Answers we already know (quiz, Google account, programme), used where the student has not saved anything yet. */
export function prefillSection(key: FormSectionKey, ctx: FormContext, f: PrefillFacts): SectionValues {
  const st = f.study;
  switch (key) {
    case 'personal': {
      const nationality = st ? countryName(st.country) : '';
      return {
        dateOfBirth: st?.date_of_birth ?? '',
        nationality,
        occupation: 'Student',
        highestDiploma: ctx.level === 'PhD' ? 'master' : ctx.level === 'Master' ? 'bachelor' : 'high_school',
        healthStatus: 'good',
        maritalStatus: 'single',
      };
    }
    case 'contact':
      return { mobile: f.whatsapp ?? '', email: f.email, presentCountry: st ? countryName(st.country) : '', permanentSame: 'yes' };
    case 'education':
      return {
        schools: [{ institution: '', certificate: '', from: '', to: '' }],
        jobs: [],
        englishTest: st?.english_test ?? 'none',
        englishScore: st?.english_score != null ? String(st.english_score) : '',
        hskLevel: String(st?.hsk ?? 0),
        hskkLevel: 'none',
      };
    case 'study': {
      const from = nextIntakeMonth(ctx.intake);
      return {
        major: ctx.majors.length === 1 ? ctx.majors[0] : '',
        medium: ctx.teaching.includes('English') ? 'English' : (ctx.teaching[0] ?? ''),
        degree: DEGREE_LABEL[ctx.level] ?? '',
        durationFrom: from,
        durationTo: addYears(from, ctx.duration),
        funding: st?.funding === 'self' ? 'self' : 'scholarship',
      };
    }
    case 'family':
      return { guarantorRelation: 'father', relatives: [] };
  }
}

/** The passport name as one line: "SURNAME GIVEN NAMES". */
export function passportName(personal: SectionValues): string {
  return [str(personal, 'surname'), str(personal, 'givenName')].filter(Boolean).join(' ').trim();
}
