/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  images: {
    domains: [
      // 'addons.mozilla.org',
      // 'lh3.googleusercontent.com',
      // 'store-images.s-microsoft.com',
      // 'upload.wikimedia.org',
      // 'is4-ssl.mzstatic.com',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['js', 'jsx'],
  experimental: {
    scrollRestoration: true,
    images: {
      unoptimized: true,
    },
  },
}

module.exports = nextConfig
