/** @type {import('next').NextConfig} */
const nextConfig = {
  // The custom webpack configuration has been removed to rely on Next.js defaults,
  // which are optimized for most environments, including Vercel.
  // The previous polling setup was a workaround for a specific local development
  // environment (like Termux) and is not needed for production builds.
};

module.exports = nextConfig;
