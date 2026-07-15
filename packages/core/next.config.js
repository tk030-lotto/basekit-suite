/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@basekit/plugin-personal-ops',
    '@basekit/plugin-bookkeeping',
    '@basekit/plugin-sns'
  ]
};

module.exports = nextConfig;
