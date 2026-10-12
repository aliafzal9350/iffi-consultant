'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { KEYS, readJSON, writeJSON } from '@/lib/storage';
import { track } from '@/lib/analytics';

/**
 * Shortlist (localStorage, max 10) and compare tray (sessionStorage, max 3).
 * Both start empty on the server and on the hydration render, then load from storage.
 */
interface ListsState {
  shortlist: string[];
  compare: string[];
  toggleShortlist: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearShortlist: () => void;
  clearCompare: () => void;
  shortlistOpen: boolean;
  setShortlistOpen: (v: boolean) => void;
  compareOpen: boolean;
  setCompareOpen: (v: boolean) => void;
  notice: string;
  notify: (msg: string) => void;
}

const ListsContext = createContext<ListsState | null>(null);
// Same values as tools.json finder.shortlistMax / compareMax. Kept here so this provider, which wraps every
// page, does not pull the tools config (or any programme data) into the shared bundle.
const SHORTLIST_MAX = 10;
const COMPARE_MAX = 3;

// Programme ids look like B-01, M-12, MB-03. Ids of programmes that were later removed are skipped by the drawers.
const ID = /^[A-Z]{1,3}-\d{1,3}$/;
const valid = (ids: unknown): string[] => (Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string' && ID.test(x)).slice(0, SHORTLIST_MAX) : []);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // only touch state when something was stored, so a first visit causes no re-render during hydration
    const storedShortlist = valid(readJSON(KEYS.shortlist, []));
    const storedCompare = valid(readJSON(KEYS.compare, [], 'session'));
    if (storedShortlist.length) setShortlist(storedShortlist);
    if (storedCompare.length) setCompare(storedCompare);
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.shortlist) setShortlist(valid(readJSON(KEYS.shortlist, [])));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (loaded) writeJSON(KEYS.shortlist, shortlist);
  }, [shortlist, loaded]);
  useEffect(() => {
    if (loaded) writeJSON(KEYS.compare, compare, 'session');
  }, [compare, loaded]);

  const say = useCallback((msg: string) => {
    setNotice('');
    window.setTimeout(() => setNotice(msg), 30);
  }, []);

  const listRef = useRef({ shortlist, compare });
  listRef.current = { shortlist, compare };

  const toggleShortlist = useCallback((id: string) => {
    const cur = listRef.current.shortlist;
    if (cur.includes(id)) {
      setShortlist(cur.filter((x) => x !== id));
      say(`Removed ${id} from your shortlist`);
    } else if (cur.length >= SHORTLIST_MAX) {
      say(`Your shortlist is full (${SHORTLIST_MAX}). Remove one to add another.`);
    } else {
      setShortlist([...cur, id]);
      say(`Added ${id} to your shortlist`);
      track('shortlist_add', { id });
    }
  }, [say]);

  const toggleCompare = useCallback((id: string) => {
    const cur = listRef.current.compare;
    if (cur.includes(id)) setCompare(cur.filter((x) => x !== id));
    else if (cur.length >= COMPARE_MAX) say(`You can compare up to ${COMPARE_MAX} programmes. Remove one first.`);
    else {
      setCompare([...cur, id]);
      say(`Added ${id} to compare`);
    }
  }, [say]);

  const value = useMemo<ListsState>(
    () => ({
      shortlist,
      compare,
      toggleShortlist,
      toggleCompare,
      clearShortlist: () => setShortlist([]),
      clearCompare: () => setCompare([]),
      shortlistOpen,
      setShortlistOpen,
      compareOpen,
      setCompareOpen,
      notice,
      notify: say,
    }),
    [shortlist, compare, toggleShortlist, toggleCompare, shortlistOpen, compareOpen, notice, say],
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists(): ListsState {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used inside <ListsProvider>');
  return ctx;
}

export { SHORTLIST_MAX, COMPARE_MAX };
