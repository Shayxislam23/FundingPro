import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serviceRequestSchema } from "../lib/service-requests.ts";
import { formatUzs } from "../lib/offers.ts";

const ok = {
  full_name: "Ali Valiyev",
  phone: "90 123 45 67",
  applicant_type: "business",
  region: "Джизакская область",
  consent: true,
};

describe("service request form validation", () => {
  it("accepts a valid request and normalizes the phone", () => {
    const r = serviceRequestSchema.safeParse(ok);
    assert.ok(r.success);
    assert.equal(r.data.phone, "+998901234567");
  });

  it("requires consent", () => {
    assert.equal(serviceRequestSchema.safeParse({ ...ok, consent: false }).success, false);
  });

  it("requires phone or email", () => {
    assert.equal(serviceRequestSchema.safeParse({ ...ok, phone: "" }).success, false);
    assert.ok(serviceRequestSchema.safeParse({ ...ok, phone: "", email: "a@b.uz" }).success);
  });

  it("rejects unknown fields, unknown regions and over-long text", () => {
    assert.equal(serviceRequestSchema.safeParse({ ...ok, admin: true }).success, false);
    assert.equal(serviceRequestSchema.safeParse({ ...ok, region: "Mars" }).success, false);
    assert.equal(serviceRequestSchema.safeParse({ ...ok, message: "x".repeat(2001) }).success, false);
  });

  it("formats sums with spaces", () => {
    assert.equal(formatUzs(150000), "150\u00A0000\u00A0сум");
    assert.equal(formatUzs(1500000), "1\u00A0500\u00A0000\u00A0сум");
  });
});
