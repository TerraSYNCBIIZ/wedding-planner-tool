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
    unoptimized: process.env.NODE_ENV === 'production', // Ensure images are properly handled in production
  },
  // Use server-side rendering with proper layout
  // Ensure CSS is loaded properly in production
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Add compiler options to optimize CSS extraction
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
  // Explicitly enable webpack for CSS processing
  webpack: (config) => {
    return config;
  }
};

export default nextConfig;
