import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      },
      {
        protocol: 'https',
        hostname: 'k3guard.com'
      },
      {
        protocol: 'https',
        hostname: 'backend.k3guard.com'
      },
      {
        protocol: 'https',
        hostname: 'frontend.k3guard.com'
      },
      {
        protocol: 'https',
        hostname: 'frontend.k3guard.com-py'
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com'
      },
      // Only allow localhost in development
      ...(process.env.NODE_ENV === 'development' ? [{
        protocol: 'http' as const,
        hostname: 'localhost'
      }] : [])
    ]
  },
  // Optimize CSS loading to prevent preload warnings
  experimental: {
    optimizeCss: true,
  },
  // Disable CSS preloading if not needed immediately
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  }
};

export default nextConfig;
