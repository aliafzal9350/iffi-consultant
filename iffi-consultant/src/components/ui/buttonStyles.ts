import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'gold' | 'navy' | 'outline' | 'outline-light' | 'ghost' | 'ghost-light' | 'whatsapp';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-premium)] disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
  gold: 'bg-gold text-navy shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_6px_18px_rgba(200,162,76,0.28)] hover:bg-gold-2 active:bg-gold-deep',
  navy: 'bg-navy text-white hover:bg-navy-3 shadow-soft',
  outline: 'border border-navy/20 text-navy bg-white/60 hover:border-navy/50 hover:bg-white',
  'outline-light': 'border border-white/25 text-white hover:border-gold-2/70 hover:text-gold-2 bg-white/[0.03]',
  ghost: 'text-navy hover:bg-navy/5',
  'ghost-light': 'text-mist hover:text-white hover:bg-white/5',
  whatsapp: 'bg-whatsapp text-navy hover:brightness-105 shadow-[0_6px_18px_rgba(37,211,102,0.25)]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-[52px] px-7 text-base',
};

export interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function buttonClass(variant: ButtonVariant = 'gold', size: ButtonSize = 'md', extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}
