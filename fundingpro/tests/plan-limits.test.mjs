import { test } from "node:test";
import assert from "node:assert/strict";

// Mirror server-side limits map (no DB in unit test)
const PLAN_LIMITS = {
  "plan-ngo-basic": { eligibilityChecks: 5, aiProposals: 2 },
  "plan-ngo-pro": { eligibilityChecks: null, aiProposals: 10 },
  "plan-ngo-consulting": { eligibilityChecks: null, aiProposals: null },
  "plan-consulting": { eligibilityChecks: null, aiProposals: null },
};

const FREE_LIMITS = { eligibilityChecks: 2, aiProposals: 1 };

function limitsForPlanId(planId) {
  if (!planId) return FREE_LIMITS;
  return PLAN_LIMITS[planId] ?? FREE_LIMITS;
}

function isOverLimit(used, max) {
  return max !== null && used >= max;
}

test("free tier limits", () => {
  const limits = limitsForPlanId(null);
  assert.equal(limits.eligibilityChecks, 2);
  assert.equal(limits.aiProposals, 1);
});

test("ngo basic plan limits", () => {
  const limits = limitsForPlanId("plan-ngo-basic");
  assert.equal(limits.eligibilityChecks, 5);
  assert.equal(limits.aiProposals, 2);
});

test("ngo pro has unlimited eligibility", () => {
  const limits = limitsForPlanId("plan-ngo-pro");
  assert.equal(limits.eligibilityChecks, null);
  assert.equal(isOverLimit(100, limits.eligibilityChecks), false);
});

test("ngo consulting plan limits (current slug)", () => {
  const limits = limitsForPlanId("plan-ngo-consulting");
  assert.equal(limits.eligibilityChecks, null);
  assert.equal(limits.aiProposals, null);
});

test("legacy plan-consulting slug maps to consulting limits", () => {
  const limits = limitsForPlanId("plan-consulting");
  assert.equal(limits.eligibilityChecks, null);
});

test("limit enforcement at boundary", () => {
  const limits = limitsForPlanId("plan-ngo-basic");
  assert.equal(isOverLimit(4, limits.eligibilityChecks), false);
  assert.equal(isOverLimit(5, limits.eligibilityChecks), true);
});
