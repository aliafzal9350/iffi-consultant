import { Link } from '@/lib/router';
import { Mail, MapPin, Phone } from 'lucide-react';
import { site } from '@/data/content';
import { TOOLS } from '@/lib/toolsMeta';
import { Container } from '@/components/ui/primitives';
import { Wordmark } from '@/components/ui/Logo';
import { WhatsAppButton } from '@/components/ui/Button';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';

const quickLinks = [
  { label: 'Programme finder', path: '/programmes' },
  { label: 'Services', path: '/services' },
  { label: 'About us', path: '/about' },
  { label: 'Study in China guides', path: '/blog' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
];

export function Footer() {
  return (
    <footer data-site-footer className="relative overflow-hidden bg-navy text-mist">
      <div className="fret-line opacity-80" aria-hidden="true" />
      <Container className="relative">
        {/* CTA row - the floating WhatsApp button hides while this is visible */}
        <div id="footer-cta" className="flex flex-col gap-6 border-b border-white/10 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight text-white">Questions about studying in China?</p>
            <p className="mt-2 text-mist">{site.contact.responsePromise}</p>
          </div>
          <WhatsAppButton messageKey="default" size="lg">
            Message us on WhatsApp
          </WhatsAppButton>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.3fr]">
          <div>
            <Wordmark size="lg" />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed">{site.brand.tagline}. Admissions, scholarships and student visas for Chinese universities.</p>
            <div className="mt-5 flex gap-2">
              {site.social.facebook && (
                <a href={site.social.facebook} target="_blank" rel="noopener" aria-label={`${site.brand.name} on Facebook`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 hover:border-gold-2 hover:text-gold-2">
                  <FacebookIcon size={17} />
                </a>
              )}
              {site.social.instagram && (
                <a href={site.social.instagram} target="_blank" rel="noopener" aria-label={`${site.brand.name} on Instagram`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 hover:border-gold-2 hover:text-gold-2">
                  <InstagramIcon size={17} />
                </a>
              )}
              <a href={site.social.whatsapp} target="_blank" rel="noopener" aria-label={`${site.brand.name} on WhatsApp`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 hover:border-gold-2 hover:text-gold-2">
                <WhatsAppIcon size={17} />
              </a>
            </div>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-sans text-sm font-semibold text-white">Explore</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {quickLinks.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="inline-flex min-h-6 items-center hover:text-gold-2">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Free tools">
            <h2 className="font-sans text-sm font-semibold text-white">Free tools</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {TOOLS.map((t) => (
                <li key={t.id}>
                  <Link to={t.path} className="inline-flex min-h-6 items-center hover:text-gold-2">
                    {t.short}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/tools" className="inline-flex min-h-6 items-center hover:text-gold-2">
                  All tools
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-sans text-sm font-semibold text-white">Contact</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li>
                <a href={site.social.phone} className="inline-flex items-center gap-2.5 hover:text-gold-2">
                  <Phone size={16} aria-hidden="true" className="text-gold-2" />
                  {site.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={site.social.whatsapp} target="_blank" rel="noopener" className="inline-flex items-center gap-2.5 hover:text-gold-2">
                  <WhatsAppIcon size={16} className="text-gold-2" />
                  WhatsApp, {site.contact.hours.replace('Open ', '').replace(' on WhatsApp', '')}
                </a>
              </li>
              {site.social.email && (
                <li>
                  <a href={site.social.email} className="inline-flex items-center gap-2.5 hover:text-gold-2">
                    <Mail size={16} aria-hidden="true" className="text-gold-2" />
                    {site.contact.email}
                  </a>
                </li>
              )}
              <li className="flex gap-2.5">
                <MapPin size={16} aria-hidden="true" className="mt-1 shrink-0 text-gold-2" />
                <span>
                  {site.contact.offices[0].city}, {site.contact.offices[0].country}
                </span>
              </li>
              {site.legal.registeredOffice && (
                <li className="flex gap-2.5">
                  <MapPin size={16} aria-hidden="true" className="mt-1 shrink-0 text-gold-2" />
                  <span>
                    Registered office:
                    <br />
                    {site.legal.registeredOffice}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3 border-t border-white/10 py-8 text-[13px] leading-relaxed text-mist/80">
          {site.legal.footerDisclosure && <p>{site.legal.footerDisclosure}</p>}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>{site.legal.copyright}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              <li>
                <Link to="/privacy" className="inline-flex min-h-6 items-center hover:text-gold-2">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="inline-flex min-h-6 items-center hover:text-gold-2">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="inline-flex min-h-6 items-center hover:text-gold-2">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/portal/sign-in?mode=staff" className="inline-flex min-h-6 items-center hover:text-gold-2">
                  Staff login
                </Link>
              </li>
              <li>{site.legal.credit}</li>
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
