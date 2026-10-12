import type { Metadata } from 'next';
import { site } from '@/data/content';
import NotFound from '@/views/NotFound';

export const metadata: Metadata = {
  title: { absolute: `Page Not Found | ${site.brand.name}` },
  description: `This page does not exist. Explore China programmes and free tools from ${site.brand.name}.`,
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return <NotFound />;
}
