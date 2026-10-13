'use client';
import { useActionState, useState } from 'react';
import { Check, CircleCheck, Copy, UserPlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';
import { inputClass } from '@/components/ui/Form';
import { addTeamMember, removeTeamMember, type ActionState } from '@/lib/staff/actions';

const ROLES = [
  { value: 'staff', title: 'Staff', hint: 'Sees every application and student, updates statuses, messages students.' },
  { value: 'admin', title: 'Admin', hint: 'Everything staff can do, plus managing this team.' },
] as const;

export function AddTeamMember() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addTeamMember, { ok: false, message: null });
  const [role, setRole] = useState<'staff' | 'admin'>('staff');

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium text-navy">Their Google email</span>
        <input name="email" type="email" required autoComplete="off" placeholder="name@gmail.com" className={inputClass} />
        <span className="mt-1.5 block text-[12.5px] text-muted">The Gmail or Google Workspace address they will sign in with.</span>
      </label>

      <fieldset>
        <legend className="mb-2 text-[14px] font-medium text-navy">What can they do?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                'flex cursor-pointer gap-3 rounded-xl border-2 p-3.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
                role === r.value ? 'border-navy bg-navy/[0.03]' : 'border-line hover:border-navy/30'
              )}
            >
              <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="mt-1 h-4 w-4 accent-navy" />
              <span>
                <span className="block font-medium text-navy">{r.title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.message && (
        <p role={state.ok ? 'status' : 'alert'} className={cn('flex gap-2 rounded-xl px-3.5 py-3 text-[14px]', state.ok ? 'bg-good/10 text-ink' : 'bg-danger/10 text-danger')}>
          {state.ok && <CircleCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />}
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass('navy', 'md')}>
        <UserPlus size={17} aria-hidden="true" />
        {pending ? 'Adding…' : 'Add to the team'}
      </button>
    </form>
  );
}

/** Remove asks first: it takes away their access straight away. */
export function RemoveMember({ email }: { email: string }) {
  return (
    <form
      action={removeTeamMember}
      onSubmit={(e) => {
        if (!window.confirm(`Remove ${email} from the team? They lose access to the staff portal straight away.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="email" value={email} />
      <button type="submit" className="rounded-full px-3 py-1.5 text-[13px] font-medium text-danger hover:bg-danger/10">
        Remove
      </button>
    </form>
  );
}

/** The link to send new team members. */
export function CopySignInLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt('Copy this link:', url);
        }
      }}
      className={buttonClass('outline-light', 'sm')}
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {copied ? 'Link copied' : 'Copy the staff sign-in link'}
    </button>
  );
}
