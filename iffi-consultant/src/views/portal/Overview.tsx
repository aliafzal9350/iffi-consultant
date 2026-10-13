import type { Profile } from '@/lib/auth/dal';
import { BookOpenCheck, Camera, FileBadge, Landmark, Languages, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { site } from '@/data/content';
import { journeyFor, type JourneyFacts } from '@/lib/portal/journey';
import { STATUS_LABEL, type ApplicationRow } from '@/lib/portal/application';
import { Link } from '@/lib/router';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { Avatar } from '@/components/portal/Avatar';
import { PortalBand } from '@/components/portal/PortalBand';
import { JourneyRoute } from '@/components/portal/JourneyRoute';

// From IFFI's own document list (charges list), asked for at every level unless noted
const DOCUMENTS = [
  { icon: BookOpenCheck, name: 'Passport', hint: 'Valid, with a clear scan of the photo page.' },
  { icon: Camera, name: 'Passport-size photo', hint: 'On a plain white background.' },
  { icon: FileBadge, name: 'Education documents', hint: 'Certificates and transcripts from high school onwards.' },
  { icon: ShieldCheck, name: 'Police clearance certificate', hint: 'Also called a police character certificate.' },
  { icon: Stethoscope, name: 'Medical check-up', hint: 'IFFI gives you the form for your doctor to fill in.' },
  { icon: Landmark, name: 'Bank statement', hint: 'An e-statement is fine. Some programmes ask for a minimum balance.' },
  { icon: Languages, name: 'English certificate', hint: 'Bachelor and above: IELTS, TOEFL, Duolingo, PTE or an English-medium letter.' },
];

export default function Overview({ me, facts, applications }: { me: Profile; facts: JourneyFacts; applications: ApplicationRow[] }) {
  const journey = journeyFor(facts);
  const next = journey.current;
  const after = next ? journey.steps[next.number] : undefined;
  const firstName = me.full_name?.split(' ')[0];

  return (
    <>
      <PortalBand
        lead={<span className="hidden sm:block"><Avatar name={me.full_name} src={me.avatar_url} size={56} /></span>}
        title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
        lede="Your application to study in China, one step at a time."
      >
        <JourneyRoute journey={journey} />
      </PortalBand>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="space-y-6">
          {next ? (
            <section aria-labelledby="next-step" className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
              <div className="flex flex-wrap items-center gap-3 text-[13px]">
                <span className="rounded-full bg-gold-soft px-3 py-1 font-medium text-gold-deep">
                  Step {next.number} of {journey.total}
                </span>
              </div>
              <h2 id="next-step" className="text-h3 mt-4">
                {next.title}
              </h2>
              <p className="mt-2 max-w-xl text-[15px] text-muted">{next.description}</p>
              {next.href && (
                <Link to={next.href} className={buttonClass(next.number === 1 ? 'gold' : 'navy', 'lg', 'mt-6')}>
                  {next.cta ?? 'Open my application'}
                </Link>
              )}
              {after && (
                <p className="mt-6 border-t border-line pt-4 text-[14px] text-muted">
                  After this: <span className="text-ink">{after.title.toLowerCase()}</span>
                </p>
              )}
            </section>
          ) : (
            <section className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
              <h2 className="text-h3">Every step is complete</h2>
              <p className="mt-2 text-[15px] text-muted">IFFI will message you on WhatsApp with each update.</p>
            </section>
          )}

          {applications.length > 0 && (
            <section aria-labelledby="apps" className="rounded-card border border-line bg-white p-6 sm:p-8">
              <h2 id="apps" className="text-h3">
                Your applications
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {applications.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-navy">{a.program_snapshot.displayName}</p>
                      <p className="text-[13.5px] text-muted">{STATUS_LABEL[a.status]}</p>
                    </div>
                    <Link to={`/portal/applications/${a.id}`} className={buttonClass('outline', 'sm')}>
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="gather" className="rounded-card border border-line bg-white p-6 sm:p-8">
            <h2 id="gather" className="text-h3">
              Start gathering your documents
            </h2>
            <p className="mt-2 max-w-xl text-[15px] text-muted">
              Collecting these early is what makes applications fast. You will upload them in the Apply step, with a sample of each.
            </p>
            <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {DOCUMENTS.map(({ icon: Icon, name, hint }) => (
                <li key={name} className="flex gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper text-navy">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-medium text-navy">{name}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-muted">{hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="adviser" className="rounded-card bg-navy p-6 text-mist">
            <h2 id="adviser" className="text-[1.3rem] text-white">
              Talk to an IFFI adviser
            </h2>
            <p className="mt-2 text-[14px]">{site.contact.responsePromise}</p>
            <p className="tabular mt-4 font-display text-[1.35rem] text-gold-2">{site.contact.phoneDisplay}</p>
            <a
              href={site.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('whatsapp', 'md', 'mt-5 w-full')}
            >
              <WhatsAppIcon size={18} /> Message on WhatsApp
            </a>
          </section>

          <section aria-labelledby="details" className="rounded-card border border-line bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="details" className="text-[1.15rem]">
                Your details
              </h2>
              <Link to="/portal/profile" className="text-[14px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                Edit
              </Link>
            </div>
            <dl className="mt-4 space-y-3 text-[14px]">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="text-ink">{me.full_name ?? 'Not added'}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="break-all text-ink">{me.email}</dd>
              </div>
              <div>
                <dt className="text-muted">WhatsApp</dt>
                <dd className={me.whatsapp ? 'tabular text-ink' : 'text-danger'}>{me.whatsapp ?? 'Not added yet'}</dd>
              </div>
            </dl>
            {me.role !== 'student' && (
              <Link to="/staff" className={buttonClass('outline', 'sm', 'mt-5 w-full')}>
                <UserRound size={16} aria-hidden="true" /> Open the staff portal
              </Link>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
