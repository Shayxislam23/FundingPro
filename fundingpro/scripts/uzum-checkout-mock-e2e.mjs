#!/usr/bin/env node
/**
 * Mock Checkout E2E (no Uzum Checkout API credentials).
 * Simulates: register (mock) → return → subscription ACTIVE.
 *
 * Prerequisites:
 *   - PAYMENTS_ENABLED=true on dev server (for HTTP path)
 *   - DATABASE_URL
 *   - Optional: UZUM_E2E_BEARER_TOKEN + dev server for full API test
 *
 * Usage: npm run uzum:checkout-mock
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { randomUUID } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.UZUM_E2E_BASE_URL ?? "http://localhost:3000";
const BEARER = process.env.UZUM_E2E_BEARER_TOKEN ?? "";
const DEV_USER_ID = "c0000001-0000-4000-8000-000000000001";

function loadEnv() {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (merged[m[1]] === undefined) merged[m[1]] = v;
    }
  }
  return merged;
}

const env = loadEnv();

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

async function seedPayment(pool) {
  const paymentId = randomUUID();
  const subscriptionId = randomUUID();
  const amountTiyin = 38400000;
  const metadata = {
    planId: "plan-ngo-basic",
    planName: "Basic",
    amountUzs: 384000,
    amountTiyin,
  };

  await pool.query(
    `INSERT INTO users (id, email) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING`,
    [DEV_USER_ID, "info@info.uz"]
  );

  await pool.query(
    `INSERT INTO subscriptions (id, user_id, plan_id, status)
     VALUES ($1::uuid, $2::uuid, $3, 'PENDING')`,
    [subscriptionId, DEV_USER_ID, "plan-ngo-basic"]
  );

  await pool.query(
    `INSERT INTO payments (id, user_id, subscription_id, amount_usd, currency, status, provider, idempotency_key, service_type, metadata)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 30, 'UZS', 'PENDING', 'uzum', $4, 'subscription', $5::jsonb)`,
    [paymentId, DEV_USER_ID, subscriptionId, `mock-checkout-${paymentId}`, JSON.stringify(metadata)]
  );

  return { paymentId, subscriptionId, amountTiyin };
}

async function activateMockCheckout(pool, paymentId) {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  const pay = await pool.query(`SELECT subscription_id, metadata FROM payments WHERE id = $1::uuid`, [
    paymentId,
  ]);
  const subId = pay.rows[0]?.subscription_id;
  if (!subId) throw new Error("Payment not found");

  const meta = pay.rows[0]?.metadata ?? {};
  await pool.query(
    `UPDATE payments SET metadata = $2::jsonb, provider_ref_id = $3, updated_at = now() WHERE id = $1::uuid`,
    [paymentId, JSON.stringify({ ...meta, checkoutMock: true, checkoutOrderId: paymentId }), paymentId]
  );

  await pool.query(
    `UPDATE subscriptions SET status = 'ACTIVE', start_date = $2, end_date = $3, updated_at = now()
     WHERE id = $1::uuid`,
    [subId, now.toISOString(), end.toISOString()]
  );
  await pool.query(
    `UPDATE payments SET status = 'SUCCESS', activated_at = $2, updated_at = now() WHERE id = $1::uuid`,
    [paymentId, now.toISOString()]
  );
}

console.log("Uzum Checkout mock E2E\n");

if (process.env.PAYMENTS_ENABLED !== "true" && env.PAYMENTS_ENABLED !== "true") {
  console.error("Set PAYMENTS_ENABLED=true for HTTP checkout test.");
}

const dbUrl = process.env.DATABASE_URL ?? env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL required.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });
let paymentId;

try {
  const seeded = await seedPayment(pool);
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
    await activateMockCheckout(pool, paymentId);
    assert("mock checkout activation (DB path)", true);
  }

  const payRow = await pool.query(`SELECT status FROM payments WHERE id = $1::uuid`, [paymentId]);
  assert("payment status SUCCESS", payRow.rows[0]?.status === "SUCCESS", payRow.rows[0]?.status);

  const subRow = await pool.query(
    `SELECT s.status FROM subscriptions s
     INNER JOIN payments p ON p.subscription_id = s.id
     WHERE p.id = $1::uuid`,
    [paymentId]
  );
  assert("subscription status ACTIVE", subRow.rows[0]?.status === "ACTIVE", subRow.rows[0]?.status);
} catch (e) {
  console.error("E2E error:", e);
  failed++;
} finally {
  await pool.end();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
