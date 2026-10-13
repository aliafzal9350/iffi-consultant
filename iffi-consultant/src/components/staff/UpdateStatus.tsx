'use client';
import { useActionState, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Select, inputClass } from '@/components/ui/Form';
import { STATUS_LABEL, type ApplicationStatus } from '@/lib/portal/application';
import type { StatusAction } from '@/lib/portal/transitions';
import { updateStatus, type ActionState } from '@/lib/staff/actions';

interface Props {
  id: string;
  status: ApplicationStatus;
  actions: StatusAction[];
  isAdmin: boolean;
  allStatuses: ApplicationStatus[];
}

/** "What happened?" -> pick one, add a note if needed, save. The student sees the new status and the note. */
export function UpdateStatus({ id, status, actions, isAdmin, allStatuses }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateStatus, { ok: false, message: null });
  const [to, setTo] = useState<string>('');
  const [correcting, setCorrecting] = useState(false);
  const chosen = actions.find((a) => a.to === to);
  const noteRequired = correcting || Boolean(chosen?.needsNote);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      {!correcting && (
        <fieldset>
          <legend className="text-[14px] font-medium text-navy">What happened?</legend>
          {actions.length === 0 ? (
            <p className="mt-2 text-[14px] text-muted">This application is closed. Nothing else to do.</p>
          ) : (
            <div className="mt-2.5 space-y-2">
              {actions.map((a) => (
                <label
                  key={a.to}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-[14px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
                    to === a.to ? 'border-navy bg-navy/[0.03] font-medium text-navy' : 'border-line text-ink hover:border-navy/30'
                  )}
                >
                  <input type="radio" name="to" value={a.to} checked={to === a.to} onChange={() => setTo(a.to)} className="h-4 w-4 accent-navy" />
                  {a.label}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {correcting && (
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-navy">Set the status to</span>
          <Select name="to" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Choose…</option>
            {allStatuses
              .filter((s) => s !== status)
              .map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
          </Select>
        </label>
      )}

      {(to || correcting) && (
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-medium text-navy">
            Note for the student {noteRequired ? <span className="text-danger">*</span> : <span className="font-normal text-muted">(optional)</span>}
          </span>
          <textarea
            name="note"
            rows={3}
            maxLength={1000}
            placeholder={noteRequired ? 'For example: Please upload a clearer scan of your passport.' : 'For example: Your documents look good. We will send them this week.'}
            className={cn(inputClass, 'min-h-24 py-3')}
          />
          <span className="mt-1 block text-[12.5px] text-muted">They see this on their application page.</span>
        </label>
      )}

      {state.message && (
        <p role={state.ok ? 'status' : 'alert'} className={cn('flex gap-2 rounded-xl px-3.5 py-3 text-[14px]', state.ok ? 'bg-good/10 text-ink' : 'bg-danger/10 text-danger')}>
          {state.ok && <CircleCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />}
          {state.message}
        </p>
      )}

      {(to || correcting) && (
        <button type="submit" disabled={pending || !to} className={buttonClass('navy', 'md', 'w-full')}>
          {pending ? 'Saving…' : 'Save update'}
        </button>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            setCorrecting((c) => !c);
            setTo('');
          }}
          className="text-[13px] font-medium text-muted underline underline-offset-4 hover:text-navy"
        >
          {correcting ? 'Back to the normal steps' : 'Admin: correct the status by hand'}
        </button>
      )}
    </form>
  );
}
