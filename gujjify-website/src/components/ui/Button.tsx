'use client';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link } from '@/lib/router';
import { cn } from '@/lib/cn';
import { WhatsAppIcon } from './BrandIcons';
import { track } from '@/lib/analytics';
import { waHref, type WhatsAppKey } from '@/lib/whatsapp';

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

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type AsButton = Common & ComponentPropsWithoutRef<'button'> & { to?: undefined; href?: undefined };
type AsLink = Common & { to: string; href?: undefined } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>;
type AsAnchor = Common & { href: string; to?: undefined } & ComponentPropsWithoutRef<'a'>;

export type ButtonProps = AsButton | AsLink | AsAnchor;

export function buttonClass(variant: ButtonVariant = 'gold', size: ButtonSize = 'md', extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button(props: ButtonProps) {
  const { variant = 'gold', size = 'md', icon, iconRight, className, children, ...rest } = props;
  const cls = buttonClass(variant, size, className);
  const inner = (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  );
  if ('to' in rest && rest.to !== undefined) {
    const { to, ...a } = rest as AsLink;
    return (
      <Link to={to} className={cls} {...a}>
        {inner}
      </Link>
    );
  }
  if ('href' in rest && rest.href !== undefined) {
    const a = rest as AsAnchor;
    const external = /^https?:/.test(a.href);
    return (
      <a className={cls} {...(external ? { target: '_blank', rel: 'noopener' } : {})} {...a}>
        {inner}
      </a>
    );
  }
  const b = rest as ComponentPropsWithoutRef<'button'>;
  return (
    <button type="button" className={cls} {...b}>
      {inner}
    </button>
  );
}

interface WhatsAppButtonProps extends Omit<Common, 'icon'> {
  messageKey: WhatsAppKey;
  vars?: Record<string, string | number>;
  label?: string;
}

/** Primary CTA: opens WhatsApp in a new tab with a pre-filled message from site.whatsapp.messages. */
export function WhatsAppButton({ messageKey, vars, label, children, variant = 'whatsapp', size = 'md', className }: WhatsAppButtonProps) {
  return (
    <a
      href={waHref(messageKey, vars)}
      target="_blank"
      rel="noopener"
      className={buttonClass(variant, size, className)}
      onClick={() => track('whatsapp_click', { context: messageKey })}
    >
      <WhatsAppIcon size={size === 'sm' ? 16 : 19} />
      {children ?? label ?? 'Chat on WhatsApp'}
    </a>
  );
}
