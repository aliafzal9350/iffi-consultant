'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Heart, Mail, Menu, Phone } from 'lucide-react';
import { Link, NavLink, useLocation } from '@/lib/router';
import { site } from '@/data/content';
import { cn } from '@/lib/cn';
import { TOOLS } from '@/lib/toolsMeta';
import { Wordmark } from '@/components/ui/Logo';
import { WhatsAppButton } from '@/components/ui/Button';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';
import { Container } from '@/components/ui/primitives';
import { useLists } from '@/hooks/useLists';
import { MobileMenu } from './MobileMenu';

export function TopBar() {
  return (
    <div className="hidden h-10 bg-navy text-[13px] text-mist md:block" data-noprint>
      <Container className="flex h-full items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {site.social.email && (
            <a href={site.social.email} className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={14} aria-hidden="true" className="text-gold-2" />
              {site.contact.email}
            </a>
          )}
          <a href={site.social.phone} className="inline-flex items-center gap-2 hover:text-white transition-colors">
            <Phone size={14} aria-hidden="true" className="text-gold-2" />
            {site.contact.phoneDisplay}
          </a>
          <span className="hidden items-center gap-1 xl:flex">
            {site.social.facebook && (
              <SocialLink href={site.social.facebook} label={`${site.brand.name} on Facebook`}>
                <FacebookIcon size={15} />
              </SocialLink>
            )}
            {site.social.instagram && (
              <SocialLink href={site.social.instagram} label={`${site.brand.name} on Instagram`}>
                <InstagramIcon size={15} />
              </SocialLink>
            )}
            <SocialLink href={site.social.whatsapp} label={`Chat with ${site.brand.name} on WhatsApp`}>
              <WhatsAppIcon size={15} />
            </SocialLink>
          </span>
        </div>
        <Link href="/contact" className="font-medium text-gold-2 hover:text-white transition-colors">
          Free consultation
        </Link>
      </Container>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors">
      {children}
    </a>
  );
}

function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const { pathname } = useLocation();
  const active = pathname.startsWith('/tools');

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        wrap.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseEnter={() => {
        if (typeof window !== 'undefined') window.clearTimeout(timer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (typeof window !== 'undefined') {
          timer.current = window.setTimeout(() => setOpen(false), 240);
        }
      }}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="flex items-center">
        <Link
          href="/tools"
          className={cn(
            navLinkClass(active),
            'inline-flex items-center gap-1 py-2 font-medium',
            open && 'text-white'
          )}
        >
          Tools
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="tools-menu"
          aria-label="Toggle tools menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-mist hover:text-white transition-colors"
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={cn('transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
      </div>

      <div
        id="tools-menu"
        hidden={!open}
        className="absolute left-1/2 top-full z-50 w-[380px] -translate-x-1/2 pt-3 before:absolute before:inset-x-0 before:-top-3.5 before:h-4 before:content-['']"
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-2 p-2 shadow-[0_24px_60px_rgba(5,12,28,0.55)]">
          {TOOLS.map((t) => (
            <Link
              key={t.id}
              href={t.path}
              onClick={() => setOpen(false)}
              className="group flex gap-3.5 rounded-xl p-3 hover:bg-white/[0.06] transition-colors"
            >
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-2 ring-1 ring-gold/30">
                <t.icon size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-white group-hover:text-gold-2 transition-colors">
                  {t.name}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-mist/85">
                  {t.description}
                </span>
              </span>
            </Link>
          ))}
          <Link
            href="/tools"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl border-t border-white/10 px-3 py-2.5 text-[13px] font-medium text-gold-2 hover:bg-white/[0.06] transition-colors"
          >
            Explore all study tools →
          </Link>
        </div>
      </div>
    </div>
  );
}

const navLinkClass = (active: boolean) =>
  cn(
    'relative rounded-md px-1 py-1.5 text-[14px] xl:text-[14.5px] font-medium transition-colors duration-200',
    'after:absolute after:inset-x-1 after:-bottom-0.5 after:h-[2px] after:origin-left after:bg-gold-2 after:transition-transform after:duration-300',
    active
      ? 'text-white after:scale-x-100'
      : 'text-mist/90 hover:text-white after:scale-x-0 hover:after:scale-x-100'
  );

export function ShortlistButton({ className }: { className?: string }) {
  const { shortlist, setShortlistOpen } = useLists();
  return (
    <button
      type="button"
      onClick={() => setShortlistOpen(true)}
      className={cn(
        'relative inline-flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full text-mist hover:bg-white/10 hover:text-white transition-colors',
        className
      )}
      aria-label={`Shortlist, ${shortlist.length} ${shortlist.length === 1 ? 'programme' : 'programmes'}`}
    >
      <Heart size={20} aria-hidden="true" />
      {shortlist.length > 0 && (
        <span className="tabular absolute right-1 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-navy">
          {shortlist.length}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Keep all navigation items, clean spacing
  const nav = site.navigation;

  return (
    <>
      <header
        data-site-header
        className={cn(
          'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300',
          scrolled
            ? 'border-white/10 bg-navy-2/[0.98] shadow-[0_8px_30px_rgba(5,12,28,0.45)] backdrop-blur-md'
            : 'border-white/5 bg-navy-2'
        )}
      >
        <Container className="flex h-[66px] items-center justify-between gap-3 md:h-[74px]">
          <Wordmark eager />

          {/* Desktop Navigation - visible starting at lg (1024px+) */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-3.5 xl:gap-5">
              {nav.map((item) => (
                <li key={item.path}>
                  {item.children ? (
                    <ToolsMenu />
                  ) : (
                    <NavLink
                      href={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        navLinkClass(
                          isActive ||
                            (item.path === '/programmes' && pathname.startsWith('/provinces'))
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShortlistButton />
            <span className="hidden sm:block">
              <WhatsAppButton
                messageKey="heroConsultation"
                variant="gold"
                size="sm"
                className="md:h-10 md:px-5"
              >
                Free Consultation
              </WhatsAppButton>
            </span>
            <button
              type="button"
              className="inline-flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden transition-colors"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
