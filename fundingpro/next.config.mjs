import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
/**
 * CSP tradeoffs:
 * - `unsafe-inline` — required by Next.js for hydration/bootstrap scripts.
 * - `unsafe-eval` — only in development (React Fast Refresh / devtools). Omitted in production builds.
 * - Clerk loads its browser runtime from the instance domain.
 * - Local Convex dev uses 127.0.0.1 ports 3210/3211.
 */
const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, "..");
const isProd = process.env.NODE_ENV === "production";

const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com";

const connectSrc = [
  "connect-src 'self'",
  "https://*.convex.cloud",
  "wss://*.convex.cloud",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://challenges.cloudflare.com",
  ...(isProd
    ? []
    : [
        "http://127.0.0.1:3210",
        "http://127.0.0.1:3211",
        "http://localhost:3210",
        "http://localhost:3211",
        "ws://127.0.0.1:3210",
        "ws://127.0.0.1:3211",
        "ws://localhost:3210",
        "ws://localhost:3211",
      ]),
].join(" ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      connectSrc,
      "worker-src 'self' blob:",
      "frame-src https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@fundingpro/shared"],
  async rewrites() {
    // Some hosts/CDNs mishandle App Router folders under `app/.well-known`.
    // Proxy the Apple/Google verification paths to stable API routes.
    return [
      {
        source: "/.well-known/apple-app-site-association",
        destination: "/api/well-known/apple-app-site-association",
      },
      {
        source: "/.well-known/assetlinks.json",
        destination: "/api/well-known/assetlinks",
      },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
