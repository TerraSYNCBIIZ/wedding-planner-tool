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
    unoptimized: false,
  },
  // Configure font optimization
  optimizeFonts: true,
  // Improve static file handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  // Use stable configuration options
  experimental: {
    // These settings will help with serving static files
    optimizeServerReact: true,
    optimizePackageImports: ['lucide-react']
  },
};

export default nextConfig;
