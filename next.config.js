/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'aijobspot.online', 'www.aijobspot.online'],
    unoptimized: true,
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      connect-src 'self' https://*.firebaseio.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://apis.google.com https://www.google-analytics.com https://connect.facebook.net https://www.gstatic.com/firebasejs/ https://*.firebaseio.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://lh3.googleusercontent.com;
      font-src 'self' https://fonts.gstatic.com;
      frame-src 'self' https://*.firebaseapp.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
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
    ];
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
        '**/..',
        '**/../..',
        '/',
        '/data',
        '/data/data',
      ],
    };
    return config;
  },
};

export default nextConfig;
