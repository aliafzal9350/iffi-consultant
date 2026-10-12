import type { Metadata } from 'next';
import Cookies from '@/views/legal/Cookies';

export const metadata: Metadata = {
  title: 'Cookie Policy | IFFI Global Education Consultants',
  description:
    'How IFFI Global Education Consultants Ltd uses cookies and analytical tracking on iffiglobal.com.',
  alternates: {
    canonical: 'https://www.iffiglobal.com/cookies',
  },
};

export default function Page() {
  return <Cookies />;
}
