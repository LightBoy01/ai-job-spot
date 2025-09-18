/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'aijobspot.online'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ai-job-spot.vercel.app',
          },
        ],
        destination: 'https://aijobspot.online/:path*',
        permanent: true,
      },
    ]
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/.git/**',
        '**/.next/**',
        '**/node_modules/**',
        '**/storage/**',
        '**/data_pipelines_venv/**',
        '**/archive/**',
      ],
    };
    return config;
  },
};

export default nextConfig;