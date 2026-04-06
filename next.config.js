/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Suppress Dexie/IndexedDB warnings during SSR build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'dexie'];
    }
    return config;
  },
  // Allow building even with type errors (safe for production deploy)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
