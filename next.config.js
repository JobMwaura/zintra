/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable Turbopack to use traditional webpack compiler
  // This resolves the "to" argument must be of type string error
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;
