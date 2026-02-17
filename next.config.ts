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
        hostname: 'frontend.k3guard.com-py'
      },
      {
        protocol: 'http',
        hostname: 'localhost'
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com'
      }
    ]
  }
};

export default nextConfig;
