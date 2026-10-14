'use client';
/** "I have fixed it": the student tells IFFI that what was asked for is done, with an optional message. */
import { useActionState } from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';
import { inputClass } from '@/components/ui/Form';
import { markFixed, type ActionResult } from '@/lib/portal/apply-actions';

export function MarkFixed({ appId }: { appId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(markFixed, { ok: false });
  if (state.ok)
    return (
      <p role="status" className="flex gap-2 rounded-xl bg-good/10 px-4 py-3 text-[14px] text-ink">
        <CircleCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />
        {state.message}
      </p>
    );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={appId} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy">
          Message for IFFI <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea name="note" rows={2} maxLength={1000} placeholder="For example: I uploaded a clearer passport scan." className={cn(inputClass, 'min-h-20 py-3')} />
      </label>
      {state.message && (
        <p role="alert" className="text-[14px] font-medium text-danger">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass('navy', 'md')}>
        {pending ? 'Sending…' : 'I have fixed it: tell IFFI'}
      </button>
    </form>
  );
}
