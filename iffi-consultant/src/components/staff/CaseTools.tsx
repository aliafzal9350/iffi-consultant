'use client';
/**
 * The staff controls on an application page: accept or reject a file, confirm a payment, put an adviser in charge,
 * set the fees, and write notes. Each one is a small form on a Server Function in lib/staff/actions.ts.
 */
import { useActionState, useState } from 'react';
import { Check, CircleCheck, EyeOff, MessageSquare, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Select, inputClass } from '@/components/ui/Form';
import { addNote, reviewDocument, reviewPayment, saveCase, type ActionState } from '@/lib/staff/actions';
import type { TeamMember } from '@/lib/staff/queries';

const START: ActionState = { ok: false, message: null };

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p role={state.ok ? 'status' : 'alert'} className={cn('flex gap-2 rounded-xl px-3 py-2 text-[13px]', state.ok ? 'bg-good/10 text-ink' : 'bg-danger/10 text-danger')}>
      {state.ok && <CircleCheck size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />}
      {state.message}
    </p>
  );
}

/** Accept / ask for a new file. A rejection needs a note: the student reads it next to the file. */
export function DocReview({ id, status }: { id: string; status: 'pending' | 'accepted' | 'rejected' }) {
  const [asking, setAsking] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await reviewDocument(prev, fd);
    if (res.ok) setAsking(false);
    return res;
  }, START);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {!asking ? (
        <div className="flex flex-wrap gap-2">
          {status !== 'accepted' && (
            <button type="submit" name="verdict" value="accepted" disabled={pending} className={buttonClass('navy', 'sm')}>
              <Check size={15} aria-hidden="true" /> Accept
            </button>
          )}
          {status !== 'rejected' && (
            <button type="button" onClick={() => setAsking(true)} className={buttonClass('outline', 'sm')}>
              <RotateCcw size={15} aria-hidden="true" /> Ask for a new file
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            name="note"
            rows={2}
            maxLength={1000}
            required
            autoFocus
            placeholder="What is wrong? e.g. The photo page is cut off at the bottom: the two code lines must be visible."
            className={cn(inputClass, 'min-h-20 py-2.5 text-[14px]')}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="verdict" value="rejected" disabled={pending} className={buttonClass('navy', 'sm')}>
              {pending ? 'Sending…' : 'Send to the student'}
            </button>
            <button type="button" onClick={() => setAsking(false)} className={buttonClass('ghost', 'sm')}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <Message state={state} />
    </form>
  );
}

/** Confirm the money arrived, or say it was not found (the student is asked to check, with the note). */
export function PaymentReview({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewPayment, START);
  const [rejecting, setRejecting] = useState(false);
  if (state.ok) return <Message state={state} />;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <button type="submit" name="verdict" value="verified" disabled={pending} className={buttonClass('navy', 'sm')}>
            <Check size={15} aria-hidden="true" /> Received in our account
          </button>
          <button type="button" onClick={() => setRejecting(true)} className={buttonClass('outline', 'sm')}>
            <X size={15} aria-hidden="true" /> Not found
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea name="note" rows={2} maxLength={1000} required autoFocus placeholder="e.g. No payment with this transaction ID reached our account. Please check the ID." className={cn(inputClass, 'min-h-20 py-2.5 text-[14px]')} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="verdict" value="rejected" disabled={pending} className={buttonClass('navy', 'sm')}>
              {pending ? 'Sending…' : 'Send to the student'}
            </button>
            <button type="button" onClick={() => setRejecting(false)} className={buttonClass('ghost', 'sm')}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <Message state={state} />
    </form>
  );
}

/** The adviser in charge and IFFI's fees for this application (they depend on the scholarship). */
export function CaseForm({
  id,
  team,
  assignedTo,
  applicationFee,
  serviceCharge,
  defaultFee,
}: {
  id: string;
  team: TeamMember[];
  assignedTo: string | null;
  applicationFee: number | null;
  serviceCharge: number | null;
  defaultFee: number | null;
}) {
  const [state, action, pending] = useActionState(saveCase, START);
  const [v, setV] = useState({ assigned_to: assignedTo ?? '', application_fee_usd: applicationFee?.toString() ?? '', service_charge_usd: serviceCharge?.toString() ?? '' });
  const bind = (name: keyof typeof v) => ({ name, value: v[name], onChange: (e: { target: { value: string } }) => setV((cur) => ({ ...cur, [name]: e.target.value })) });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-medium text-navy">Adviser in charge</span>
        <Select {...bind('assigned_to')}>
          <option value="">Nobody yet</option>
          {team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name ?? t.email}
            </option>
          ))}
        </Select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[13.5px] font-medium text-navy">Application fee (RMB)</span>
          <input {...bind('application_fee_usd')} inputMode="decimal" placeholder={defaultFee != null ? `${defaultFee} (default)` : 'Not set'} className={cn(inputClass, 'tabular')} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13.5px] font-medium text-navy">Service charge (RMB)</span>
          <input {...bind('service_charge_usd')} inputMode="decimal" placeholder="After JW202" className={cn(inputClass, 'tabular')} />
        </label>
      </div>
      <p className="text-[12.5px] text-muted">The student sees these amounts on the payment step. Leave the fee empty to use the default for the level (Settings).</p>
      <Message state={state} />
      <button type="submit" disabled={pending} className={buttonClass('outline', 'sm')}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

/** A note for the team only, or a message the student sees in their history. */
export function NoteForm({ id }: { id: string }) {
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<'staff' | 'student'>('staff');
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const res = await addNote(prev, fd);
    if (res.ok) setText(''); // keep the text when saving failed
    return res;
  }, START);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="note"
        rows={3}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={visibility === 'staff' ? 'e.g. Called the father: bank statement coming next week.' : 'e.g. Your documents look good. We send them to the university this week.'}
        className={cn(inputClass, 'min-h-24 py-3 text-[14px]')}
      />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Who sees this note">
        {(
          [
            ['staff', 'Team only', EyeOff],
            ['student', 'Send to the student', MessageSquare],
          ] as const
        ).map(([value, label, Icon]) => (
          <label
            key={value}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
              visibility === value ? 'border-navy bg-navy text-white' : 'border-line text-navy hover:border-navy/30'
            )}
          >
            <input type="radio" name="visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} className="sr-only" />
            <Icon size={13} aria-hidden="true" /> {label}
          </label>
        ))}
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending || text.trim().length < 2} className={buttonClass('navy', 'sm')}>
        {pending ? 'Saving…' : visibility === 'staff' ? 'Save note' : 'Send'}
      </button>
    </form>
  );
}
