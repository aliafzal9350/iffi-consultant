import type { ComponentPropsWithoutRef } from 'react';
import { Link } from '@/lib/router';
import { buttonClass, type Common } from './buttonStyles';

export { buttonClass, type ButtonSize, type ButtonVariant, type Common } from './buttonStyles';

type AsButton = Common & ComponentPropsWithoutRef<'button'> & { to?: undefined; href?: undefined };
type AsLink = Common & { to: string; href?: undefined } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>;
type AsAnchor = Common & { href: string; to?: undefined } & ComponentPropsWithoutRef<'a'>;

export type ButtonProps = AsButton | AsLink | AsAnchor;

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

/** WhatsApp CTA lives in its own client file (it tracks clicks); re-exported so imports stay the same. */
export { WhatsAppButton } from './WhatsAppButton';
