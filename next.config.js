/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['/data/**', '/storage/**', '**/.git/**', '**/node_modules/**'],
    };
    config.cache = false; // Disable Webpack cache
    return config;
  },
};

module.exports = nextConfig;
