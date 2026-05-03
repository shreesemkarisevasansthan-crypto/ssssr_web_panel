import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.iconfinder.com',
      },
    ],
  },
};

// ✅ Yaha pe wrap karo withNextIntl ko
export default withNextIntl(nextConfig);