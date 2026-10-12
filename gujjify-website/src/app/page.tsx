import { Suspense } from 'react';
import type { Metadata } from 'next';
import Home from '@/views/Home';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/'].title,
  description: site.seo.routes['/'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/',
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-paper" aria-busy="true" />}>
      <Home />
    </Suspense>
  );
}
