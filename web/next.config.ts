import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['supabase.co', 'black-pill.app'],
  },
  // Serve Expo web app static files from public/app
  async rewrites() {
    return [
      {
        source: '/app/_expo/:path*',
        destination: '/app/_expo/:path*',
      },
      {
        source: '/app/assets/:path*',
        destination: '/app/assets/:path*',
      },
    ];
  },
  // Allow raw body for webhooks
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default nextConfig;

