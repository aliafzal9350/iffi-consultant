import type { ReactNode } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { site } from '@/data/content';
import { Link } from '@/lib/router';
import type { Profile } from '@/lib/auth/dal';
import { Wordmark } from '@/components/ui/Logo';
import { AccountMenu } from './AccountMenu';
import { PortalNav, type NavItem } from './PortalNav';

const STUDENT_NAV: NavItem[] = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/matches', label: 'My matches' },
  { href: '/portal/profile', label: 'Profile' },
];
const STAFF_NAV: NavItem[] = [
  { href: '/staff', label: 'Dashboard' },
  { href: '/staff/applications', label: 'Applications' },
  { href: '/staff/students', label: 'Students' },
  { href: '/staff/programmes', label: 'Programmes' },
];
const ADMIN_NAV: NavItem[] = [...STAFF_NAV, { href: '/staff/team', label: 'Team' }, { href: '/staff/settings', label: 'Settings' }];

/** App chrome for the signed-in areas: slim navy bar, then the page, then a one-line footer. */
export function PortalShell({ me, area, children }: { me: Profile; area: 'student' | 'staff'; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-paper">
      <header className="relative z-40 bg-navy">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Wordmark eager />
          <span className="hidden h-7 w-px bg-white/15 sm:block" aria-hidden="true" />
          <span className="hidden text-[14px] text-mist sm:block">{area === 'staff' ? (me.role === 'admin' ? 'Admin panel' : 'Staff portal') : 'Student portal'}</span>
          <div className="ml-auto">
            <AccountMenu name={me.full_name} email={me.email} avatarUrl={me.avatar_url} isStaff={me.role !== 'student'} />
          </div>
        </div>
        <div className="border-t border-white/[0.07]">
          <div className="mx-auto max-w-[1240px] px-1 sm:px-3 lg:px-5">
            <PortalNav items={area === 'staff' ? (me.role === 'admin' ? ADMIN_NAV : STAFF_NAV) : STUDENT_NAV} />
          </div>
        </div>
      </header>

      <main id="content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {site.brand.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/" className="hover:text-navy">
              Main website
            </Link>
            <Link to="/privacy" className="hover:text-navy">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-navy">
              Terms
            </Link>
            <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-navy">
              <MessageCircle size={14} aria-hidden="true" /> Help on WhatsApp
            </a>
            {site.social.email && (
              <a href={site.social.email} className="inline-flex items-center gap-1.5 hover:text-navy">
                <Mail size={14} aria-hidden="true" /> {site.contact.email}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
