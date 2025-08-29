/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // See https://webpack.js.org/configuration/watch/#watchoptions-ignored
    config.watchOptions.ignored = [
        // Ignore all dotfiles
        '**/.git/**',
        // Ignore all node_modules
        '**/node_modules/**',
        // Ignore all .next folders
        '**/.next/**',
        // Ignore Vercel specific folders
        '**/.vercel/**',
        // Ignore Termux specific folders that cause EACCES errors
        '/data/**',
        '/data/data/**',
    ];
    return config;
  },
};

module.exports = nextConfig;