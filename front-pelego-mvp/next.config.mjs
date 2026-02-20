import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^\/(player|wrapped|top-scorer|stat-resume|best-defender|top-assists|points|appear|week-played|best-of-position)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pelego-pages',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 86400, // 1 day
        },
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|woff|woff2|css|js)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pelego-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 604800, // 7 days
        },
      },
    },
  ],
})(nextConfig);
