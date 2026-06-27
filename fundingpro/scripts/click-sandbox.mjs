#!/usr/bin/env node
/**
 * Sandbox E2E: Click SHOP API (prepare → complete).
 *
 * Usage: npm run click:sandbox
 */
import crypto from "node:crypto";
import { convexRun, loadEnvFiles, requireConvexUrl } from "./lib/convex-run.mjs";

const env = loadEnvFiles();
const BASE = process.env.CLICK_E2E_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const SERVICE_ID = process.env.CLICK_SERVICE_ID ?? "click-test-service";
const SECRET = process.env.CLICK_SECRET_KEY ?? "click_test_secret";

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

function md5(parts) {
  return crypto.createHash("md5").update(parts.join(""), "utf8").digest("hex");
}

async function shopPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log(`Click sandbox E2E → ${BASE}\n`);

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

let paymentId;
let amountTiyin;
const clickTransId = Date.now();
const signTime = "2026-06-27 12:00:00";

try {
  const seeded = convexRun("e2eTest:seedClickPayment", {
    email: `click-e2e-${Date.now()}@test.local`,
  });
  paymentId = seeded.paymentId;
  amountTiyin = seeded.amountTiyin;
  console.log(`  Test payment: ${paymentId}\n`);

  const prepareSign = md5([
    clickTransId,
    SERVICE_ID,
    SECRET,
    paymentId,
    amountTiyin,
    0,
    signTime,
  ]);

  const prepare = await shopPost("/api/v1/payments/click/prepare", {
    click_trans_id: clickTransId,
    service_id: SERVICE_ID,
    merchant_trans_id: paymentId,
    amount: amountTiyin,
    action: 0,
    sign_time: signTime,
    sign_string: prepareSign,
  });
  assert("prepare → error 0", prepare.json.error === 0, JSON.stringify(prepare.json));
  const prepareId = prepare.json.merchant_prepare_id;

  const completeSign = md5([
    clickTransId,
    SERVICE_ID,
    SECRET,
    paymentId,
    prepareId,
    amountTiyin,
    1,
    signTime,
  ]);

  const complete = await shopPost("/api/v1/payments/click/complete", {
    click_trans_id: clickTransId,
    service_id: SERVICE_ID,
    merchant_trans_id: paymentId,
    merchant_prepare_id: prepareId,
    amount: amountTiyin,
    action: 1,
    sign_time: signTime,
    sign_string: completeSign,
  });
  assert("complete → error 0", complete.json.error === 0, JSON.stringify(complete.json));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
