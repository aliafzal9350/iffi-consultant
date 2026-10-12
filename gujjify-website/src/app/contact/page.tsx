import type { Metadata } from 'next';
import Contact from '@/views/Contact';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/contact'].title,
  description: site.seo.routes['/contact'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/contact',
  },
};

export default function Page() {
  return <Contact />;
}
