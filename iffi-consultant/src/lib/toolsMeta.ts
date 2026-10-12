import { Calculator, ListChecks, Search, type LucideIcon } from 'lucide-react';
import { meta } from '@/data/content';

export interface ToolMeta {
  id: 'finder' | 'cost' | 'eligibility';
  path: string;
  name: string;
  short: string;
  description: string;
  benefit: string;
  icon: LucideIcon;
  /** research bucket in tools.json demandEvidence (see lib/toolDemand.ts) */
  demandKey: string;
}

export const TOOLS: ToolMeta[] = [
  {
    id: 'finder',
    path: '/programmes',
    name: 'University & Programme Finder',
    short: 'University Finder',
    description: `Filter ${meta.counts.programmes} programmes by level, major, city, teaching language and scholarship.`,
    benefit: 'Build a shortlist, compare up to three and save it as a PDF.',
    icon: Search,
    demandKey: 'University finder / agency no.',
  },
  {
    id: 'cost',
    path: '/tools/cost-calculator',
    name: 'Study Cost Calculator',
    short: 'Cost Calculator',
    description: 'Tuition, hostel and living costs for any city, converted into your own currency.',
    benefit: 'See your first-year total and what a scholarship would save.',
    icon: Calculator,
    demandKey: 'Cost calculator',
  },
  {
    id: 'eligibility',
    path: '/tools/eligibility-checker',
    name: 'Scholarship Eligibility Checker',
    short: 'Eligibility Checker',
    description: 'Seven quick questions about your marks, English and budget.',
    benefit: 'See the programmes you qualify for, with or without IELTS.',
    icon: ListChecks,
    demandKey: 'Eligibility checker',
  },
];
