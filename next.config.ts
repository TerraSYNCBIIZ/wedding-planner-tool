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
  // Ensure CSS is loaded properly in production
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // Remove swcMinify which is causing warnings
  // swcMinify: true,
  // Add compiler options to optimize CSS extraction
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
  // Explicitly enable webpack for CSS processing
  webpack: (config) => {
    return config;
  },
  // Disable output file tracing for API routes and server-side rendering
  output: 'standalone',
};

export default nextConfig;
