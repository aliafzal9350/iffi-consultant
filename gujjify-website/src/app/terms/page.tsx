import type { Metadata } from 'next';
import Terms from '@/views/legal/Terms';

export const metadata: Metadata = {
  title: 'Terms & Conditions | IFFI Global Education Consultants',
  description:
    'Terms of service and consultancy engagement with IFFI Global Education Consultants Ltd.',
  alternates: {
    canonical: 'https://www.iffiglobal.com/terms',
  },
};

export default function Page() {
  return <Terms />;
}
