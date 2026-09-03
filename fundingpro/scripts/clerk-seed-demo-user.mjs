#!/usr/bin/env node
/**
 * Create or update the local demo Clerk user (info@info.uz / test12345).
 * Usage: npm run clerk:seed-demo
 * Requires: CLERK_SECRET_KEY in fundingpro/.env.local
 */
import { createClerkClient } from "@clerk/backend";
import { loadEnvFiles, fundingproRoot } from "./lib/convex-run.mjs";

const env = loadEnvFiles(fundingproRoot);
const secretKey = process.env.CLERK_SECRET_KEY ?? env.CLERK_SECRET_KEY;
const email = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL ?? env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL ?? "info@info.uz";
const password =
  process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? "test12345";

if (
  !secretKey ||
  secretKey.includes("...") ||
  secretKey.includes("your-") ||
  secretKey.includes("Y2xlcmsuZGV2")
) {
  console.error(`
Clerk is not configured with a real secret key.

1. Open https://dashboard.clerk.com → API Keys
2. Copy Publishable key + Secret key into fundingpro/.env.local:
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
     CLERK_SECRET_KEY=sk_test_…
     CLERK_JWT_ISSUER_DOMAIN=https://….clerk.accounts.dev
3. Set the same CLERK_JWT_ISSUER_DOMAIN in Convex dashboard env
4. Re-run: npm run clerk:seed-demo
`);
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });

try {
  const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });

  if (existing.data.length > 0) {
    const user = existing.data[0];
    await clerk.users.updateUser(user.id, {
      password,
      skipPasswordChecks: true,
    });
    console.log(`Demo user updated: ${email}`);
  } else {
    await clerk.users.createUser({
      emailAddress: [email],
      password,
      skipPasswordChecks: true,
    });
    console.log(`Demo user created: ${email}`);
  }

  console.log(`Password: ${password}`);
  console.log("Sign in at http://localhost:3000/sign-in");
} catch (err) {
  console.error("Clerk demo seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
