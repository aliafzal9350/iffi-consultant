import { Suspense } from 'react';
import type { Metadata } from 'next';
import Finder from '@/views/Finder';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/programmes'].title,
  description: site.seo.routes['/programmes'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/programmes',
  },
};

export default function ProgrammesPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-paper" aria-busy="true" />}>
      <Finder />
    </Suspense>
  );
}
