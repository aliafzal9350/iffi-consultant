import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { listApplications, listPendingDocuments } from '@/lib/staff/queries';
import { programs } from '@/data/catalog';
import Dashboard from '@/views/staff/Dashboard';

export const metadata: Metadata = { title: { absolute: `Staff dashboard | ${site.brand.name}` } };

export default async function StaffHome() {
  const me = await requireStaff();
  const supabase = await createClient();
  const [apps, queue, { count }] = await Promise.all([
    listApplications(),
    listPendingDocuments(12),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
  ]);
  return <Dashboard me={me} apps={apps} queue={queue} studentCount={count ?? 0} programCount={programs.length} />;
}
