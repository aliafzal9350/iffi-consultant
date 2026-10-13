import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { site } from '@/data/content';
import { ownerEmails, requireAdmin } from '@/lib/auth/dal';
import { listTeam } from '@/lib/staff/queries';
import { changeTeamRole } from '@/lib/staff/actions';
import { Avatar } from '@/components/portal/Avatar';
import { PortalBand } from '@/components/portal/PortalBand';
import { Select } from '@/components/ui/Form';
import { AddTeamMember, CopySignInLink, RemoveMember } from '@/components/staff/TeamForms';
import { shortDate } from '@/components/staff/StaffBits';

export const metadata: Metadata = { title: { absolute: `Team | ${site.brand.name} staff` } };

const Badge = ({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'gold' | 'navy' | 'plain' }) => (
  <span
    className={
      tone === 'gold'
        ? 'rounded-full bg-gold-soft px-2.5 py-0.5 text-[12px] font-medium text-gold-deep'
        : tone === 'navy'
          ? 'rounded-full bg-navy px-2.5 py-0.5 text-[12px] font-medium text-white'
          : 'rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-medium text-muted ring-1 ring-line'
    }
  >
    {children}
  </span>
);

export default async function TeamPage() {
  const me = await requireAdmin();
  const { members, profiles } = await listTeam();
  const owners = ownerEmails();
  const profileOf = new Map(profiles.map((p) => [p.email.toLowerCase(), p]));
  // the address this site is running on right now (localhost, Vercel or the final domain)
  const h = await headers();
  const signInUrl = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}/portal/sign-in?mode=staff`;

  const rows = [
    ...owners.map((email) => ({ email, role: 'admin' as const, owner: true, added: null as string | null })),
    ...members.filter((m) => !owners.includes(m.email)).map((m) => ({ email: m.email, role: m.role, owner: false, added: m.created_at })),
  ];

  return (
    <>
      <PortalBand title="Team" lede="Who can open the staff portal. Everyone signs in with Google, so there are no passwords to share.">
        <CopySignInLink url={signInUrl} />
      </PortalBand>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <section aria-labelledby="members-h" className="min-w-0">
          <h2 id="members-h" className="text-h3">
            People on the team ({rows.length})
          </h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
            {rows.map((r) => {
              const p = profileOf.get(r.email);
              const isMe = r.email === me.email.toLowerCase();
              return (
                <li key={r.email} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={p?.full_name ?? r.email} src={p?.avatar_url ?? null} size={40} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-navy">{p?.full_name ?? r.email}</span>
                        {isMe && <Badge tone="navy">You</Badge>}
                        {r.owner && <Badge tone="gold">Owner</Badge>}
                      </p>
                      <p className="truncate text-[13px] text-muted">
                        {p?.full_name ? `${r.email}, ` : ''}
                        {p ? 'has signed in' : 'has not signed in yet'}
                        {r.added ? `, added ${shortDate(r.added)}` : ''}
                      </p>
                    </div>
                  </div>

                  {r.owner || isMe ? (
                    <span className="pl-[52px] text-[13.5px] font-medium text-navy sm:pl-0">{r.role === 'admin' ? 'Admin' : 'Staff'}</span>
                  ) : (
                    <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                      <form action={changeTeamRole} className="flex items-center gap-2">
                        <input type="hidden" name="email" value={r.email} />
                        <label className="sr-only" htmlFor={`role-${r.email}`}>
                          Role for {r.email}
                        </label>
                        <Select id={`role-${r.email}`} name="role" defaultValue={r.role} className="w-28 [&_select]:min-h-9 [&_select]:py-1.5 [&_select]:text-[14px]">
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </Select>
                        <button type="submit" className="rounded-full px-3 py-1.5 text-[13px] font-medium text-navy hover:bg-paper">
                          Save
                        </button>
                      </form>
                      <RemoveMember email={r.email} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            Owners come from <code className="rounded bg-white px-1 ring-1 ring-line">ADMIN_EMAILS</code> in the server settings and cannot be removed here, so IFFI can never be locked out.
          </p>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="add-h" className="rounded-card border border-gold/50 bg-white p-6 shadow-lift">
            <h2 id="add-h" className="text-[1.25rem]">
              Add someone
            </h2>
            <div className="mt-5">
              <AddTeamMember />
            </div>
          </section>
          <section className="rounded-card border border-line bg-white p-6">
            <h2 className="text-[1.15rem]">What happens next</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] text-muted">
              <li>Send them the staff sign-in link (button at the top).</li>
              <li>They click it and choose the Google account you added.</li>
              <li>They land on the staff dashboard. Nothing else to set up.</li>
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
