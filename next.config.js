/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  // This is important for Netlify deployment - use server-side rendering
  output: 'standalone',
  // Don't generate source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
