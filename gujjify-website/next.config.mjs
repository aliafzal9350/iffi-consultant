/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'lucide-react', 'motion'],
  async redirects() {
    return [
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/about.php', destination: '/about', permanent: true },
      { source: '/services.php', destination: '/services', permanent: true },
      { source: '/blog.php', destination: '/blog', permanent: true },
      { source: '/faq.php', destination: '/faq', permanent: true },
      { source: '/contact.php', destination: '/contact', permanent: true },
    ];
  },
};

export default nextConfig;
