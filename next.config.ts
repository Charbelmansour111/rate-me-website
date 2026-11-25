import type { NextConfig } from 'next';

import { ARABIC_ENABLED } from './src/config/site';

const dev = process.env.NODE_ENV === 'development';
const turnstile = process.env.TURNSTILE_ENABLED === 'true' && 'https://challenges.cloudflare.com';
const analytics =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true' &&
  new URL(process.env.NEXT_PUBLIC_ANALYTICS_SRC || 'https://plausible.io').origin;

const list = (...values: (string | false)[]) => values.filter(Boolean).join(' ');

/** Pages are static, so inline scripts cannot carry a nonce: 'unsafe-inline' is Next's own need. */
const csp = [
  "default-src 'self'",
  `script-src ${list("'self'", "'unsafe-inline'", dev && "'unsafe-eval'", turnstile, analytics)}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${list("'self'", dev && 'ws:', analytics)}`,
  `frame-src ${turnstile || "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' } },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
    ];
  },
  async rewrites() {
    // With Arabic off, /ar goes to an address that does not exist: the English 404 page.
    const gone = '/not-available';
    return {
      beforeFiles: ARABIC_ENABLED
        ? []
        : [
            { source: '/ar', destination: gone },
            { source: '/ar/:path*', destination: gone },
          ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    // English lives at the root; keep "/en" links working.
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
