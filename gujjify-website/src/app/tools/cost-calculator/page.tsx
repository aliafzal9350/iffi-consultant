import { Suspense } from 'react';
import type { Metadata } from 'next';
import CostCalculator from '@/views/CostCalculator';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/tools/cost-calculator'].title,
  description: site.seo.routes['/tools/cost-calculator'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/tools/cost-calculator',
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-paper" aria-busy="true" />}>
      <CostCalculator />
    </Suspense>
  );
}
