'use client';

import { useState } from 'react';
import { ChevronDown, Mail, Phone } from 'lucide-react';
import { site } from '@/data';
import { cn } from '@/lib/cn';
import { TOOLS } from '@/lib/toolsMeta';
import { Link, NavLink, useLocation } from '@/lib/router';
import { Drawer } from '@/components/ui/Drawer';
import { WhatsAppButton } from '@/components/ui/Button';
import { FacebookIcon, InstagramIcon } from '@/components/ui/BrandIcons';

/** Full-height navy sheet for phones and tablets: large tap targets, complete navigation, WhatsApp CTA. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  const [toolsExpanded, setToolsExpanded] = useState(true);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="full"
      dark
      title={<span className="text-gold-2 font-display text-xl">IFFI Global</span>}
      labelId="mobile-menu-title"
      footer={
        <div className="space-y-3 pt-2">
          <WhatsAppButton messageKey="heroConsultation" size="lg" className="w-full">
            Free Consultation on WhatsApp
          </WhatsAppButton>
          <div className="flex items-center justify-center gap-5 text-sm text-mist">
            <a href={site.social.phone} className="inline-flex min-h-11 items-center gap-2 hover:text-white">
              <Phone size={16} aria-hidden="true" className="text-gold-2" />
              Call us
            </a>
            <a href={site.social.email} className="inline-flex min-h-11 items-center gap-2 hover:text-white">
              <Mail size={16} aria-hidden="true" className="text-gold-2" />
              Email
            </a>
            <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex h-11 w-11 items-center justify-center hover:text-white">
              <FacebookIcon size={18} />
            </a>
            <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex h-11 w-11 items-center justify-center hover:text-white">
              <InstagramIcon size={18} />
            </a>
          </div>
        </div>
      }
    >
      <nav aria-label="Mobile Navigation" className="py-2">
        <ul className="divide-y divide-white/[0.08]">
          {site.navigation.map((item) => {
            const isTools = item.path === '/tools';
            const isActive =
              item.path === '/'
                ? pathname === '/'
                : pathname.startsWith(item.path);

            if (isTools) {
              return (
                <li key={item.path} className="py-2">
                  <div className="flex items-center justify-between">
                    <NavLink
                      href="/tools"
                      onClick={onClose}
                      className={cn(
                        'flex flex-1 items-center font-display text-[20px] transition-colors',
                        isActive ? 'text-gold-2' : 'text-white hover:text-gold-2'
                      )}
                    >
                      {item.label}
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => setToolsExpanded(!toolsExpanded)}
                      aria-label="Toggle study tools list"
                      className="p-2 text-mist hover:text-white"
                    >
                      <ChevronDown
                        size={18}
                        className={cn(
                          'transition-transform duration-200',
                          toolsExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  </div>
                  {toolsExpanded && (
                    <div className="mt-2 space-y-2 pl-2">
                      {TOOLS.map((t) => (
                        <Link
                          key={t.id}
                          href={t.path}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.04] p-2.5 transition-colors hover:bg-white/[0.08]"
                        >
                          <t.icon size={18} className="text-gold-2 shrink-0" />
                          <div>
                            <span className="block text-sm font-medium text-white">{t.name}</span>
                            <span className="block text-xs text-mist/75">{t.benefit}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            }

            return (
              <li key={item.path} className="py-2">
                <NavLink
                  href={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={cn(
                    'flex min-h-11 items-center font-display text-[20px] transition-colors',
                    isActive ? 'text-gold-2' : 'text-white hover:text-gold-2'
                  )}
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </Drawer>
  );
}
