#!/usr/bin/env node
/**
 * Sandbox E2E: Payme JSON-RPC (CheckPerform → Create → Perform).
 *
 * Usage: npm run payme:sandbox
 */
import { randomUUID } from "crypto";
import { convexRun, loadEnvFiles, requireConvexUrl } from "./lib/convex-run.mjs";

const env = loadEnvFiles();
const BASE = process.env.PAYME_E2E_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY ?? "payme_test_secret";
const authHeader = `Basic ${Buffer.from(`Payme:${MERCHANT_KEY}`, "utf8").toString("base64")}`;

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function rpc(method, params, id = 1) {
  const res = await fetch(`${BASE}/api/v1/payments/payme`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ method, params, id }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log(`Payme sandbox E2E → ${BASE}\n`);

if (env.PAYMENTS_ENABLED !== "true" && process.env.PAYMENTS_ENABLED !== "true") {
  console.error("Set PAYMENTS_ENABLED=true");
  process.exit(1);
}

try {
  requireConvexUrl(env);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const paymeTransId = `payme-e2e-${randomUUID()}`;
let paymentId;
let amountTiyin;

try {
  const seeded = convexRun("e2eTest:seedPaymePayment", {
    email: `payme-e2e-${Date.now()}@test.local`,
  });
  paymentId = seeded.paymentId;
  amountTiyin = seeded.amountTiyin;
  console.log(`  Test payment: ${paymentId}\n`);

  const check = await rpc("CheckPerformTransaction", {
    amount: amountTiyin,
    account: { order_id: paymentId },
  });
  assert("CheckPerformTransaction → allow", check.json.result?.allow === true, JSON.stringify(check.json));

  const create = await rpc("CreateTransaction", {
    id: paymeTransId,
    time: Date.now(),
    amount: amountTiyin,
    account: { order_id: paymentId },
  }, 2);
  assert("CreateTransaction → state 1", create.json.result?.state === 1, JSON.stringify(create.json));

  const perform = await rpc("PerformTransaction", { id: paymeTransId }, 3);
  assert("PerformTransaction → state 2", perform.json.result?.state === 2, JSON.stringify(perform.json));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
