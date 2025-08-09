import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors during builds
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com', // GitHub profile images (if using GitHub OAuth)
    ],
  },
};

export default nextConfig;
