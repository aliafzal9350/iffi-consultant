/**
 * Words with legal weight: the declaration the student signs (from the official application form) and IFFI's refund
 * policy. Both are versioned: the version the student accepted is saved with the application, so changing the text
 * means a new version, never an edit in place.
 */

export const DECLARATION = {
  version: '2026-10-13',
  points: [
    { en: 'All the information given in this form is true and correct.', zh: '申请表中所填写的内容和提供的材料真实无误。' },
    {
      en: 'During my stay in China, I shall abide by the laws and decrees of the Chinese Government, and will not take part in any activities that harm the social order in China or are inappropriate for a student.',
      zh: '在华期间，遵守中国的法律法规，不从事任何危害中国秩序的、与本人来华学习身份不相符的活动。',
    },
    {
      en: 'During my study in China, I shall observe the rules and regulations of the university, concentrate on my studies and research, and follow the teaching programmes arranged by the university.',
      zh: '在学期间，遵守学校的校规校纪，全力投入学习和研究工作，尊重学校的教学安排。',
    },
  ],
} as const;

/**
 * IFFI's refund rule, in the client's words: not qualifying = refund, backing off after paying = no refund.
 * Edge cases (declined offer, false documents, transfer charges) are not decided yet, so they are not promised here.
 */
export const REFUND_POLICY = {
  version: '2026-10-13',
  points: [
    'If IFFI or the university decides that you do not qualify for this programme, IFFI refunds your application fee.',
    'If you decide to stop or withdraw after you have paid, the application fee is not refunded.',
    'Your fee is confirmed only after IFFI has checked the payment in its account. Keep your transaction ID and screenshot.',
    'For any other situation, message IFFI on WhatsApp before you pay.',
  ],
} as const;

/** The "reference" and "guarantor in China" boxes on the official form: IFFI fills them for every student. */
export const IFFI_REFERENCE = {
  name: 'IFFI',
  organization: 'IFFI GLOBAL EDU CONSULTANT',
  phone: '13939090575',
  email: 'Ahmadiffi01@gmail.com',
  address: 'ZHENGZHOU, HENAN',
} as const;
