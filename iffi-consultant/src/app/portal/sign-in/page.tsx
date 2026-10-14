import type { Metadata } from 'next';
import { ListChecks, Lock, Search } from 'lucide-react';
import { site } from '@/data/content';
import { safeNext } from '@/lib/auth/redirects';
import { supabaseConfigured } from '@/lib/supabase/keys';
import { WhatsAppButton } from '@/components/ui/Button';
import { JOURNEY } from '@/lib/portal/journey';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { Crest } from '@/components/ui/Logo';
import { Link } from '@/lib/router';
import { GoogleSignInButton } from '@/components/portal/GoogleSignInButton';

export const metadata: Metadata = { title: { absolute: `Sign in | ${site.brand.name} student portal` } };

const ERRORS: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. Choose your Google account to continue.',
  'missing-code': 'That sign-in link was incomplete. Start again with the button below.',
  'exchange-failed': 'That sign-in link has expired or was already used. Start again with the button below.',
};

const COPY = {
  signup: { title: 'Create your free account', lede: 'One tap with your Google account. No password to remember.', button: 'Sign up with Google' },
  login: { title: 'Welcome back', lede: 'Log in with the Google account you used before.', button: 'Sign in with Google' },
  continue: { title: 'Sign in to continue', lede: 'New here? The same button creates your free account. No password needed.', button: 'Continue with Google' },
  staff: { title: 'IFFI team sign in', lede: 'Use the Google account an admin added to the team. You go straight to the staff dashboard.', button: 'Sign in with Google' },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requestedNext = safeNext(typeof params.next === 'string' ? params.next : null);
  const error = typeof params.error === 'string' ? ERRORS[params.error] : undefined;
  // "Get started" -> signup, "Log in" -> login, sent here by a portal link (e.g. Apply online) -> continue
  const mode = params.mode === 'signup' || params.mode === 'login' || params.mode === 'staff' ? params.mode : 'continue';
  const next = requestedNext ?? (mode === 'staff' ? '/staff' : null);
  const copy = COPY[mode];
  // switching keeps the page the student was heading to
  const other = mode === 'signup' ? 'login' : 'signup';
  const switchHref = `/portal/sign-in?${new URLSearchParams({ mode: other, ...(next ? { next } : {}) })}`;

  return (
    <div className="grid lg:min-h-[calc(100svh-116px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* left: what the portal is, and the route ahead */}
      <section className="relative overflow-hidden bg-navy text-mist">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-40 -top-48 h-[620px] w-[620px] rounded-full opacity-[0.16]"
          style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex h-full max-w-xl flex-col justify-center px-6 pb-12 pt-10 sm:px-10 lg:py-16">
          <h1 className="text-[clamp(2.1rem,4vw,3.3rem)] leading-[1.06] text-white">
            Your application to China, <span className="font-display-italic text-gold-2">in one place</span>
          </h1>
          <p className="text-lede mt-5 max-w-md text-mist">
            Build your profile, see the programmes that fit you, upload your documents and follow every step until admission.
          </p>

          <div className="relative mt-10 hidden lg:block">
            <span className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-gold-2/70 via-gold/30 to-transparent" aria-hidden="true" />
            <ol className="relative space-y-5" aria-label="What happens in the portal">
              {JOURNEY.map((s, i) => (
                <li key={s.key} className="flex items-center gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy font-display text-[15px] font-semibold text-gold-2 ring-1 ring-gold/50">
                    {i + 1}
                  </span>
                  <span className="text-[15px] text-mist">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="fret-line absolute inset-x-0 bottom-0 opacity-70" aria-hidden="true" />
      </section>

      {/* right: sign in (or, before accounts are switched on, the WhatsApp route) */}
      <section aria-labelledby="sign-in-title" className="flex items-center justify-center bg-paper px-4 py-10 sm:px-8 lg:py-16">
        {!supabaseConfigured() ? (
          <AccountsOpeningSoon />
        ) : (
          <div className="w-full max-w-[420px]">
            <div className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-9">
              <Crest variant="navy" size={44} className="mb-5" />
              <h2 id="sign-in-title" className="text-h3">
                {copy.title}
              </h2>
              <p className="mt-2 text-[15px] text-muted">{copy.lede}</p>
              {error && (
                <p className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-[14px] text-danger" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-7">
                <GoogleSignInButton next={next} label={copy.button} />
              </div>
              <p className="mt-6 flex gap-2.5 border-t border-line pt-5 text-[13px] leading-relaxed text-muted">
                <Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-navy" />
                Google shares only your name, email address and profile photo with us.
              </p>
            </div>
            {(mode === 'signup' || mode === 'login') && (
              <p className="mt-6 text-center text-[14px] text-muted">
                {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
                <Link to={switchHref} className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                  {mode === 'signup' ? 'Log in' : 'Create a free account'}
                </Link>
              </p>
            )}
            <p className="mt-3 text-center text-[14px] text-muted">
              Want to talk first?{' '}
              <a
                href={site.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-navy underline underline-offset-4 hover:text-gold-deep"
              >
                <WhatsAppIcon size={15} className="text-[#1a9e4b]" /> Message an adviser
              </a>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/** Shown while the student portal is not connected yet: the same help, through WhatsApp and the free tools. */
function AccountsOpeningSoon() {
  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-9">
        <Crest variant="navy" size={44} className="mb-5" />
        <h2 id="sign-in-title" className="text-h3">
          Online accounts open soon
        </h2>
        <p className="mt-2 text-[15px] text-muted">
          Until then our advisers handle every application on WhatsApp. Send your marks and the programmes you like, and we usually reply within minutes.
        </p>
        <WhatsAppButton messageKey="heroConsultation" size="lg" className="mt-7 w-full">
          Start on WhatsApp
        </WhatsAppButton>
        <div className="mt-6 space-y-1 border-t border-line pt-5">
          <Link to="/tools/eligibility-checker" className="flex min-h-11 items-center gap-3 rounded-lg text-[15px] font-medium text-navy hover:text-gold-deep">
            <ListChecks size={18} aria-hidden="true" className="text-gold-deep" />
            Check your scholarship eligibility
          </Link>
          <Link to="/programmes" className="flex min-h-11 items-center gap-3 rounded-lg text-[15px] font-medium text-navy hover:text-gold-deep">
            <Search size={18} aria-hidden="true" className="text-gold-deep" />
            Browse all programmes
          </Link>
        </div>
      </div>
    </div>
  );
}
