import { Calculator, ListChecks, Search, type LucideIcon } from 'lucide-react';
import { meta, tools } from '@/data';

export interface ToolMeta {
  id: 'finder' | 'cost' | 'eligibility';
  path: string;
  name: string;
  short: string;
  description: string;
  benefit: string;
  icon: LucideIcon;
  keywords: number;
  markets: number;
}

const demand = (tool: string) => tools.demandEvidence.ranking.find((r) => r.tool === tool)!;

export const TOOLS: ToolMeta[] = [
  {
    id: 'finder',
    path: '/programmes',
    name: 'University & Programme Finder',
    short: 'University Finder',
    description: `Filter ${meta.counts.programmes} programmes by level, major, city, teaching language and scholarship.`,
    benefit: 'Build a shortlist, compare up to three and save it as a PDF.',
    icon: Search,
    keywords: demand('University finder / agency no.').keywords,
    markets: demand('University finder / agency no.').markets,
  },
  {
    id: 'cost',
    path: '/tools/cost-calculator',
    name: 'Study Cost Calculator',
    short: 'Cost Calculator',
    description: 'Tuition, hostel and living costs for any city, converted into your own currency.',
    benefit: 'See your first-year total and what a scholarship would save.',
    icon: Calculator,
    keywords: demand('Cost calculator').keywords,
    markets: demand('Cost calculator').markets,
  },
  {
    id: 'eligibility',
    path: '/tools/eligibility-checker',
    name: 'Scholarship Eligibility Checker',
    short: 'Eligibility Checker',
    description: 'Seven quick questions about your marks, English and budget.',
    benefit: 'See the programmes you qualify for, with or without IELTS.',
    icon: ListChecks,
    keywords: demand('Eligibility checker').keywords,
    markets: demand('Eligibility checker').markets,
  },
];
