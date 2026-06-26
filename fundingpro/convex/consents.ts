import { v } from "convex/values";
import { query } from "./_generated/server";
import { authedMutation, authedQuery, adminQuery } from "./lib/customFunctions";

const REQUIRED_CONSENT_TYPES = [
  "terms_of_service",
  "privacy_policy",
  "ai_disclosure",
] as const;

const PAYMENT_CONSENT_TYPES = ["payment_terms"] as const;

const CURRENT_VERSIONS: Record<string, string> = {
  terms_of_service: "2025-01",
  privacy_policy: "2025-01",
  ai_disclosure: "2025-01",
  payment_terms: "2025-01",
};

export const record = authedMutation({
  args: {
    consents: v.array(
      v.object({
        consentType: v.string(),
        documentVersion: v.string(),
        locale: v.optional(v.string()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const c of args.consents) {
      await ctx.db.insert("userConsents", {
        userId: ctx.user._id,
        consentType: c.consentType,
        documentVersion: c.documentVersion,
        locale: c.locale,
        createdAt: now,
      });
    }
    return null;
  },
});

export const listForUser = authedQuery({
  args: {},
  returns: v.array(
    v.object({
      consentType: v.string(),
      documentVersion: v.string(),
      locale: v.union(v.string(), v.null()),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("userConsents")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    return rows.map((r) => ({
      consentType: r.consentType,
      documentVersion: r.documentVersion,
      locale: r.locale ?? null,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },
});

export const hasCurrent = authedQuery({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    missing: v.array(v.string()),
    needsReconsent: v.boolean(),
  }),
  handler: async (ctx) => {
    const consents = await ctx.db
      .query("userConsents")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const latest = new Map<string, string>();
    for (const c of consents) {
      latest.set(c.consentType, c.documentVersion);
    }

    const missing: string[] = [];
    let needsReconsent = false;
    for (const type of REQUIRED_CONSENT_TYPES) {
      const version = latest.get(type);
      if (!version) {
        missing.push(type);
      } else if (version !== CURRENT_VERSIONS[type]) {
        needsReconsent = true;
      }
    }

    return { ok: missing.length === 0 && !needsReconsent, missing, needsReconsent };
  },
});

export const assertPayment = authedQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const consents = await ctx.db
      .query("userConsents")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    for (const type of PAYMENT_CONSENT_TYPES) {
      const has = consents.some(
        (c) => c.consentType === type && c.documentVersion === CURRENT_VERSIONS[type]
      );
      if (!has) return false;
    }
    return true;
  },
});

export const listRecent = adminQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      userId: v.string(),
      consentType: v.string(),
      documentVersion: v.string(),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("userConsents").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const result = [];
    for (const row of rows.slice(0, args.limit)) {
      const user = await ctx.db.get("users", row.userId);
      result.push({
        userId: user?.clerkId ?? row.userId,
        consentType: row.consentType,
        documentVersion: row.documentVersion,
        createdAt: new Date(row.createdAt).toISOString(),
      });
    }
    return result;
  },
});

export const getRequiredTypes = query({
  args: {},
  returns: v.array(v.string()),
  handler: async () => [...REQUIRED_CONSENT_TYPES],
});
