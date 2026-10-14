'use client';
import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';

/**
 * Signed in? Looks for Supabase's session cookie instead of loading the Supabase client, so the static public pages
 * stay light. This is only a hint for which button to show - the portal itself checks the session properly.
 */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSignedIn(document.cookie.split('; ').some((c) => /^sb-[a-z0-9]+-auth-token(\.\d+)?=/.test(c)));
  }, []);
  return signedIn;
}

/** Header buttons: "Log in" + "Get started" for visitors, "My portal" once signed in. */
export function AccountCta({ compact }: { compact?: boolean }) {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <Link to="/portal" className={buttonClass('gold', 'sm', compact ? 'h-9 px-4 text-[13px]' : 'md:h-10 md:px-5')}>
        My portal
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-1">
      {!compact && (
        // hidden on small laptops so the main navigation never wraps; "Get started" leads to the same page
        <Link to="/portal/sign-in?mode=login" className={cn(buttonClass('ghost-light', 'sm'), 'max-xl:hidden md:h-10')}>
          Log in
        </Link>
      )}
      <Link to="/portal/sign-in?mode=signup" className={buttonClass('gold', 'sm', compact ? 'h-9 px-4 text-[13px]' : 'md:h-10 md:px-5')}>
        Get started
      </Link>
    </span>
  );
}
