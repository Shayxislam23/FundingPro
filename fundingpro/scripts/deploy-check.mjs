#!/usr/bin/env node
/**
 * Pre-deploy checklist — verifies required env vars are set.
 *
 * Required: Convex + Clerk + Resend (production web stack).
 * Recommended: ADMIN_EMAILS, CLERK_JWT_ISSUER_DOMAIN, CONVEX_DEPLOY_KEY (CI/deploy scripts).
 *
 * Usage: npm run deploy:check
 */
const required = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
];

const recommended = [
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_APP_URL",
  "CLERK_JWT_ISSUER_DOMAIN",
  "CONVEX_DEPLOY_KEY",
  "CONVEX_SYSTEM_SECRET",
  "APPLE_TEAM_ID",
  "ANDROID_RELEASE_SHA256",
];

const growthOptional = [
  "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
];

const warnings = [];

for (const key of required) {
  const val = process.env[key];
  if (!val || val.includes("your-") || val === "TODO") {
    warnings.push(`MISSING required: ${key}`);
  }
}

for (const key of recommended) {
  const val = process.env[key];
  if (!val || val.includes("your-")) {
    warnings.push(`WARN optional: ${key}`);
  }
}

const growthConfigured = growthOptional.filter((key) => {
  const val = process.env[key];
  return val && !val.includes("your-");
});
if (growthConfigured.length === 0) {
  warnings.push(
    "WARN growth: set Plausible/PostHog and/or Telegram env for digest + analytics (see docs/GROWTH_PLAYBOOK.md)"
  );
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
if (appUrl && !appUrl.startsWith("https://") && process.env.NODE_ENV === "production") {
  warnings.push("WARN NEXT_PUBLIC_APP_URL should use https:// in production (e.g. https://fundingpro.uz)");
}

const adminEmails = process.env.ADMIN_EMAILS ?? "";
if (adminEmails && !adminEmails.includes("@fundingpro.uz")) {
  warnings.push("WARN ADMIN_EMAILS does not include @fundingpro.uz — use a company email for admin access");
}

if (process.env.NODE_ENV === "production" && !process.env.CONVEX_SYSTEM_SECRET) {
  warnings.push(
    "WARN CONVEX_SYSTEM_SECRET missing — payment webhooks and system Convex actions will fail in production"
  );
}

if (process.env.PAYMENTS_ENABLED === "true") {
  const enabledRaw = process.env.PAYMENT_PROVIDERS ?? process.env.PAYMENT_PROVIDER ?? "uzum";
  const enabled = enabledRaw.split(",").map((s) => s.trim().toLowerCase());

  const uzumMerchant =
    process.env.UZUM_MERCHANT_SERVICE_ID &&
    process.env.UZUM_MERCHANT_LOGIN &&
    process.env.UZUM_MERCHANT_PASSWORD;
  const uzumCheckout =
    process.env.UZUM_CHECKOUT_TERMINAL_ID && process.env.UZUM_CHECKOUT_SECRET;
  if (enabled.includes("uzum") && !uzumMerchant && !uzumCheckout) {
    warnings.push(
      "WARN PAYMENTS_ENABLED=true but Uzum credentials missing (Merchant and/or Checkout)"
    );
  } else if (enabled.includes("uzum")) {
    if (!uzumMerchant) {
      warnings.push("WARN PAYMENTS_ENABLED=true — Uzum Merchant credentials incomplete");
    }
    if (!uzumCheckout) {
      warnings.push("WARN PAYMENTS_ENABLED=true — Uzum Checkout credentials incomplete");
    }
  }

  if (enabled.includes("payme") && !(process.env.PAYME_MERCHANT_ID && process.env.PAYME_MERCHANT_KEY)) {
    warnings.push("WARN PAYMENTS_ENABLED=true — Payme credentials incomplete (PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY)");
  }
  if (
    enabled.includes("click") &&
    !(process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY)
  ) {
    warnings.push(
      "WARN PAYMENTS_ENABLED=true — Click credentials incomplete (CLICK_MERCHANT_ID, CLICK_SERVICE_ID, CLICK_SECRET_KEY)"
    );
  }

  warnings.push(
    "WARN payments go-live: run npm run payments:golive-check and sandbox scripts (uzum:sandbox, payme:sandbox, click:sandbox) before production"
  );
} else {
  warnings.push(
    "WARN payments: keep PAYMENTS_ENABLED=false until sandbox E2E passes — see docs/PAYMENTS-OVERVIEW.md"
  );
}

if (!process.env.APPLE_TEAM_ID?.trim() || !process.env.ANDROID_RELEASE_SHA256?.trim()) {
  warnings.push(
    "WARN App Links: set APPLE_TEAM_ID + ANDROID_RELEASE_SHA256 on Vercel — npm run app-links:check"
  );
}

if (warnings.some((w) => w.startsWith("MISSING"))) {
  console.error("Deploy check FAILED:\n");
  warnings.forEach((w) => console.error(`  ${w}`));
  process.exit(1);
}

if (warnings.length) {
  console.warn("Deploy check warnings:\n");
  warnings.forEach((w) => console.warn(`  ${w}`));
} else {
  console.log("Deploy check passed — all required env vars present.");
}
