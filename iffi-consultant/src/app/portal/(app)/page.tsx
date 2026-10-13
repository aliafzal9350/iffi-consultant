import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { getStudyProfile, isStudyProfileComplete } from '@/lib/portal/study';
import type { ApplicationRow } from '@/lib/portal/application';
import Overview from '@/views/portal/Overview';

export const metadata: Metadata = { title: { absolute: `My portal | ${site.brand.name}` } };

export default async function PortalHome() {
  const me = await requireUser();
  const supabase = await createClient();
  const [sp, { data }] = await Promise.all([
    getStudyProfile(me.id),
    supabase.from('applications').select('id, program_id, program_snapshot, status, form, created_at, updated_at').eq('user_id', me.id).order('updated_at', { ascending: false }),
  ]);
  const applications = (data ?? []) as ApplicationRow[];
  return <Overview me={me} facts={{ profileComplete: isStudyProfileComplete(sp), application: applications[0] ?? null }} applications={applications} />;
}
