import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { site } from '@/data/content';
import { isTeam, requireUser } from '@/lib/auth/dal';
import { Link } from '@/lib/router';
import { loadApplication } from '@/lib/portal/load';
import { PrintButton } from '@/components/portal/apply/PrintButton';
import { PrintedForm } from '@/components/portal/apply/PrintedForm';

export const metadata: Metadata = { title: { absolute: `Application form | ${site.brand.name}` }, robots: { index: false, follow: false } };

/**
 * The application form filled in from the online answers: the student prints it, signs it by hand and uploads the
 * scan. Staff can open it too (row-level security lets them read any application).
 */
export default async function PrintFormPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id);
  if (!loaded) notFound();
  const { app, ctx } = loaded;
  const back = isTeam(me.role) && me.id !== app.user_id ? `/staff/applications/${app.id}` : `/portal/applications/${app.id}`;

  return (
    <div className="min-h-svh bg-paper py-6 print:bg-white print:py-0">
      <style>{`@media print { @page { size: A4; margin: 10mm; } }`}</style>
      <div data-noprint className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link to={back} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-gold-deep">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] text-muted">Print it, sign at the end, then upload the scan in Documents.</p>
          <PrintButton />
        </div>
      </div>
      <PrintedForm app={app} ctx={ctx} />
    </div>
  );
}
