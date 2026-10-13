import type { Profile } from '@/lib/auth/dal';
import { Lock } from 'lucide-react';
import { Link } from '@/lib/router';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Avatar } from '@/components/portal/Avatar';
import { PortalBand } from '@/components/portal/PortalBand';
import { ProfileForm } from '@/components/portal/ProfileForm';

export default function ProfileView({ me }: { me: Profile }) {
  return (
    <>
      <PortalBand title="Your profile" lede="How IFFI reaches you, and the answers your matches are based on." />

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section aria-labelledby="contact-details" className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
          <div className="flex items-center gap-4 border-b border-line pb-6">
            <Avatar name={me.full_name} src={me.avatar_url} size={56} />
            <div className="min-w-0">
              <h2 id="contact-details" className="text-h3">
                Contact details
              </h2>
              <p className="mt-1 text-[14px] text-muted">Signed in with Google as {me.email}</p>
            </div>
          </div>
          <div className="mt-6 max-w-xl">
            <ProfileForm initial={{ full_name: me.full_name ?? '', whatsapp: me.whatsapp ?? '' }} />
          </div>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="answers" className="rounded-card border border-gold/50 bg-gold-soft/50 p-6">
            <h2 id="answers" className="text-[1.15rem]">
              Your quiz answers
            </h2>
            <p className="mt-1.5 text-[14px] text-muted">Changed your results or got an IELTS score? Update your answers and your matches update straight away.</p>
            <Link to="/portal/start" className={buttonClass('navy', 'sm', 'mt-4')}>
              Change my answers
            </Link>
          </section>
          <section aria-labelledby="why" className="rounded-card border border-line bg-white p-6">
            <h2 id="why" className="text-[1.15rem]">
              Why we ask
            </h2>
            <dl className="mt-4 space-y-4 text-[14px]">
              <div>
                <dt className="font-medium text-navy">Full name</dt>
                <dd className="mt-0.5 text-muted">Universities check every document against the name in your passport, so it must match exactly.</dd>
              </div>
              <div>
                <dt className="font-medium text-navy">WhatsApp number</dt>
                <dd className="mt-0.5 text-muted">Your adviser sends admission news, missing-document requests and visa steps here.</dd>
              </div>
            </dl>
          </section>
          <p className="flex gap-2.5 px-1 text-[13px] text-muted">
            <Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-navy" />
            Only you and IFFI staff can see your details.
          </p>
        </aside>
      </div>
    </>
  );
}
