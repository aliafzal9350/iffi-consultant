import { requireUser } from '@/lib/auth/dal';
import { PortalShell } from '@/components/portal/PortalShell';

// The shell needs the student's name and photo. Pages still call requireUser() themselves:
// a layout does not re-run when moving between its pages, so it cannot be the only check.
export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  return (
    <PortalShell me={me} area="student">
      {children}
    </PortalShell>
  );
}
