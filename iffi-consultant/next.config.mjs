/** @type {import('next').NextConfig} */

// Old PHP URLs from the previous site keep their search rankings with permanent redirects.
const legacyRedirects = [
  { source: '/index.php', destination: '/', permanent: true },
  { source: '/about.php', destination: '/about', permanent: true },
  { source: '/services.php', destination: '/services', permanent: true },
  { source: '/blog.php', destination: '/blog', permanent: true },
  { source: '/faq.php', destination: '/faq', permanent: true },
  { source: '/contact.php', destination: '/contact', permanent: true },
  // /blog-post.php?slug=... is handled by src/app/blog-post.php/route.ts so the query string does not follow along
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
  async redirects() {
    return legacyRedirects;
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
