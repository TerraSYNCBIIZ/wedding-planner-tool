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
    unoptimized: true, // Set to true for static exports
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
  // Add output configuration for better Netlify compatibility
  output: 'standalone',
  
  // Ensure static assets are properly handled
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // Configure trailing slash for consistent URL handling
  trailingSlash: false,
  
  // Optimize for production
  productionBrowserSourceMaps: false,
  
  // Configure static file serving
  distDir: '.next',
};

module.exports = nextConfig; 