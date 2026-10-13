import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { listStudents } from '@/lib/staff/queries';
import StudentsView from '@/views/staff/StudentsView';

export const metadata: Metadata = { title: { absolute: `Students | ${site.brand.name} staff` } };

export default async function StudentsPage() {
  await requireStaff();
  const { students, count } = await listStudents();
  return <StudentsView students={students} count={count} />;
}
