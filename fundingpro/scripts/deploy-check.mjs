#!/usr/bin/env node
/**
 * Pre-deploy checklist — verifies required env vars are set.
 * Usage: npm run deploy:check
 */
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
];

const recommended = [
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_APP_URL",
  "DIRECT_URL",
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
if (appUrl && !appUrl.startsWith("https://") && process.env.NODE_ENV === "production") {
  warnings.push("WARN NEXT_PUBLIC_APP_URL should use https:// in production (e.g. https://fundingpro.uz)");
}

const adminEmails = process.env.ADMIN_EMAILS ?? "";
if (adminEmails && !adminEmails.includes("@fundingpro.uz")) {
  warnings.push("WARN ADMIN_EMAILS does not include @fundingpro.uz — use a company email for admin access");
}

if (process.env.PAYMENTS_ENABLED === "true") {
  const uzumMerchant =
    process.env.UZUM_MERCHANT_SERVICE_ID &&
    process.env.UZUM_MERCHANT_LOGIN &&
    process.env.UZUM_MERCHANT_PASSWORD;
  const uzumCheckout =
    process.env.UZUM_CHECKOUT_TERMINAL_ID && process.env.UZUM_CHECKOUT_SECRET;
  if (!uzumMerchant && !uzumCheckout) {
    warnings.push(
      "WARN PAYMENTS_ENABLED=true but Uzum credentials missing (Merchant and/or Checkout)"
    );
  } else {
    if (!uzumMerchant) {
      warnings.push("WARN PAYMENTS_ENABLED=true — Uzum Merchant credentials incomplete");
    }
    if (!uzumCheckout) {
      warnings.push("WARN PAYMENTS_ENABLED=true — Uzum Checkout credentials incomplete");
    }
  }
}

if ((process.env.AI_PROVIDER ?? "mock") === "mock") {
  console.log("AI_PROVIDER=mock (OK for staging; set openai/anthropic + API key for production AI)");
}

function printPostDeployChecklist() {
  console.log("\n--- Post-deploy checklist (manual) ---");
  console.log("  1. supabase link --project-ref <YOUR_PROJECT_ID>");
  console.log("  2. supabase db push");
  console.log("  3. DATABASE_URL=... npm run db:seed");
  console.log("  4. Supabase Dashboard → Authentication → SMTP (Resend: smtp.resend.com:465)");
  console.log("  5. Supabase Dashboard → Storage → create bucket \"documents\"");
  console.log("  6. Vercel env vars from .env.production.example (incl. UZUM_* after contract)");
  console.log("  7. npm run uzum:check && npm run uzum:webhooks");
  console.log("  8. vercel --prod  (or push to main if CI is connected)");
  console.log("--------------------------------------\n");
}

if (warnings.length === 0) {
  console.log("Deploy check passed — required env vars look configured.");
  printPostDeployChecklist();
  process.exit(0);
}

console.log("Deploy check found issues:\n");
warnings.forEach((w) => console.log(`  • ${w}`));
console.log("\nSet variables in Vercel Dashboard → Settings → Environment Variables");
printPostDeployChecklist();
process.exit(warnings.some((w) => w.startsWith("MISSING")) ? 1 : 0);
