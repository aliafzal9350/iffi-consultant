import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Poppins } from 'next/font/google';
import '@/index.css';
import { Layout } from '@/components/layout/Layout';
import { ListsProvider } from '@/hooks/useLists';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-loaded',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-loaded',
  weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#0d1f3f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.iffiglobal.com'),
  title: {
    default: 'Study in China with Scholarships | IFFI Global Education Consultants',
    template: '%s',
  },
  description:
    'Explore 72 China programmes in 21 provinces - CSC & university scholarships, costs and X1 visa support. Free eligibility check and WhatsApp counselling.',
  openGraph: {
    title: 'Study in China with Scholarships | IFFI Global Education Consultants',
    description:
      'Explore 72 China programmes in 21 provinces - CSC & university scholarships, costs and X1 visa support.',
    url: 'https://www.iffiglobal.com',
    siteName: 'IFFI Global Education Consultants',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IFFI Global Education Consultants',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Study in China with Scholarships | IFFI Global Education Consultants',
    description:
      'Explore 72 China programmes in 21 provinces - CSC & university scholarships, costs and X1 visa support.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon-48.png',
    apple: '/apple-touch-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${poppins.variable} js`}>
      <head>
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&display=swap&text=%E4%B8%8A%E4%B8%9C%E4%B8%AD%E4%BA%91%E4%BA%AC%E5%86%85%E5%88%AB%E5%8C%97%E5%8C%BA%E5%8D%97%E5%8F%A4%E5%8F%B0%E5%90%89%E5%90%BE%E5%9B%9B%E5%9B%9E%E5%9B%BD%E5%A3%AE%E5%A4%8F%E5%A4%A9%E5%AE%81%E5%AE%89%E5%B0%94%E5%B1%B1%E5%B7%9D%E5%B7%9E%E5%B8%82%E5%B9%BF%E5%BA%86%E5%BB%BA%E5%BE%BD%E6%94%BF%E6%96%87%E6%96%B0%E6%97%8F%E6%9E%97%E6%B1%9F%E6%B2%B3%E6%B2%BB%E6%B4%A5%E6%B5%99%E6%B5%B7%E6%B8%AF%E6%B9%96%E6%B9%BE%E6%BE%B3%E7%89%B9%E7%94%98%E7%96%86%E7%9C%81%E7%A6%8F%E7%BB%B4%E8%82%83%E8%87%AA%E8%8B%8F%E8%92%99%E8%97%8F%E8%A1%8C%E8%A5%BF%E8%B4%B5%E8%BE%BD%E9%87%8D%E9%97%A8%E9%99%95%E9%9D%92%E9%A6%99%E9%BB%91%E9%BE%99"
          rel="stylesheet"
        />
      </head>
      <body>
        <ListsProvider>
          <Suspense fallback={null}>
            <Layout>{children}</Layout>
          </Suspense>
        </ListsProvider>
      </body>
    </html>
  );
}
