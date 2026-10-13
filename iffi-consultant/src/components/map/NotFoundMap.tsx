'use client';
import dynamic from 'next/dynamic';
import { useNavigate } from '@/lib/router';
import { provincePath } from '@/lib/paths';

// The 404 page is part of every route's tree: load the map (and its province data) only when a 404 renders.
const MiniMap = dynamic(() => import('./MiniMap').then((m) => m.MiniMap), { ssr: false });

export function NotFoundMap() {
  const navigate = useNavigate();
  return <MiniMap onSelect={(name) => navigate(provincePath(name))} ariaLabel="Map of China: provinces with programmes are gold" />;
}
