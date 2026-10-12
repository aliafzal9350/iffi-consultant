'use client';

import React, { forwardRef } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { usePathname, useRouter, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: NextLinkProps['href'];
  to?: NextLinkProps['href'];
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

/** Universal Link that seamlessly accepts either `href` or `to` */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, to, children, ...props },
  ref
) {
  const target = href ?? to ?? '#';
  return (
    <NextLink ref={ref} href={target} {...props}>
      {children}
    </NextLink>
  );
});

export interface NavLinkProps extends Omit<LinkProps, 'className'> {
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string);
}

/** NavLink with active state calculation based on Next.js usePathname */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { href, to, end = false, className, children, ...props },
  ref
) {
  const pathname = usePathname() || '/';
  const target = (href ?? to ?? '#').toString();

  const isActive = end
    ? pathname === target
    : target === '/'
    ? pathname === '/'
    : pathname.startsWith(target);

  const computedClass = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <NextLink ref={ref} href={target} className={computedClass} {...props}>
      {children}
    </NextLink>
  );
});

/** Next.js compatible useLocation */
export function useLocation() {
  const pathname = usePathname() || '/';
  return {
    pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null,
    key: 'default',
  };
}

/** Next.js compatible useNavigate */
export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to === -1 && typeof window !== 'undefined') window.history.back();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

/** Next.js compatible useParams */
export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  const params = useNextParams();
  return (params || {}) as T;
}

export interface SetURLSearchParamsOptions {
  replace?: boolean;
  preventScrollReset?: boolean;
  scroll?: boolean;
}

/** Next.js compatible useSearchParams */
export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, options?: SetURLSearchParamsOptions) => void
] {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/';

  const current = new URLSearchParams(searchParams ? searchParams.toString() : '');

  const setSearchParams = (
    next: URLSearchParams | Record<string, string>,
    options?: SetURLSearchParamsOptions
  ) => {
    const qs = next instanceof URLSearchParams ? next.toString() : new URLSearchParams(next).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    const scroll = options?.scroll ?? (options?.preventScrollReset ? false : false);
    if (options?.replace) {
      router.replace(url, { scroll });
    } else {
      router.push(url, { scroll });
    }
  };

  return [current, setSearchParams];
}
