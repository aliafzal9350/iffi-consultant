import type { Metadata } from 'next';
import Services from '@/views/Services';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/services'].title,
  description: site.seo.routes['/services'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/services',
  },
};

export default function Page() {
  return <Services />;
}
