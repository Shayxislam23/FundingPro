#!/usr/bin/env node
/**
 * Smoke tests against running dev server (default localhost:3000).
 * Usage: npm run test:smoke
 *
 * Auth uses Supabase Email OTP — no mock login API.
 * Set SMOKE_AUTH=1 and SMOKE_BEARER_TOKEN=<jwt> to test protected routes.
 */
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const BEARER = process.env.SMOKE_BEARER_TOKEN ?? "";
const RUN_AUTH = process.env.SMOKE_AUTH === "1" && BEARER.length > 10;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

let passed = 0;
let failed = 0;

function assert(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
  }
}

console.log(`Smoke tests → ${BASE}\n`);

const health = await request("/api/v1/health");
assert("GET /api/v1/health returns 200 or 503", [200, 503].includes(health.status));
assert("health has service field", health.json?.service === "FundingPro API");
assert("health has status field", typeof health.json?.status === "string");

const grants = await request("/api/v1/grants?limit=5");
assert("GET /api/v1/grants returns 200", grants.status === 200);
assert("grants list is array", Array.isArray(grants.json?.data?.grants));
const grantTotal = grants.json?.data?.total ?? 0;
assert("grants total >= 0", grantTotal >= 0, `total=${grantTotal}`);

const grantsQ = await request("/api/v1/grants?q=education&limit=3");
assert("GET /api/v1/grants?q= works", grantsQ.status === 200);

const subs = await request("/api/v1/subscriptions/current");
assert("subscriptions/current requires auth", subs.status === 401);

const me = await request("/api/v1/me");
assert("GET /me requires auth", me.status === 401);

const adminDash = await request("/api/v1/admin/dashboard");
assert("GET /admin/dashboard requires auth", adminDash.status === 401);

const postApp = await request("/api/v1/applications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ grantId: "00000000-0000-0000-0000-000000000001" }),
});
assert("POST /applications requires auth", postApp.status === 401);

const legacyWebhook = await request("/api/v1/payments/webhook", { method: "POST" });
assert("legacy webhook returns 410", legacyWebhook.status === 410);

const plans = await request("/api/v1/plans");
assert("GET /plans returns 200", plans.status === 200);

const payStatus = await request("/api/v1/payments/status");
assert("GET /payments/status returns 200", payStatus.status === 200);
assert("payments status has paymentsEnabled", typeof payStatus.json?.data?.paymentsEnabled === "boolean");

if (RUN_AUTH) {
  console.log("\nAuthenticated routes (SMOKE_BEARER_TOKEN):");
  const authHeaders = {
    Authorization: `Bearer ${BEARER}`,
    "Content-Type": "application/json",
  };

  const me = await request("/api/v1/me", { headers: authHeaders });
  assert("GET /me returns 200", me.status === 200, `status=${me.status}`);
  assert("me has email", typeof me.json?.data?.email === "string");

  const orgs = await request("/api/v1/organizations", { headers: authHeaders });
  assert("GET /organizations returns 200", orgs.status === 200);

  const apps = await request("/api/v1/applications", { headers: authHeaders });
  assert("GET /applications returns 200", apps.status === 200);
  assert("applications is array", Array.isArray(apps.json?.data?.applications));
} else {
  console.log("\n  ⊘ Auth smoke skipped — use SMOKE_AUTH=1 + SMOKE_BEARER_TOKEN for /me tests");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
