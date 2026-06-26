#!/usr/bin/env node
/**
 * Sandbox E2E: Merchant webhook flow (check → create → confirm → subscription ACTIVE).
 *
 * Prerequisites:
 *   - Dev server running (npm run dev)
 *   - Convex backend (npx convex dev) + catalog seed (npm run convex:seed)
 *   - PAYMENTS_ENABLED=true
 *   - UZUM_MERCHANT_* set (or test defaults below)
 *
 * Usage: npm run uzum:sandbox
 */
import { randomUUID } from "crypto";
import { convexRun, loadEnvFiles, requireConvexUrl } from "./lib/convex-run.mjs";

const env = loadEnvFiles();
const BASE = process.env.UZUM_E2E_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const TEST_SERVICE_ID = process.env.UZUM_MERCHANT_SERVICE_ID ?? "fundingpro-test";
const TEST_LOGIN = process.env.UZUM_MERCHANT_LOGIN ?? "uzum_test";
const TEST_PASSWORD = process.env.UZUM_MERCHANT_PASSWORD ?? "uzum_test_secret";

const authHeader = `Basic ${Buffer.from(`${TEST_LOGIN}:${TEST_PASSWORD}`, "utf8").toString("base64")}`;

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

async function merchantPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log(`Uzum sandbox E2E → ${BASE}\n`);

if (env.PAYMENTS_ENABLED !== "true" && process.env.PAYMENTS_ENABLED !== "true") {
  console.error("Set PAYMENTS_ENABLED=true in .env.local or env for this test.");
  process.exit(1);
}

try {
  requireConvexUrl(env);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

let paymentId;
let amountTiyin;
const transId = `e2e-trans-${randomUUID()}`;

try {
  const seeded = convexRun("e2eTest:seedUzumPayment", {
    email: `uzum-e2e-${Date.now()}@test.local`,
  });
  paymentId = seeded.paymentId;
  amountTiyin = seeded.amountTiyin;
  console.log(`  Test payment: ${paymentId}\n`);

  const check = await merchantPost("/api/v1/payments/uzum/check", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    params: { account: paymentId },
  });
  assert("POST /uzum/check → 200", check.status === 200, `status=${check.status}`);
  assert("check status OK", check.json?.status === "OK", JSON.stringify(check.json));

  const create = await merchantPost("/api/v1/payments/uzum/create", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    transId,
    params: { account: paymentId },
    amount: amountTiyin,
  });
  assert("POST /uzum/create → 200", create.status === 200, `status=${create.status}`);
  assert("create status CREATED", create.json?.status === "CREATED", JSON.stringify(create.json));

  const confirm = await merchantPost("/api/v1/payments/uzum/confirm", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    transId,
  });
  assert("POST /uzum/confirm → 200", confirm.status === 200, `status=${confirm.status}`);
  assert("confirm status CONFIRMED", confirm.json?.status === "CONFIRMED", JSON.stringify(confirm.json));

  const payStatus = convexRun("e2eTest:getPaymentStatus", { paymentId });
  assert("payment status SUCCESS", payStatus === "SUCCESS", String(payStatus));

  const subStatus = convexRun("e2eTest:getSubscriptionStatusByPayment", { paymentId });
  assert("subscription status ACTIVE", subStatus === "ACTIVE", String(subStatus));

  const txState = convexRun("e2eTest:getUzumTransactionState", { transId });
  assert("uzum_transaction CONFIRMED", txState === "CONFIRMED", String(txState));

  const status = await merchantPost("/api/v1/payments/uzum/status", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    transId,
  });
  assert("POST /uzum/status → 200", status.status === 200);
  assert("status CONFIRMED", status.json?.status === "CONFIRMED", JSON.stringify(status.json));
} catch (e) {
  console.error("E2E error:", e);
  failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
