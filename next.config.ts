import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME type sniffing (stops browsers from guessing file types)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // XSS protection for legacy browsers
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Control what information is sent in Referer header
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable browser features we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS - force HTTPS (already behind Cloudflare/Nginx but good in depth)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy - restrict where resources can load from
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs 'unsafe-inline' for styles, and 'unsafe-eval' for dev
      // In production we tighten this:
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Allow images from self, data URIs, and external book cover sources
      "img-src 'self' data: blob: https: http: *.google.com *.googleapis.com",
      "connect-src 'self' https://www.googleapis.com https://books.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  headers: async () => [
    {
      // Apply security headers to all routes
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
  // Disable the X-Powered-By header (don't advertise Next.js version)
  poweredByHeader: false,
};

export default nextConfig;
