import type { Metadata, Viewport } from 'next';
import { Fraunces, Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import '@/index.css';
import { site } from '@/data/content';
import { brandKeywords } from '@/data/keywords';
import { organizationLd } from '@/lib/seo';
import { OG_IMAGE_PATH } from '@/lib/metadata';
import { Layout } from '@/components/layout/Layout';
import { Footer } from '@/components/layout/Footer';
import { JsonLd } from '@/components/ui/Seo';
import { ListsProvider } from '@/hooks/useLists';

// Variable font: one file per style instead of one per weight. Only the upright style is preloaded;
// the italic (one line in the hero) loads when it is first used.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const frauncesItalic = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces-italic',
  style: 'italic',
  preload: false,
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
});

// Chinese province names only: a 14 KB subset of Noto Serif SC 600, self-hosted (no render-blocking
// request to Google). Regenerate from fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&text=...
// if a province or city with new characters is added.
const notoSc = localFont({
  src: './fonts/noto-serif-sc-600-subset.woff2',
  weight: '600',
  display: 'swap',
  variable: '--font-noto-sc',
  preload: false,
});

export const viewport: Viewport = {
  themeColor: '#0d1f3f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const defaultTitle = site.seo.routes['/'].title;
const defaultDescription = site.seo.routes['/'].description;

export const metadata: Metadata = {
  metadataBase: new URL(site.seo.siteUrl),
  title: { default: defaultTitle, template: '%s' },
  description: defaultDescription,
  applicationName: site.brand.name,
  keywords: brandKeywords(),
  alternates: { canonical: '/' },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: '/',
    siteName: site.brand.name,
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: site.brand.name }],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: defaultTitle, description: defaultDescription, images: [OG_IMAGE_PATH] },
  icons: { icon: '/favicon-48.png', apple: '/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};

// the assistant button appears only when the server has a Gemini key (decided at build time)
const assistantEnabled = Boolean(process.env.GEMINI_API_KEY) && process.env.NEXT_PUBLIC_ASSISTANT !== 'off';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${frauncesItalic.variable} ${poppins.variable} ${notoSc.variable} js`}>
      <body>
        <JsonLd data={[organizationLd()]} />
        <ListsProvider>
          <Layout footer={<Footer />} assistant={assistantEnabled}>
            {children}
          </Layout>
        </ListsProvider>
      </body>
    </html>
  );
}
