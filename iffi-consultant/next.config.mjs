/** @type {import('next').NextConfig} */

// Old PHP URLs from the previous site keep their search rankings with permanent redirects.
const legacyRedirects = [
  { source: '/index.php', destination: '/', permanent: true },
  { source: '/about.php', destination: '/about', permanent: true },
  { source: '/services.php', destination: '/services', permanent: true },
  { source: '/blog.php', destination: '/blog', permanent: true },
  { source: '/faq.php', destination: '/faq', permanent: true },
  { source: '/contact.php', destination: '/contact', permanent: true },
  {
    source: '/blog-post.php',
    has: [{ type: 'query', key: 'slug', value: '(?<slug>[a-z0-9-]+)' }],
    destination: '/blog/:slug',
    permanent: true,
  },
];

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // the Next.js development badge (local only, never on the live site) sits top-right, away from the chat button.
  // devIndicators: false would hide it, but in Next 16.4 that makes every page reload in a loop during development.
  devIndicators: { position: 'top-right' },
  // the blank application and medical forms, served to signed-in students by src/app/portal/forms/[file]/route.ts
  outputFileTracingIncludes: {
    '/portal/forms/*': ['./private/forms/**/*'],
  },
  async redirects() {
    return legacyRedirects;
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
