import { test } from "node:test";
import assert from "node:assert/strict";
import { GRANT_DETAIL_FIXTURE, grantDetailSchema, grantRequirementSchema } from "../src/index.ts";

test("grantRequirementSchema accepts Convex grant requirement shape", () => {
  const parsed = grantRequirementSchema.safeParse(GRANT_DETAIL_FIXTURE.grant_requirements[0]);
  assert.equal(parsed.success, true);
});

test("grantDetailSchema accepts Convex getById fixture", () => {
  const parsed = grantDetailSchema.safeParse(GRANT_DETAIL_FIXTURE);
  assert.equal(parsed.success, true, parsed.success ? undefined : JSON.stringify(parsed.error.format()));
});

test("grantDetailSchema rejects legacy requirements field as primary contract", () => {
  const parsed = grantDetailSchema.safeParse({
    ...GRANT_DETAIL_FIXTURE,
    requirements: [{ legacy: true }],
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && "requirements" in parsed.data, false);
});
