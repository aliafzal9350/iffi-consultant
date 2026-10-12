import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/data/content';
import { adminEnabled } from '@/lib/admin-auth';
import AdminDashboard from '@/views/admin/AdminDashboard';

export const metadata: Metadata = {
  title: { absolute: `Admin | ${site.brand.name}` },
  description: 'Local programme editor.',
  robots: { index: false, follow: false },
};

/** Local editing tool only: the live site has a read-only disk, so the page does not exist in production. */
export default function AdminPage() {
  if (!adminEnabled()) notFound();
  return <AdminDashboard />;
}
