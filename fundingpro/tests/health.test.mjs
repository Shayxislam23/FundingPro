import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHealthPayload } from "../lib/health-response.ts";

const HEALTH_SHAPE = {
  service: "FundingPro API",
  status: ["ok", "degraded", "error"],
  version: "string",
};

function validateHealthPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.service !== HEALTH_SHAPE.service) return false;
  if (!HEALTH_SHAPE.status.includes(payload.status)) return false;
  if (typeof payload.version !== "string" || !payload.version) return false;
  return true;
}

test("health payload schema accepts valid response", () => {
  assert.equal(
    validateHealthPayload({ service: "FundingPro API", status: "ok", version: "1.0.0" }),
    true
  );
});

test("health payload schema rejects invalid service", () => {
  assert.equal(validateHealthPayload({ service: "Other", status: "ok", version: "1" }), false);
});

test("production health payload omits database error details", () => {
  const payload = buildHealthPayload({
    dbStatus: "error",
    dbError: "connection refused",
    company: "FundingPro",
    isProduction: true,
    now: "2026-06-27T00:00:00.000Z",
  });

  assert.equal(payload.database.status, "error");
  assert.equal("error" in payload.database, false);
  assert.equal("provider" in payload.ai, false);
  assert.equal(payload.ai.status, "ok");
  assert.equal("integrationStatus" in payload.payments, false);
});

test("non-production health payload includes diagnostic fields", () => {
  const payload = buildHealthPayload({
    dbStatus: "error",
    dbError: "connection refused",
    company: "FundingPro",
    isProduction: false,
    aiProvider: "mock",
    now: "2026-06-27T00:00:00.000Z",
  });

  assert.equal(payload.database.error, "connection refused");
  assert.equal(payload.ai.provider, "mock");
  assert.equal("integrationStatus" in payload.payments, true);
});
