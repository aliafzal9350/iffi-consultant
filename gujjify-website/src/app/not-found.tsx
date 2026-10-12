import type { Metadata } from 'next';
import NotFound from '@/views/NotFound';

export const metadata: Metadata = {
  title: 'Page Not Found | IFFI Global Education Consultants',
  description: 'This page does not exist. Explore China programmes and free tools from IFFI Global.',
};

export default function GlobalNotFound() {
  return <NotFound />;
}
