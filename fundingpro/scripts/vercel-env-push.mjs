#!/usr/bin/env node
/**
 * Push environment variables from .env.production.local to Vercel (production).
 * Usage: node scripts/vercel-env-push.mjs
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env.production.local");

const REQUIRED_FOR_APP = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_APP_URL",
];

const OPTIONAL = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DIRECT_URL",
  "AI_PROVIDER",
  "PAYMENTS_ENABLED",
  "PAYMENT_INTEGRATION_STATUS",
  "PAYMENT_PROVIDER",
  "USD_UZS_RATE",
  "UZUM_MERCHANT_SERVICE_ID",
  "UZUM_MERCHANT_LOGIN",
  "UZUM_MERCHANT_PASSWORD",
  "UZUM_CHECKOUT_BASE_URL",
  "UZUM_CHECKOUT_TERMINAL_ID",
  "UZUM_CHECKOUT_SECRET",
  "UZUM_CHECKOUT_RETURN_URL",
  "STORAGE_BUCKET",
  "CORS_ALLOWED_ORIGINS",
  "NEXT_PUBLIC_APP_NAME",
];

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function pushVar(name, value, environment = "production") {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--yes", "--force"],
    { cwd: root, stdio: ["pipe", "pipe", "pipe"], encoding: "utf8", input: value }
  );
  const ok = result.status === 0;
  console.log(ok ? `  ✓ ${name}` : `  ✗ ${name}: ${(result.stderr || result.stdout || "").trim()}`);
  return ok;
}

const env = parseEnvFile(envFile);
const missing = REQUIRED_FOR_APP.filter(
  (k) => !env[k] || env[k].includes("your-") || env[k].includes("[password]")
);

if (missing.length) {
  console.error("\nMissing or placeholder values in .env.production.local:");
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error(
    "\nCopy .env.production.example → .env.production.local and fill Supabase keys from:\n" +
      "  https://supabase.com/dashboard/project/xgvwfnfifzsgscwvtcnz/settings/api\n"
  );
  process.exit(1);
}

if (!env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SECRET_KEY) {
  console.warn(
    "Warning: SUPABASE_SERVICE_ROLE_KEY not set — admin auth API uses anon fallback until added.\n"
  );
}

console.log("Pushing env vars to Vercel (production)...\n");
let ok = 0;
let fail = 0;

for (const key of [...REQUIRED_FOR_APP, ...OPTIONAL]) {
  if (env[key] === undefined || env[key] === "") continue;
  if (pushVar(key, env[key])) ok++;
  else fail++;
}

console.log(`\nDone: ${ok} set, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
