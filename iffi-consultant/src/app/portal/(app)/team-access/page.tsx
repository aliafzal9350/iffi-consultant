import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { site } from '@/data/content';
import { isTeam, requireUser } from '@/lib/auth/dal';
import { Link } from '@/lib/router';
import { buttonClass } from '@/components/ui/buttonStyles';

export const metadata: Metadata = { title: { absolute: `Staff access | ${site.brand.name}` } };

/** Someone signed in and tried the staff portal, but their Google account is not on the team. */
export default async function TeamAccessPage() {
  const me = await requireUser();
  if (isTeam(me.role)) redirect('/staff');

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 md:py-20">
      <div className="rounded-card border border-line bg-white p-6 text-center shadow-lift sm:p-9">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-soft text-gold-deep">
          <ShieldAlert size={26} aria-hidden="true" />
        </span>
        <h1 className="text-h3 mt-5">This account is not on the IFFI team yet</h1>
        <p className="mt-3 text-[15px] text-muted">
          You are signed in as <span className="font-medium text-ink">{me.email}</span>. Ask an IFFI admin to add this email on the Team page, then sign out and
          sign in again.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <form action="/auth/sign-out" method="post">
            <button type="submit" className={buttonClass('navy', 'md')}>
              Sign out and use another account
            </button>
          </form>
          <Link to="/portal" className="text-[14px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
            Continue as a student
          </Link>
        </div>
      </div>
    </div>
  );
}
