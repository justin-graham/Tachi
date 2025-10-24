/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, {isServer}) => {
    // Suppress warnings for optional dependencies not needed in web apps
    config.ignoreWarnings = [
      {module: /node_modules\/@react-native-async-storage/},
      {module: /node_modules\/pino-pretty/},
    ];
    return config;
  },
};

module.exports = nextConfig;
