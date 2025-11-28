import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'black-pill.app',
      },
    ],
  },
  // Fix lockfiles warning - specify parent directory as the root
  turbopack: {
    root: '..',
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
};

export default nextConfig;

