/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Ensure CSS is properly loaded
  poweredByHeader: false,
  reactStrictMode: true,
  // Use stable configuration options
  experimental: {
    // These settings will help with serving static files
    optimizeServerReact: true,
    optimizePackageImports: ['lucide-react']
  },
};

module.exports = nextConfig; 