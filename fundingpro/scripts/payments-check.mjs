#!/usr/bin/env node
/**
 * Health check for all payment providers: env + /payments/status.
 *
 * Usage: npm run payments:check
 */
import { loadEnvFiles } from "./lib/convex-run.mjs";
import {
  ALL_PROVIDERS,
  getEnabledProviders,
  isProviderConfigured,
  uzumConfigDetail,
  validatePaymentsEnv,
} from "./lib/payments-env.mjs";

const env = loadEnvFiles();
const BASE = process.env.SMOKE_BASE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function check(name, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

let allOk = true;

console.log("Payments check\n");

const paymentsEnabled = env.PAYMENTS_ENABLED === "true";
allOk =
  check("PAYMENTS_ENABLED", true, paymentsEnabled ? "true" : "false (expected before go-live)") && allOk;
allOk =
  check("NEXT_PUBLIC_CONVEX_URL", !!env.NEXT_PUBLIC_CONVEX_URL, env.NEXT_PUBLIC_CONVEX_URL ?? "missing") && allOk;

const enabled = paymentsEnabled ? getEnabledProviders(env) : ALL_PROVIDERS;
const providersLabel = paymentsEnabled
  ? enabled.join(", ")
  : (env.PAYMENT_PROVIDERS ?? env.PAYMENT_PROVIDER ?? "uzum,payme,click");
allOk = check("PAYMENT_PROVIDERS", enabled.length > 0, providersLabel) && allOk;

console.log("\n  Provider env:");
for (const p of ALL_PROVIDERS) {
  const configured = isProviderConfigured(p, env);
  const mustConfigure = paymentsEnabled && enabled.includes(p);
  let detail = configured ? "configured" : "missing";
  if (p === "uzum" && configured) detail = uzumConfigDetail(env);
  if (mustConfigure && !configured) allOk = false;
  const mark = mustConfigure ? (configured ? "✓" : "✗") : configured ? "○" : "·";
  console.log(`  ${mark} ${p}${mustConfigure ? " (enabled)" : ""}: ${detail}`);
}

const validation = validatePaymentsEnv(env, { requireEnabled: paymentsEnabled });
if (validation.warnings.length) {
  console.log("\n  Warnings:");
  for (const w of validation.warnings) console.log(`    ⚠ ${w}`);
}
if (validation.issues.length && paymentsEnabled) {
  for (const issue of validation.issues) allOk = check(issue, false) && allOk;
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
  allOk = check("GET /payments/status", false, err instanceof Error ? err.message : "fetch failed") && allOk;
}

console.log(allOk ? "\nAll checks passed" : "\nSome checks failed");
console.log("Next: npm run payments:golive-check -- --sandbox (after credentials in .env.local)");
process.exit(allOk ? 0 : 1);
