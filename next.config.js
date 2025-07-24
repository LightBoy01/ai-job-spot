/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '<https://www.ai-job-spot.com/>; rel="canonical", <https://www.google.com/webmasters/tools/googlebot-verification?id=QtBmCN15P4nv_G2Epjp8u_cioyjIwRKGGhOiaLLuyXQ>; rel="google-site-verification"'
          },
        ],
      },
    ];
  },
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
