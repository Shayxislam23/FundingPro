import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GRANT_DETAIL_FIXTURE,
  PAYMENTS_STATUS_FIXTURE,
  PLANS_FIXTURE,
  grantDetailSchema,
  paymentConfigSchema,
  plansResponseSchema,
} from "../src/index.ts";

test("grant detail fixture matches schema", () => {
  const parsed = grantDetailSchema.safeParse(GRANT_DETAIL_FIXTURE);
  assert.equal(parsed.success, true);
});

test("plans fixture matches schema", () => {
  const parsed = plansResponseSchema.safeParse(PLANS_FIXTURE);
  assert.equal(parsed.success, true);
});

test("payments status fixture matches schema", () => {
  const parsed = paymentConfigSchema.safeParse(PAYMENTS_STATUS_FIXTURE);
  assert.equal(parsed.success, true);
});
