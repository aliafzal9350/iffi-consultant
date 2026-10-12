import type { Metadata } from 'next';
import AdminDashboard from '@/views/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Executive Admin Portal | IFFI Global Education Consultants',
  description: 'Manage Chinese university programmes, admissions and scholarships.',
  robots: 'noindex, nofollow',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
