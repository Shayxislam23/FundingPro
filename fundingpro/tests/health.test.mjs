import { test } from "node:test";
import assert from "node:assert/strict";

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
