/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@genki-tcg/shared-types'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
