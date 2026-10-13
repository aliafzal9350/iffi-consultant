import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import ProfileView from '@/views/portal/ProfileView';

export const metadata: Metadata = { title: { absolute: `My profile | ${site.brand.name}` } };

export default async function ProfilePage() {
  return <ProfileView me={await requireUser()} />;
}
