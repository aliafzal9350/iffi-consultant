'use client';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { buttonClass, type ButtonSize, type ButtonVariant } from '@/components/ui/buttonStyles';

/** Submit button for server-action forms: disables itself and shows `pending` while the action runs. */
export function SubmitButton({ children, pending: pendingLabel, variant = 'navy', size = 'md', className }: { children: ReactNode; pending: ReactNode; variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, size, className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}
