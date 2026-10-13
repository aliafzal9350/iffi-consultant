import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the signed-in areas. The public site never runs this, so its pages stay static and fast.
export const config = {
  matcher: ['/portal/:path*', '/staff/:path*'],
};
