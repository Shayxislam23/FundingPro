import type { AuthConfig } from "convex/server";

// Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard / .env.local (Clerk Frontend API URL)
const clerkDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ??
  process.env.CLERK_FRONTEND_API_URL ??
  "";

export default {
  providers:
    clerkDomain.length > 0
      ? [
          {
            domain: clerkDomain,
            applicationID: "convex",
          },
        ]
      : [],
} satisfies AuthConfig;
