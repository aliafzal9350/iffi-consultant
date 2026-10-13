'use client';
import { useActionState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Link } from '@/lib/router';
import { Field, inputClass } from '@/components/ui/Form';
import { buttonClass } from '@/components/ui/buttonStyles';
import { saveProfile, type ProfileFormState } from '@/lib/portal/actions';

export function ProfileForm({ initial }: { initial: ProfileFormState['values'] }) {
  const [state, action, pending] = useActionState(saveProfile, { ok: false, errors: {}, values: initial });
  const { errors, values } = state;

  return (
    <form action={action} className="space-y-5" noValidate>
      <Field label="Full name" hint="Exactly as written in your passport." error={errors.full_name} required>
        {({ id, describedBy }) => (
          <input
            id={id}
            name="full_name"
            defaultValue={values.full_name}
            autoComplete="name"
            aria-describedby={describedBy}
            aria-invalid={Boolean(errors.full_name)}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="WhatsApp number" hint="Include your country code, for example +92 for Pakistan." error={errors.whatsapp} required>
        {({ id, describedBy }) => (
          <input
            id={id}
            name="whatsapp"
            type="tel"
            inputMode="tel"
            defaultValue={values.whatsapp}
            autoComplete="tel"
            placeholder="+92 300 1234567"
            aria-describedby={describedBy}
            aria-invalid={Boolean(errors.whatsapp)}
            className={inputClass}
          />
        )}
      </Field>
      {errors.form && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] text-danger" role="alert">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
        <button type="submit" disabled={pending} className={buttonClass('navy', 'md')}>
          {pending ? 'Saving…' : 'Save details'}
        </button>
        {state.ok && (
          <p className="flex items-center gap-2 text-[14px]" role="status">
            <CircleCheck size={17} aria-hidden="true" className="text-good" />
            <span className="text-ink">Details saved.</span>
            <Link to="/portal" className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
              Back to overview
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
