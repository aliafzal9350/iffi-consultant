import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CircleCheck, FileText, MapPin, TriangleAlert } from 'lucide-react';
import { site } from '@/data/content';
import { programById } from '@/data/catalog';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { classify } from '@/lib/eligibility';
import { Link } from '@/lib/router';
import { durationLabel, locationLabel, programPath, teachingLabel } from '@/lib/programs';
import { startApplication } from '@/lib/portal/actions';
import { DOCS, requiredDocuments } from '@/lib/portal/documents';
import { getStudyProfile, isStudyProfileComplete, toEligibilityProfile } from '@/lib/portal/study';
import { PortalBand } from '@/components/portal/PortalBand';
import { SubmitButton } from '@/components/portal/SubmitButton';

export const metadata: Metadata = { title: { absolute: `Apply | ${site.brand.name}` } };

/** Entry point from "Apply online" on a public programme page: confirm the programme, then start the application. */
export default async function ApplyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const program = programById.get(id.toUpperCase());
  if (!program) notFound();

  const sp = await getStudyProfile(me.id);
  if (!isStudyProfileComplete(sp)) redirect(`/portal/start?next=${encodeURIComponent(`/portal/apply/${program.id}`)}`);

  const supabase = await createClient();
  const { data: existing } = await supabase.from('applications').select('id').eq('user_id', me.id).eq('program_id', program.id).maybeSingle();
  if (existing) redirect(`/portal/applications/${existing.id}`);

  const verdict = classify(program, toEligibilityProfile(sp));
  const { error } = await searchParams;

  return (
    <>
      <PortalBand title="Start your application" lede="Check the programme, then start. You can save and come back at any time." />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 md:py-10">
        <article className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
          <p className="text-[13px] font-medium text-gold-deep">You are applying for</p>
          <h2 className="mt-1 text-h3">{program.displayName}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} aria-hidden="true" className="text-gold-deep" />
              {locationLabel(program)}
            </span>
            <span>{durationLabel(program)}</span>
            <span>{teachingLabel(program)}</span>
          </p>

          {verdict.status === 'match' ? (
            <p className="mt-6 flex gap-3 rounded-xl bg-good/10 px-4 py-3 text-[14.5px] text-ink">
              <CircleCheck size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />
              Good news: your answers meet every requirement we know about for this programme.
            </p>
          ) : (
            <div className="mt-6 flex gap-3 rounded-xl bg-gold-soft px-4 py-3 text-[14.5px] text-ink">
              <TriangleAlert size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-deep" />
              <div>
                <p className="font-medium text-navy">{verdict.status === 'pref' ? 'This is outside what you asked for' : 'You may not meet every requirement'}</p>
                <p className="mt-0.5">{verdict.reasons.join('. ')}. You can still apply: an adviser will check before anything is sent.</p>
              </div>
            </div>
          )}

          <div className="mt-7">
            <h3 className="font-sans text-[15px] font-medium text-navy">What you will need</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {requiredDocuments(program)
                .filter((r) => r.need === 'required')
                .map((r) => (
                  <li key={r.kind} className="flex gap-2 text-[14px] text-muted">
                    <FileText size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-navy" />
                    {DOCS[r.kind].title}
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-[13px] text-muted">
              No need to have everything now. The online form takes about 15 minutes; you upload documents after it, with a sample of each. IFFI gives you the
              application form already filled in, and the medical form for your doctor.
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-6 rounded-xl bg-danger/10 px-4 py-3 text-[14px] text-danger">
              Your application could not be started. Please try again.
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
            <form action={startApplication}>
              <input type="hidden" name="programId" value={program.id} />
              <SubmitButton variant="gold" size="lg" pending="Starting…">
                Start my application
              </SubmitButton>
            </form>
            <Link to={programPath(program)} className="text-[14px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
              Back to the programme
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
