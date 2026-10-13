'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from '@/lib/router';
import { cn } from '@/lib/cn';
import { Avatar } from './Avatar';

interface Props {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  isStaff: boolean;
}

/** Avatar button + small menu: who is signed in, profile, staff console (staff only), sign out. */
export function AccountMenu({ name, email, avatarUrl, isStaff }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-ink hover:bg-paper focus-visible:bg-paper';

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 text-white transition-colors hover:bg-white/[0.06]"
      >
        <Avatar name={name} src={avatarUrl} size={34} />
        <span className="hidden max-w-[10rem] truncate text-[14px] sm:block">{name?.split(' ')[0] ?? 'Account'}</span>
        <ChevronDown size={16} aria-hidden="true" className={cn('text-mist transition-transform duration-200', open && 'rotate-180')} />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div id={menuId} className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 rounded-card border border-line bg-white p-2 shadow-lift">
          <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
            <Avatar name={name} src={avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium text-navy">{name ?? 'Your account'}</p>
              <p className="truncate text-[13px] text-muted">{email}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link to="/portal/profile" className={item} onClick={() => setOpen(false)}>
              <UserRound size={17} aria-hidden="true" className="text-muted" /> My profile
            </Link>
            {isStaff && (
              <Link to="/staff" className={item} onClick={() => setOpen(false)}>
                <ShieldCheck size={17} aria-hidden="true" className="text-muted" /> Staff portal
              </Link>
            )}
            <form action="/auth/sign-out" method="post">
              <button type="submit" className={item}>
                <LogOut size={17} aria-hidden="true" className="text-muted" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
