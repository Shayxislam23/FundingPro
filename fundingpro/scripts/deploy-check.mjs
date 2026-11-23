#!/usr/bin/env node
/**
 * Pre-deploy checklist — verifies required env vars are set.
 *
 * Required: Convex + Clerk + Resend (production web stack).
 * Recommended: ADMIN_EMAILS, CLERK_JWT_ISSUER_DOMAIN, CONVEX_DEPLOY_KEY (CI/deploy scripts).
 *
 * Loads fundingpro/.env.local (and .env.production.local) when present so local
 * `npm run deploy:check` matches what Next.js would see.
 *
 * Usage: npm run deploy:check
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const fileEnv = {
  ...loadEnvFile(path.join(root, ".env.local")),
  ...loadEnvFile(path.join(root, ".env.production.local")),
};
const get = (key) => process.env[key] ?? fileEnv[key] ?? "";

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

function looksPlaceholder(val) {
  return (
    !val ||
    val.includes("your-") ||
    val.includes("REPLACE_ME") ||
    val === "TODO" ||
    val === "pk_test_..." ||
    val === "sk_test_..." ||
    val === "pk_test_placeholder" ||
    val === "sk_test_placeholder" ||
    val === "re_xxxxxxxxx"
  );
}

for (const key of required) {
  const val = get(key);
  if (looksPlaceholder(val)) {
    warnings.push(`MISSING required: ${key}`);
  }
}

for (const key of recommended) {
  const val = get(key);
  if (looksPlaceholder(val)) {
    warnings.push(`WARN optional: ${key}`);
  }
}

const growthConfigured = growthOptional.filter((key) => {
  const val = get(key);
  return val && !looksPlaceholder(val);
});
if (growthConfigured.length === 0) {
  warnings.push(
    "WARN growth: set Plausible/PostHog and/or Telegram env for digest + analytics (see docs/GROWTH_PLAYBOOK.md)"
  );
}

const appUrl = get("NEXT_PUBLIC_APP_URL");
if (appUrl && !appUrl.startsWith("https://") && process.env.NODE_ENV === "production") {
  warnings.push("WARN NEXT_PUBLIC_APP_URL should use https:// in production (e.g. https://fundingpro.uz)");
}

const adminEmails = get("ADMIN_EMAILS");
if (adminEmails && !adminEmails.includes("@fundingpro.uz")) {
  warnings.push("WARN ADMIN_EMAILS does not include @fundingpro.uz — use a company email for admin access");
}

if (process.env.NODE_ENV === "production" && !get("CONVEX_SYSTEM_SECRET")) {
  warnings.push(
    "WARN CONVEX_SYSTEM_SECRET missing — payment webhooks and system Convex actions will fail in production"
  );
}

if (get("PAYMENTS_ENABLED") === "true") {
  const enabledRaw = get("PAYMENT_PROVIDERS") || get("PAYMENT_PROVIDER") || "uzum";
  const enabled = enabledRaw.split(",").map((s) => s.trim().toLowerCase());

  const uzumMerchant =
    get("UZUM_MERCHANT_SERVICE_ID") &&
    get("UZUM_MERCHANT_LOGIN") &&
    get("UZUM_MERCHANT_PASSWORD");
  const uzumCheckout =
    get("UZUM_CHECKOUT_TERMINAL_ID") && get("UZUM_CHECKOUT_SECRET");
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

  if (enabled.includes("payme") && !(get("PAYME_MERCHANT_ID") && get("PAYME_MERCHANT_KEY"))) {
    warnings.push("WARN PAYMENTS_ENABLED=true — Payme credentials incomplete (PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY)");
  }
  if (
    enabled.includes("click") &&
    !(get("CLICK_MERCHANT_ID") && get("CLICK_SERVICE_ID") && get("CLICK_SECRET_KEY"))
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

if (!get("APPLE_TEAM_ID").trim() || !get("ANDROID_RELEASE_SHA256").trim()) {
  warnings.push(
    "WARN App Links: set APPLE_TEAM_ID + ANDROID_RELEASE_SHA256 on Vercel — npm run app-links:check"
  );
}

function printNextSteps() {
  console.log("\n--- Next steps (O1 Vercel env) ---");
  console.log("  1. Copy fundingpro/.env.production.example → .env.production.local");
  console.log("  2. Fill Convex + Clerk + Resend keys (see docs/ENV.md)");
  console.log("  3. npm run deploy:env   # push to Vercel — review diff first");
  console.log("  4. npm run ops:readiness  # full in-repo gate");
  console.log("  5. vercel --prod  OR  npm run deploy:production");
  console.log("-----------------------------------\n");
}

if (warnings.some((w) => w.startsWith("MISSING"))) {
  console.error("Deploy check FAILED:\n");
  warnings.forEach((w) => console.error(`  ${w}`));
  printNextSteps();
  process.exit(1);
}

if (warnings.length) {
  console.warn("Deploy check warnings:\n");
  warnings.forEach((w) => console.warn(`  ${w}`));
  printNextSteps();
} else {
  console.log("Deploy check passed — all required env vars present.");
  console.log("  → Run npm run ops:readiness before production deploy.");
}
