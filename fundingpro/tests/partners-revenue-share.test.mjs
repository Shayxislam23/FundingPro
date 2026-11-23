import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_REVENUE_SHARE_TIERS,
  resolveRevenueShare,
} from "../../fundingpro/lib/partners/revenue-share.ts";

test("resolveRevenueShare uses first tier for low volume", () => {
  const split = resolveRevenueShare(120);
  assert.equal(split.partnerPercent, 30);
  assert.equal(split.fundingProPercent, 70);
});

test("resolveRevenueShare uses highest tier for large volume", () => {
  const split = resolveRevenueShare(15000);
  assert.equal(split.partnerPercent, 20);
  assert.equal(split.fundingProPercent, 80);
});

test("default tiers cover all ranges without gaps", () => {
  assert.equal(DEFAULT_REVENUE_SHARE_TIERS.length, 5);
  for (const count of [0, 499, 500, 1500, 5000, 10000, 999999]) {
    const split = resolveRevenueShare(count);
    assert.equal(split.partnerPercent + split.fundingProPercent, 100);
  }
});
