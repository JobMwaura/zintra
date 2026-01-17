/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Suppress module resolution errors for old code during transition to new Supabase APIs
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    maxSize: 50 * 50 * 1000,
  },
};

module.exports = nextConfig;
