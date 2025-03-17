import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Make sure images are properly optimized
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true, // Set to true for static export
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // Use the export output configuration for static site generation
  output: 'export',
  // Set the base path if your site is served from a subdirectory
  // basePath: '',
  // Required to support static export
  distDir: 'out',
};

export default nextConfig;
