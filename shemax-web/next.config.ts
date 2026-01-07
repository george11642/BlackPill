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
  // Serve Expo web app static files from public/app
  async rewrites() {
    return [
      // Serve Expo static assets - rewrite /_expo/* to /app/_expo/*
      {
        source: '/_expo/:path*',
        destination: '/app/_expo/:path*',
      },
      // Serve Expo assets folder (if referenced from root)
      {
        source: '/assets/:path*',
        destination: '/app/assets/:path*',
      },
      // Serve index.html for /app route
      {
        source: '/app',
        destination: '/app/index.html',
      },
      // Handle all other /app/* routes (for client-side routing) - serve index.html
      {
        source: '/app/:path((?!_expo|assets|index\\.html).*)',
        destination: '/app/index.html',
      },
    ];
  },
};

export default nextConfig;

