#!/usr/bin/env node
/**
 * PSP sandbox → production go-live gate.
 * Validates all enabled providers, recommended Convex secrets, and optional sandbox E2E.
 *
 * Usage:
 *   npm run payments:golive-check
 *   PAYMENTS_ENABLED=true npm run payments:golive-check -- --sandbox
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./lib/convex-run.mjs";
import {
  ALL_PROVIDERS,
  getEnabledProviders,
  isProviderConfigured,
  providerEnvKeys,
  uzumConfigDetail,
  validatePaymentsEnv,
} from "./lib/payments-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const env = loadEnvFiles();
const runSandbox = process.argv.includes("--sandbox");
const BASE = process.env.SMOKE_BASE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function check(name, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

function runNpm(script) {
  const r = spawnSync("npm", ["run", script], { cwd: root, stdio: "inherit", shell: true });
  return r.status === 0;
}

let allOk = true;

console.log("Payments go-live check\n");
console.log("Gate: keep PAYMENTS_ENABLED=false until every sandbox step passes.\n");

const paymentsEnabled = env.PAYMENTS_ENABLED === "true";
check(
  "PAYMENTS_ENABLED",
  true,
  paymentsEnabled ? "true (go-live mode)" : "false (safe default — flip only after sandbox)"
);

if (!paymentsEnabled) {
  console.log("\n  ℹ Payments disabled — validating provider env only (set PAYMENTS_ENABLED=true for full go-live).");
}

allOk = check("NEXT_PUBLIC_CONVEX_URL", !!env.NEXT_PUBLIC_CONVEX_URL, env.NEXT_PUBLIC_CONVEX_URL ?? "missing") && allOk;
const hasConvexSecret = !!env.CONVEX_SYSTEM_SECRET?.trim();
if (paymentsEnabled) {
  allOk =
    check("CONVEX_SYSTEM_SECRET", hasConvexSecret, hasConvexSecret ? "set" : "missing (required when live)") && allOk;
} else if (!hasConvexSecret) {
  console.log("  · CONVEX_SYSTEM_SECRET not set (required before PAYMENTS_ENABLED=true)");
}

const enabled = paymentsEnabled ? getEnabledProviders(env) : [];
const providersRaw = env.PAYMENT_PROVIDERS ?? env.PAYMENT_PROVIDER ?? "uzum,payme,click";
allOk =
  check("PAYMENT_PROVIDERS", paymentsEnabled ? enabled.length > 0 : true, paymentsEnabled ? enabled.join(", ") : `planned: ${providersRaw}`) &&
  allOk;

console.log("\n  Provider credentials:");
for (const provider of ALL_PROVIDERS) {
  const configured = isProviderConfigured(provider, env);
  const active = enabled.includes(provider);
  let detail = configured ? "configured" : "missing";
  if (provider === "uzum" && configured) detail = uzumConfigDetail(env);
  if (active && !configured) allOk = false;
  const mark = active ? (configured ? "✓" : "✗") : configured ? "○" : "·";
  console.log(`  ${mark} ${provider}${active ? " (enabled)" : ""}: ${detail}`);
  if (active && !configured) {
    console.log(`      keys: ${providerEnvKeys(provider).join(", ")}`);
  }
}

const validation = validatePaymentsEnv(env, { requireEnabled: false });
if (validation.warnings.length) {
  console.log("\n  Warnings:");
  for (const w of validation.warnings) console.log(`    ⚠ ${w}`);
}

try {
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/v1/payments/status`);
  const json = await res.json();
  allOk = check("GET /payments/status", res.ok && json.success === true) && allOk;
  if (json.data?.providers) {
    for (const p of json.data.providers) {
      console.log(`    · ${p.id}: enabled=${p.enabled} configured=${p.configured}`);
    }
  }
} catch (err) {
  console.log("\n  ⚠ Skipping /payments/status (start dev server or set SMOKE_BASE_URL)");
}

if (runSandbox) {
  console.log("\n  Sandbox E2E (order: uzum → payme → click):");
  const sandboxScripts = [
    ["uzum", "uzum:sandbox", () => isProviderConfigured("uzum", env)],
    ["payme", "payme:sandbox", () => isProviderConfigured("payme", env)],
    ["click", "click:sandbox", () => isProviderConfigured("click", env)],
  ];
  for (const [name, script, hasCreds] of sandboxScripts) {
    if (!hasCreds()) {
      console.log(`  · skip ${name}: credentials missing`);
      continue;
    }
    if (!enabled.includes(name) && paymentsEnabled) {
      console.log(`  · skip ${name}: not in PAYMENT_PROVIDERS`);
      continue;
    }
    console.log(`\n→ npm run ${script}`);
    if (!runNpm(script)) allOk = false;
  }
}

console.log("\n--- Recommended before Vercel production ---");
console.log("  1. npm run deploy:check");
console.log("  2. npm run convex:seed:prod   (see docs/PROD-SEED.md)");
console.log("  3. Sandbox each provider locally (see docs/PAYMENTS-OVERVIEW.md)");
console.log("  4. Set Vercel env — keep PAYMENTS_ENABLED=false until preview smoke passes");
console.log("  5. PAYMENTS_ENABLED=true only after uzum → payme → click sandbox green");
console.log("---------------------------------------------------------------\n");

console.log(allOk ? "Go-live env check passed" : "Go-live env check failed");
process.exit(allOk ? 0 : 1);
