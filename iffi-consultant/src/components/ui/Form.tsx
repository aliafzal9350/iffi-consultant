'use client';
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
}

/** Label + control + hint/error wired with aria-describedby. */
export function Field({ label, hint, error, required, children, className, dark, id: fixedId }: FieldProps) {
  const generated = useId();
  const id = fixedId ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className={cn('mb-1.5 block text-sm font-medium', dark ? 'text-white' : 'text-navy')}>
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
      </label>
      {children({ id, describedBy })}
      {hint && (
        <p id={hintId} className={cn('mt-1.5 text-[13px]', dark ? 'text-mist/80' : 'text-muted')}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="mt-1.5 text-[13px] font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'block w-full min-h-11 rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted transition-colors hover:border-navy/30 focus:border-navy focus:outline-none focus-visible:outline-2 focus-visible:outline-gold aria-[invalid=true]:border-danger';

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<'select'>) {
  return (
    <div className={cn('relative', className)}>
      <select {...props} className={cn(inputClass, 'appearance-none pr-10')}>
        {children}
      </select>
      <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

interface SliderProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'onChange'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValue: (v: number) => void;
}

export function Slider({ value, min, max, step = 1, onValue, className, ...props }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValue(Number(e.target.value))}
      className={cn('gj-range h-11 w-full cursor-pointer appearance-none bg-transparent', className)}
      style={{ ['--pct' as string]: `${pct}%` }}
      {...props}
    />
  );
}
