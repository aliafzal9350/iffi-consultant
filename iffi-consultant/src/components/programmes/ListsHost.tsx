'use client';
import dynamic from 'next/dynamic';
import { useLists } from '@/hooks/useLists';

// The drawers need the full programme list (~220 KB). Load them only once a visitor has used the
// shortlist or compare buttons, so first-time visitors never download it on content pages.
const ShortlistDrawer = dynamic(() => import('./Lists').then((m) => m.ShortlistDrawer), { ssr: false });
const CompareDrawer = dynamic(() => import('./Lists').then((m) => m.CompareDrawer), { ssr: false });
const CompareTray = dynamic(() => import('./Lists').then((m) => m.CompareTray), { ssr: false });
const PrintShortlist = dynamic(() => import('./Lists').then((m) => m.PrintShortlist), { ssr: false });

export function ListsHost() {
  const { shortlist, compare, shortlistOpen, compareOpen } = useLists();
  return (
    <>
      {compare.length > 0 && <CompareTray />}
      {(shortlistOpen || shortlist.length > 0) && <ShortlistDrawer />}
      {(compareOpen || compare.length > 0) && <CompareDrawer />}
      {shortlist.length > 0 && <PrintShortlist />}
    </>
  );
}
