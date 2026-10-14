import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireAdmin } from '@/lib/auth/dal';
import { getPaymentSettings } from '@/lib/portal/settings';
import { PortalBand } from '@/components/portal/PortalBand';
import { SettingsForm } from '@/components/staff/SettingsForm';

export const metadata: Metadata = { title: { absolute: `Settings | ${site.brand.name} staff` } };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getPaymentSettings();
  return (
    <>
      <PortalBand title="Payment settings" lede="How students pay the application fee and the service charge. Changes show to students straight away." />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-10">
        <SettingsForm initial={settings} />
      </div>
    </>
  );
}
