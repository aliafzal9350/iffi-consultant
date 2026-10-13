import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth/dal';
import { PortalShell } from '@/components/portal/PortalShell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  return (
    <PortalShell me={me} area="staff">
      {children}
    </PortalShell>
  );
}
