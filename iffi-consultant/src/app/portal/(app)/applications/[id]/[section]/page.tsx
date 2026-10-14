import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { isEditable, isFormSection } from '@/lib/portal/application';
import { SECTIONS, prefillSection, savedSection } from '@/lib/portal/form';
import { loadApplication } from '@/lib/portal/load';
import { getStudyProfile } from '@/lib/portal/study';
import { SectionForm } from '@/components/portal/apply/SectionForm';
import { StepShell } from '@/components/portal/apply/StepShell';

export const metadata: Metadata = { title: { absolute: `Application form | ${site.brand.name}` } };

/** One part of the online form: /portal/applications/:id/personal, /contact, /education, /study, /family. */
export default async function FormSectionPage({ params }: { params: Promise<{ id: string; section: string }> }) {
  const me = await requireUser();
  const { id, section } = await params;
  if (!isFormSection(section)) notFound();
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) notFound();

  const { app, ctx } = loaded;
  const form = app.form ?? {};
  // first visit: start from what we already know (quiz, Google account, programme); afterwards: exactly what was saved
  let initial = savedSection(form, section);
  if (!form[section]) {
    const sp = await getStudyProfile(me.id);
    initial = prefillSection(section, ctx, {
      email: me.email,
      fullName: me.full_name,
      whatsapp: me.whatsapp,
      study: sp ? { date_of_birth: sp.date_of_birth, country: sp.country, english_test: sp.english_test, english_score: sp.english_score, hsk: sp.hsk, funding: sp.funding } : null,
    });
  }

  return (
    <StepShell loaded={loaded} current={section} lede={SECTIONS[section].lede}>
      <SectionForm key={section} appId={app.id} sectionKey={section} initial={initial} ctx={ctx} readOnly={!isEditable(app.status)} backHref={`/portal/applications/${app.id}`} />
    </StepShell>
  );
}
