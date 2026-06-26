#!/usr/bin/env node
/**
 * Mock Checkout E2E (no Uzum Checkout API credentials).
 * Simulates: register (mock) → return → subscription ACTIVE.
 *
 * Prerequisites:
 *   - PAYMENTS_ENABLED=true on dev server (for HTTP path)
 *   - Convex backend (npx convex dev)
 *   - Optional: UZUM_E2E_BEARER_TOKEN + dev server for full API test
 *
 * Usage: npm run uzum:checkout-mock
 */
import { convexRun, loadEnvFiles, requireConvexUrl } from "./lib/convex-run.mjs";

const env = loadEnvFiles();
const BASE = process.env.UZUM_E2E_BASE_URL ?? "http://localhost:3000";
const BEARER = process.env.UZUM_E2E_BEARER_TOKEN ?? "";

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

console.log("Uzum Checkout mock E2E\n");

if (process.env.PAYMENTS_ENABLED !== "true" && env.PAYMENTS_ENABLED !== "true") {
  console.error("Set PAYMENTS_ENABLED=true for HTTP checkout test.");
}

try {
  requireConvexUrl(env);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

let paymentId;

try {
  const seeded = convexRun("e2eTest:seedUzumPayment", {
    clerkId: "e2e-checkout-mock-user",
    email: "info@info.uz",
  });
  paymentId = seeded.paymentId;
  console.log(`  Test payment: ${paymentId}\n`);

  if (BEARER.length > 10 && process.env.PAYMENTS_ENABLED === "true") {
    const headers = {
      Authorization: `Bearer ${BEARER}`,
      "Content-Type": "application/json",
    };

    const checkoutRes = await fetch(`${BASE}/api/v1/payments/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paymentId }),
    });
    const checkoutJson = await checkoutRes.json().catch(() => ({}));
    assert("POST /payments/checkout → 200", checkoutRes.status === 200, `status=${checkoutRes.status}`);
    assert("checkout returns redirectUrl", !!checkoutJson.data?.redirectUrl);

    const returnRes = await fetch(
      `${BASE}/api/v1/payments/checkout/return?paymentId=${encodeURIComponent(paymentId)}`,
      { headers }
    );
    const returnJson = await returnRes.json().catch(() => ({}));
    assert("GET /checkout/return → 200", returnRes.status === 200, `status=${returnRes.status}`);
    assert("checkout activated", returnJson.data?.activated === true, JSON.stringify(returnJson.data));
  } else {
    console.log("  ⊘ HTTP path skipped — set UZUM_E2E_BEARER_TOKEN + PAYMENTS_ENABLED=true + dev server\n");
    convexRun("e2eTest:activateMockCheckout", { paymentId });
    assert("mock checkout activation (Convex path)", true);
  }

  const payStatus = convexRun("e2eTest:getPaymentStatus", { paymentId });
  assert("payment status SUCCESS", payStatus === "SUCCESS", String(payStatus));

  const subStatus = convexRun("e2eTest:getSubscriptionStatusByPayment", { paymentId });
  assert("subscription status ACTIVE", subStatus === "ACTIVE", String(subStatus));
} catch (e) {
  console.error("E2E error:", e);
  failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
