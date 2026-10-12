import type { Metadata } from 'next';
import EligibilityChecker from '@/views/EligibilityChecker';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/tools/eligibility-checker'].title,
  description: site.seo.routes['/tools/eligibility-checker'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/tools/eligibility-checker',
  },
};

export default function Page() {
  return <EligibilityChecker />;
}
