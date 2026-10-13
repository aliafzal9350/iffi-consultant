import type { Metadata } from 'next';

// Private pages: never indexed. They read the session cookie, so they render per request.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
