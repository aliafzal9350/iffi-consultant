'use client';
import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';

/** Sends one analytics event when the page opens, then drops the query flag so a reload does not send it again. */
export function TrackEvent({ event, dropParam }: { event: string; dropParam?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event);
    if (dropParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete(dropParam);
      window.history.replaceState(window.history.state, '', url);
    }
  }, [event, dropParam]);
  return null;
}
