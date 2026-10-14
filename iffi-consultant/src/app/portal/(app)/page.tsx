import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import type { Program } from '@/types/data';
import { getStudyProfile, isStudyProfileComplete } from '@/lib/portal/study';
import type { ApplicationRow } from '@/lib/portal/application';
import { DOC_COLUMNS, requiredDocuments, summariseDocs, type UploadedDoc } from '@/lib/portal/documents';
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
  const latest = applications[0] ?? null;

  // the journey's "Documents" step is done when every required file of the latest application is in
  let documentsReady = false;
  if (latest) {
    const { data: docs } = await supabase.from('application_documents').select(DOC_COLUMNS).eq('application_id', latest.id);
    documentsReady = summariseDocs(requiredDocuments(latest.program_snapshot as unknown as Program), (docs ?? []) as UploadedDoc[]).missing.length === 0;
  }

  return <Overview me={me} facts={{ profileComplete: isStudyProfileComplete(sp), application: latest, documentsReady }} applications={applications} />;
}
