import type { Metadata } from 'next';
import Privacy from '@/views/legal/Privacy';

export const metadata: Metadata = {
  title: 'Privacy Policy | IFFI Global Education Consultants',
  description:
    'How IFFI Global Education Consultants Ltd collects, uses and protects your personal data under UK GDPR.',
  alternates: {
    canonical: 'https://www.iffiglobal.com/privacy',
  },
};

export default function Page() {
  return <Privacy />;
}
