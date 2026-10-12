import type { Metadata } from 'next';
import ToolsHub from '@/views/ToolsHub';

export const metadata: Metadata = {
  title: 'Free Study in China Tools: Finder, Cost & CSC Eligibility | IFFI Global',
  description:
    'Three free tools for studying in China: a university and programme finder, a cost calculator in 40+ currencies and a CSC scholarship eligibility checker.',
  alternates: {
    canonical: 'https://www.iffiglobal.com/tools',
  },
};

export default function Page() {
  return <ToolsHub />;
}
