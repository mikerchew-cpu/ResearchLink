// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better dev-time warnings
  reactStrictMode: true,

  // i18n handled by next-intl (client-side) — no built-in i18n routing needed
  // because we use a client I18nProvider that reads from URL params + localStorage

  // Image optimisation — allow Supabase Storage and Google avatar domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co",       pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com wss://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Root → waitlist (pre-launch) or feed (post-launch)
      // Change destination to "/feed" when platform goes live
      { source: "/", destination: "/waitlist", permanent: false },
    ];
  },

  // Experimental features
  experimental: {
    // Server actions are stable in Next 14 — no flag needed
    // typedRoutes: true, // enable when all routes are defined
  },

  // Webpack — suppress Supabase realtime warnings in dev
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pg-native": false,
    };
    return config;
  },
};

module.exports = nextConfig;
