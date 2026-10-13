import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CircleCheck, MapPin } from 'lucide-react';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/cn';
import { LEVEL_LABEL } from '@/lib/programs';
import { APPLICATION_SECTIONS, STATUS_LABEL, type ApplicationRow } from '@/lib/portal/application';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { PortalBand } from '@/components/portal/PortalBand';

export const metadata: Metadata = { title: { absolute: `My application | ${site.brand.name}` } };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // RLS: a student can only ever load their own applications
  const supabase = await createClient();
  const { data } = await supabase.from('applications').select('id, program_id, program_snapshot, status, form, created_at, updated_at').eq('id', id).maybeSingle();
  if (!data) notFound();
  const app = data as ApplicationRow;
  const p = app.program_snapshot;
  const done = (key: string) => Boolean((app.form as Record<string, { completed?: boolean }>)[key]?.completed);
  const firstOpen = APPLICATION_SECTIONS.findIndex((s) => !done(s.key));

  const waText = `Hello IFFI, I started my application for ${p.displayName} (${app.program_id}) in the student portal. My name is ${me.full_name ?? ''}.`;

  return (
    <>
      <PortalBand
        title={p.displayName}
        lede={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} aria-hidden="true" className="text-gold-2" />
              {[p.city, p.province].filter(Boolean).join(', ')}
            </span>
            <span>{LEVEL_LABEL[p.level]}</span>
            <span className="rounded-full bg-gold/15 px-3 py-0.5 text-[13px] font-medium text-gold-2 ring-1 ring-gold/40">{STATUS_LABEL[app.status]}</span>
          </span>
        }
      />

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section aria-labelledby="sections" className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
          <h2 id="sections" className="text-h3">
            Your application in six parts
          </h2>
          <p className="mt-1 text-[15px] text-muted">Do them in order. Everything saves as you go.</p>

          <ol className="mt-6 space-y-3">
            {APPLICATION_SECTIONS.map((s, k) => {
              const isDone = done(s.key);
              const isNext = k === firstOpen;
              return (
                <li
                  key={s.key}
                  className={cn('flex gap-4 rounded-2xl border p-4 sm:p-5', isNext ? 'border-gold/60 bg-gold-soft/40' : 'border-line')}
                  aria-current={isNext ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-[16px] font-semibold',
                      isDone ? 'bg-good text-white' : isNext ? 'bg-navy text-gold-2' : 'bg-paper text-muted ring-1 ring-line'
                    )}
                  >
                    {isDone ? <CircleCheck size={18} aria-hidden="true" /> : k + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-[16px] font-medium text-navy">{s.title}</h3>
                    <p className="mt-0.5 text-[14px] text-muted">{s.description}</p>
                    {isNext && <p className="mt-3 text-[13.5px] font-medium text-gold-deep">The online form for this part opens in the next portal update.</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="saved" className="rounded-card bg-navy p-6 text-mist">
            <h2 id="saved" className="text-[1.3rem] text-white">
              Your place is saved
            </h2>
            <p className="mt-2 text-[14px]">
              IFFI can see this application now. Message an adviser and they will help you with the next part straight away.
            </p>
            <a
              href={`https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('whatsapp', 'md', 'mt-5 w-full')}
            >
              <WhatsAppIcon size={18} /> Continue on WhatsApp
            </a>
          </section>
          <p className="px-1 text-[13px] text-muted">
            Started {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Application reference{' '}
            <span className="tabular font-medium text-navy">IFFI-{app.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </aside>
      </div>
    </>
  );
}
