import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { programs } from '@/data/catalog';
import ProgrammesView from '@/views/staff/ProgrammesView';

export const metadata: Metadata = {
  title: { absolute: `Programmes manager | ${site.brand.name}` },
  robots: { index: false, follow: false },
};

export default async function StaffProgrammesPage() {
  await requireStaff();
  return <ProgrammesView initialPrograms={programs} />;
}
