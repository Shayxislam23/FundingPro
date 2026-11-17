import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";
import {
  generatePartnerApiKey,
  hashPartnerApiKey,
  isWellFormedPartnerKey,
  partnerKeyEnvironment,
} from "../convex/lib/partnerKeys.ts";
import {
  computeCommission,
  fromPublicGrantId,
  maskEmail,
  maskName,
  maskPhone,
  normalizePhone,
} from "../convex/lib/partnerApi.ts";
import {
  hasKeyInQuery,
  ipMatches,
  isIpAllowedForPartner,
  isOriginAllowedForPartner,
} from "../lib/partner-api/access.ts";
import {
  grantsListQuerySchema,
  idempotencyKeySchema,
  leadBodySchema,
  searchParamsToObject,
} from "../lib/partner-api/validation.ts";
import { createWithPartner } from "../lib/partner-api/with-partner.ts";
import { PartnerApiError } from "../lib/partner-api/errors.ts";

const PARTNER = {
  id: "partner_doc_id",
  partnerCode: "jizzakh_business_platform",
  name: "Jizzakh",
  environment: "production",
  allowedDomains: ["https://biznes-jizzakh.uz"],
  allowedIps: [],
  allowedAppIds: [],
  brandingRequired: true,
};

function okAuth(partner = PARTNER) {
  return {
    ok: true,
    partner,
    rateLimit: { limit: 60, remaining: 59, resetAt: Date.now() + 60_000 },
    monthly: { limit: 5000, used: 1 },
  };
}

function harness(beginRequest = async () => okAuth(), environment = "production") {
  const logs = [];
  const deferred = [];
  const withPartner = createWithPartner({
    environment: () => environment,
    beginRequest,
    logRequest: async (entry) => {
      logs.push(entry);
    },
    defer: (task) => deferred.push(task),
  });
  return {
    logs,
    flush: async () => {
      for (const t of deferred.splice(0)) await t();
    },
    route: (handler = async () => NextResponse.json({ ok: true })) => withPartner("GET /v1/grants", handler),
  };
}

const ctx = { params: Promise.resolve({}) };
const req = (url = "https://api.fundingpro.uz/v1/grants", headers = {}) =>
  new NextRequest(url, { headers: new Headers(headers) });

describe("partner keys", () => {
  it("generates well-formed keys per environment and hashes deterministically", async () => {
    const live = generatePartnerApiKey("production");
    const test = generatePartnerApiKey("sandbox");
    assert.ok(isWellFormedPartnerKey(live) && live.startsWith("fp_live_"));
    assert.ok(isWellFormedPartnerKey(test) && test.startsWith("fp_test_"));
    assert.equal(partnerKeyEnvironment(test), "sandbox");
    assert.notEqual(live, generatePartnerApiKey("production"));
    const h = await hashPartnerApiKey(live);
    assert.match(h, /^[0-9a-f]{64}$/);
    assert.equal(h, await hashPartnerApiKey(live));
    assert.ok(!h.includes(live));
  });
});

describe("access restrictions", () => {
  it("allows server-to-server calls (no Origin) and only listed browser origins", () => {
    assert.equal(isOriginAllowedForPartner(null, []), true);
    assert.equal(isOriginAllowedForPartner("https://biznes-jizzakh.uz", ["https://biznes-jizzakh.uz"]), true);
    assert.equal(isOriginAllowedForPartner("https://evil.example", ["https://biznes-jizzakh.uz"]), false);
    assert.equal(isOriginAllowedForPartner("https://biznes-jizzakh.uz", []), false);
  });

  it("matches IPv4 exact and CIDR rules", () => {
    assert.equal(ipMatches("203.0.113.7", "203.0.113.0/24"), true);
    assert.equal(ipMatches("203.0.114.7", "203.0.113.0/24"), false);
    assert.equal(ipMatches("198.51.100.1", "198.51.100.1"), true);
    assert.equal(isIpAllowedForPartner(null, ["1.2.3.4"]), false);
    assert.equal(isIpAllowedForPartner("5.6.7.8", []), true);
  });

  it("detects API keys placed in the query string", () => {
    assert.equal(hasKeyInQuery(new URLSearchParams("api_key=x")), true);
    assert.equal(hasKeyInQuery(new URLSearchParams("sector=agriculture")), false);
  });
});

describe("input validation", () => {
  const base = {
    partner_id: "jizzakh_business_platform",
    grant_id: "grant_k57abc0123456789",
    full_name: "Ali Valiyev",
    phone: "90 123-45-67",
    consent_to_contact: true,
    consent_text_version: "v1.0",
  };

  it("normalizes Uzbek phone numbers and emails", () => {
    const r = leadBodySchema.safeParse({ ...base, email: "Ali@Example.com" });
    assert.ok(r.success);
    assert.equal(r.data.phone, "+998901234567");
    assert.equal(r.data.email, "ali@example.com");
    assert.equal(normalizePhone("+998 (90) 123 45 67"), "+998901234567");
  });

  it("requires phone or email, rejects unknown fields and over-long input", () => {
    assert.equal(leadBodySchema.safeParse({ ...base, phone: undefined }).success, false);
    assert.equal(leadBodySchema.safeParse({ ...base, fit_score: 99 }).success, false);
    assert.equal(leadBodySchema.safeParse({ ...base, message: "x".repeat(2001) }).success, false);
    assert.equal(leadBodySchema.safeParse({ ...base, full_name: "x".repeat(121) }).success, false);
    assert.equal(leadBodySchema.safeParse({ ...base, phone: "abc" }).success, false);
  });

  it("caps list limit at 50 and rejects unknown params", () => {
    const r = grantsListQuerySchema.safeParse({ limit: "500", page: "2" });
    assert.ok(r.success);
    assert.equal(r.data.limit, 50);
    assert.equal(grantsListQuerySchema.safeParse({ export: "csv" }).success, false);
    assert.equal(grantsListQuerySchema.safeParse({ sort: "random" }).success, false);
    assert.deepEqual(searchParamsToObject(new URLSearchParams("a=1&a=2")), { __duplicate: "a" });
  });

  it("accepts only UUID idempotency keys", () => {
    assert.ok(idempotencyKeySchema.safeParse("6f1c2b8e-4a0d-4c1e-9b7a-3d2e1f0a9b8c").success);
    assert.equal(idempotencyKeySchema.safeParse("abc").success, false);
  });

  it("parses public grant ids", () => {
    assert.equal(fromPublicGrantId("grant_k57abc0123456789"), "k57abc0123456789");
    assert.equal(fromPublicGrantId("grant_../../etc"), null);
  });
});

describe("personal data masking", () => {
  it("masks phone, email and name", () => {
    assert.equal(maskPhone("+998901234567"), "+99890*****67");
    assert.equal(maskEmail("ali@example.com"), "a***@example.com");
    assert.equal(maskName("Ali Valiyev"), "A*** V***");
  });

  it("computes commission from received money only", () => {
    assert.equal(computeCommission(10_000_000, 10), 1_000_000);
    assert.equal(computeCommission(0, 10), 0);
    assert.equal(computeCommission(-5, 10), 0);
  });
});

describe("withPartner wrapper", () => {
  it("rejects a missing key with the standard error envelope", async () => {
    const h = harness();
    const res = await h.route()(req(), ctx);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, "INVALID_API_KEY");
    assert.match(body.error.request_id, /^req_/);
    assert.equal(res.headers.get("x-request-id"), body.error.request_id);
  });

  it("refuses keys in the URL", async () => {
    const h = harness();
    const res = await h.route()(req("https://api.fundingpro.uz/v1/grants?api_key=fp_live_x"), ctx);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, "INVALID_REQUEST");
  });

  it("refuses sandbox keys in production without calling the backend", async () => {
    let called = false;
    const h = harness(async () => {
      called = true;
      return okAuth();
    });
    const res = await h.route()(req(undefined, { "x-api-key": generatePartnerApiKey("sandbox") }), ctx);
    assert.equal(res.status, 401);
    assert.equal(called, false);
  });

  it("returns 429 RATE_LIMIT_EXCEEDED with Retry-After", async () => {
    const h = harness(async () => ({
      ok: false,
      code: "RATE_LIMIT_EXCEEDED",
      message: "API request limit exceeded",
      partnerId: "p1",
      retryAfterSec: 30,
      rateLimit: { limit: 60, remaining: 0, resetAt: Date.now() + 30_000 },
    }));
    const res = await h.route()(req(undefined, { "x-api-key": generatePartnerApiKey("production") }), ctx);
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "30");
    assert.equal(res.headers.get("x-ratelimit-remaining"), "0");
    assert.deepEqual(Object.keys((await res.json()).error).sort(), ["code", "message", "request_id"]);
  });

  it("maps suspended partner to 403", async () => {
    const h = harness(async () => ({
      ok: false,
      code: "PARTNER_SUSPENDED",
      message: "Partner access is suspended",
      partnerId: "p1",
      retryAfterSec: null,
      rateLimit: null,
    }));
    const res = await h.route()(req(undefined, { "x-api-key": generatePartnerApiKey("production") }), ctx);
    assert.equal(res.status, 403);
  });

  it("fails closed (503) when the auth backend is down", async () => {
    const h = harness(async () => {
      throw new Error("convex unavailable");
    });
    const res = await h.route()(req(undefined, { "x-api-key": generatePartnerApiKey("production") }), ctx);
    assert.equal(res.status, 503);
  });

  it("blocks browser calls from unlisted origins (CORS allowlist)", async () => {
    const h = harness();
    const res = await h.route()(
      req(undefined, { "x-api-key": generatePartnerApiKey("production"), origin: "https://evil.example" }),
      ctx
    );
    assert.equal(res.status, 403);
    assert.equal((await res.json()).error.code, "FORBIDDEN_ORIGIN");
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });

  it("adds CORS headers for an allowed origin and the attribution header", async () => {
    const h = harness();
    const res = await h.route()(
      req(undefined, { "x-api-key": generatePartnerApiKey("production"), origin: "https://biznes-jizzakh.uz" }),
      ctx
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://biznes-jizzakh.uz");
    assert.equal(res.headers.get("x-fundingpro-attribution"), "Grant data powered by FundingPro");
  });

  it("enforces the partner IP allowlist", async () => {
    const h = harness(async () => okAuth({ ...PARTNER, allowedIps: ["203.0.113.0/24"] }));
    const denied = await h.route()(
      req(undefined, { "x-api-key": generatePartnerApiKey("production"), "x-real-ip": "198.51.100.4" }),
      ctx
    );
    assert.equal(denied.status, 403);
    const allowed = await h.route()(
      req(undefined, { "x-api-key": generatePartnerApiKey("production"), "x-real-ip": "203.0.113.9" }),
      ctx
    );
    assert.equal(allowed.status, 200);
  });

  it("maps PartnerApiError from handlers and logs metadata only (no key, no IP, no PII)", async () => {
    const h = harness();
    const key = generatePartnerApiKey("production");
    const res = await h.route(async () => {
      throw new PartnerApiError("GRANT_NOT_FOUND", "Grant not found");
    })(req("https://api.fundingpro.uz/v1/grants?search=Ali", { "x-api-key": key, "x-real-ip": "203.0.113.9" }), ctx);
    assert.equal(res.status, 404);
    await h.flush();
    assert.equal(h.logs.length, 1);
    const entry = h.logs[0];
    assert.deepEqual(
      Object.keys(entry).sort(),
      ["endpoint", "errorCode", "ipHash", "method", "partnerId", "requestId", "responseTimeMs", "statusCode"]
    );
    const serialized = JSON.stringify(entry);
    assert.ok(!serialized.includes(key));
    assert.ok(!serialized.includes("203.0.113.9"));
    assert.ok(!serialized.includes("Ali"));
    assert.equal(entry.errorCode, "GRANT_NOT_FOUND");
  });

  it("hides internal error details", async () => {
    const h = harness();
    const res = await h.route(async () => {
      throw new Error("db password is hunter2");
    })(req(undefined, { "x-api-key": generatePartnerApiKey("production") }), ctx);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error.code, "INTERNAL_ERROR");
    assert.ok(!JSON.stringify(body).includes("hunter2"));
  });
});
