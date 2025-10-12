const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      net: false,
      tls: false,
    };

    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './lib/shims/asyncStorage'),
    };

    // Add polyfill for indexedDB on server side
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'idb-keyval': false,
      };
    }

    return config;
  },
  
  // Enhanced security configuration
  experimental: {
    serverComponentsExternalPackages: ['@noble/secp256k1'],
  },
  
  // Security headers (backup to middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production' ? [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://dashboard.tachi.app/:path*',
        permanent: true,
      },
    ] : [];
  },
  
  // Environment variable validation
  // Note: NODE_ENV is automatically provided by Next.js
  env: {
    // Add custom environment variables here if needed
  },
};

module.exports = nextConfig;
