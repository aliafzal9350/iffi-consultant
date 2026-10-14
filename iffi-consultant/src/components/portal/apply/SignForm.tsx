'use client';
/** The declaration from the official form, ticked point by point, then signed by typing the passport name. */
import { useActionState, useState } from 'react';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';
import { inputClass } from '@/components/ui/Form';
import { signApplication, type ActionResult } from '@/lib/portal/apply-actions';
import { DECLARATION } from '@/lib/portal/policy';

export function SignForm({ appId, expectedName, disabled }: { appId: string; expectedName: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(signApplication, { ok: false });
  const [ticked, setTicked] = useState<boolean[]>(DECLARATION.points.map(() => false));
  const [name, setName] = useState('');
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={appId} />
      <fieldset disabled={disabled} className="space-y-3">
        <legend className="mb-3 text-[15px] font-medium text-navy">
          I hereby affirm that <span lang="zh" className="font-zh ml-1 text-[13px] font-normal text-muted">申请人保证</span>
        </legend>
        {DECLARATION.points.map((p, i) => (
          <label
            key={i}
            className={cn(
              'flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
              ticked[i] ? 'border-navy bg-navy/[0.03]' : 'border-line hover:border-navy/30'
            )}
          >
            <input
              type="checkbox"
              name={`agree${i}`}
              checked={ticked[i]}
              onChange={(e) => setTicked((t) => t.map((v, k) => (k === i ? e.target.checked : v)))}
              className="mt-1 h-5 w-5 shrink-0 accent-navy"
            />
            <span>
              <span className="block text-[14.5px] text-ink">
                {i + 1}. {p.en}
              </span>
              <span lang="zh" className="font-zh mt-1 block text-[13px] text-muted">
                {p.zh}
              </span>
            </span>
          </label>
        ))}

        <div className="grid gap-4 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Your signature: type your name as in your passport</span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder={expectedName || 'Full name'}
              className={cn(inputClass, 'h-14 font-display text-[1.25rem] italic')}
            />
            {expectedName && <span className="mt-1.5 block text-[13px] text-muted">Type: {expectedName}</span>}
          </label>
          <p className="text-[14px] text-muted sm:pb-4">
            Date <span className="ml-1 font-medium text-ink">{today}</span>
          </p>
        </div>
      </fieldset>

      {state.message && !state.ok && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={disabled || pending || ticked.some((t) => !t) || name.trim().length < 2} className={buttonClass('gold', 'lg', 'w-full sm:w-auto')}>
        <PenLine size={18} aria-hidden="true" /> {pending ? 'Signing…' : 'Sign my application'}
      </button>
      <p className="text-[13px] text-muted">Signing online records your name, the date and the declaration version. You still sign the printed form by hand.</p>
    </form>
  );
}
