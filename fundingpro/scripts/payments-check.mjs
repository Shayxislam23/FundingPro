#!/usr/bin/env node
/**
 * Health check for all payment providers: env + /payments/status.
 *
 * Usage: npm run payments:check
 */
import { loadEnvFiles } from "./lib/convex-run.mjs";

const env = loadEnvFiles();
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const PROVIDERS = ["uzum", "payme", "click"];

function check(name, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

let allOk = true;

console.log("Payments check\n");

allOk = check("PAYMENTS_ENABLED", env.PAYMENTS_ENABLED === "true", env.PAYMENTS_ENABLED ?? "false") && allOk;
allOk =
  check("NEXT_PUBLIC_CONVEX_URL", !!env.NEXT_PUBLIC_CONVEX_URL, env.NEXT_PUBLIC_CONVEX_URL ?? "missing") && allOk;

const enabledRaw = env.PAYMENT_PROVIDERS ?? env.PAYMENT_PROVIDER ?? "uzum";
const enabled = enabledRaw.split(",").map((s) => s.trim());
allOk = check("PAYMENT_PROVIDERS", enabled.length > 0, enabled.join(", ")) && allOk;

for (const p of PROVIDERS) {
  if (!enabled.includes(p)) continue;
  if (p === "uzum") {
    const merchant = !!(env.UZUM_MERCHANT_SERVICE_ID && env.UZUM_MERCHANT_LOGIN && env.UZUM_MERCHANT_PASSWORD);
    const checkout = !!(env.UZUM_CHECKOUT_TERMINAL_ID && env.UZUM_CHECKOUT_SECRET);
    allOk = check("uzum configured", merchant || checkout, merchant ? "merchant" : checkout ? "checkout" : "none") && allOk;
  }
  if (p === "payme") {
    allOk = check("payme configured", !!(env.PAYME_MERCHANT_ID && env.PAYME_MERCHANT_KEY)) && allOk;
  }
  if (p === "click") {
    allOk =
      check(
        "click configured",
        !!(env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID && env.CLICK_SECRET_KEY)
      ) && allOk;
  }
}

try {
  const res = await fetch(`${BASE}/api/v1/payments/status`);
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
process.exit(allOk ? 0 : 1);
