'use client';

import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { usePathname, useRouter, useParams as useNextParams } from 'next/navigation';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: NextLinkProps['href'];
  to?: NextLinkProps['href'];
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

/**
 * Prefetch on intent instead of on sight. Next prefetches every link that scrolls into view; on a page with
 * 60+ links that is a burst of requests while a phone is still loading. Hover, focus or touch is early enough
 * for an instant navigation. Pass prefetch={true} to opt a link back into viewport prefetching.
 */
function useIntentPrefetch(target: NextLinkProps['href'], prefetch: boolean | undefined) {
  const router = useRouter();
  const done = React.useRef(false);
  return useCallback(() => {
    if (prefetch !== undefined || done.current || typeof target !== 'string' || !target.startsWith('/')) return;
    done.current = true;
    router.prefetch(target);
  }, [router, target, prefetch]);
}

/** Universal Link that seamlessly accepts either `href` or `to` */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, to, children, prefetch, onMouseEnter, onTouchStart, onFocus, ...props },
  ref
) {
  const target = href ?? to ?? '#';
  const warm = useIntentPrefetch(target, prefetch);
  return (
    <NextLink
      ref={ref}
      href={target}
      prefetch={prefetch ?? false}
      onMouseEnter={(e) => (warm(), onMouseEnter?.(e))}
      onTouchStart={(e) => (warm(), onTouchStart?.(e))}
      onFocus={(e) => (warm(), onFocus?.(e))}
      {...props}
    >
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
  { href, to, end = false, className, children, prefetch, ...props },
  ref
) {
  const pathname = usePathname() || '/';
  const target = (href ?? to ?? '#').toString();
  const warm = useIntentPrefetch(target, prefetch);

  const isActive = end
    ? pathname === target
    : target === '/'
    ? pathname === '/'
    : pathname.startsWith(target);

  const computedClass = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <NextLink ref={ref} href={target} className={computedClass} prefetch={prefetch ?? false} onMouseEnter={warm} onTouchStart={warm} onFocus={warm} {...props}>
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

/**
 * Query-string state without Next's useSearchParams. That hook makes a statically generated page render
 * nothing on the server (client-side rendering bailout), so the finder and cost calculator lost their HTML.
 * Here the server and the hydration render see no params (the default view); the real query string is read
 * after mount, and updates go through the History API, which the Next router picks up.
 */
export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, options?: SetURLSearchParamsOptions) => void
] {
  const [search, setSearch] = useState('');
  useEffect(() => {
    const read = () => setSearch(window.location.search);
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const current = useMemo(() => new URLSearchParams(search), [search]);

  const setSearchParams = useCallback((next: URLSearchParams | Record<string, string>, options?: SetURLSearchParamsOptions) => {
    const qs = next instanceof URLSearchParams ? next.toString() : new URLSearchParams(next).toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    if (options?.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setSearch(qs ? `?${qs}` : '');
  }, []);

  return [current, setSearchParams];
}
