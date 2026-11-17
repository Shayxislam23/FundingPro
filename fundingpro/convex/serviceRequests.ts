/**
 * "Заявка под ключ" — inbound sales requests from the public /business form.
 * Written only by the Next.js server (internal), read and managed by admins.
 */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import type { Doc } from "./_generated/dataModel";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

const statusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("won"),
  v.literal("lost")
);

export const create = internalMutation({
  args: {
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    applicantType: v.string(),
    region: v.optional(v.string()),
    grantInterest: v.optional(v.string()),
    message: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    consentTextVersion: v.string(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  returns: v.object({ id: v.string(), duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    if (!args.phone && !args.email) throw new Error("phone or email required");
    const now = Date.now();
    const recent: Doc<"serviceRequests">[] = [];
    if (args.phone) {
      recent.push(
        ...(await ctx.db
          .query("serviceRequests")
          .withIndex("by_phone", (q) => q.eq("phone", args.phone))
          .order("desc")
          .take(3))
      );
    }
    if (args.email) {
      recent.push(
        ...(await ctx.db
          .query("serviceRequests")
          .withIndex("by_email", (q) => q.eq("email", args.email))
          .order("desc")
          .take(3))
      );
    }
    const dup = recent.find((r) => r.updatedAt >= now - DEDUPE_WINDOW_MS && !r.anonymizedAt);
    if (dup) {
      const extra = [dup.message, args.message ? `[повтор ${new Date(now).toISOString().slice(0, 10)}] ${args.message}` : null]
        .filter(Boolean)
        .join("\n")
        .slice(0, 4000);
      await ctx.db.patch("serviceRequests", dup._id, {
        contactCount: dup.contactCount + 1,
        message: extra || undefined,
        updatedAt: now,
      });
      return { id: dup._id, duplicate: true };
    }
    const id = await ctx.db.insert("serviceRequests", {
      ...args,
      consentAt: now,
      status: "new",
      contactCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    return { id, duplicate: false };
  },
});

export const list = adminQuery({
  args: { status: v.optional(statusValidator), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 200), 500);
    const rows = args.status
      ? await ctx.db
          .query("serviceRequests")
          .withIndex("by_status_and_createdAt", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("serviceRequests").withIndex("by_createdAt").order("desc").take(limit);
    return rows.map((r) => ({
      id: r._id,
      fullName: r.fullName,
      phone: r.phone ?? null,
      email: r.email ?? null,
      organizationName: r.organizationName ?? null,
      applicantType: r.applicantType,
      region: r.region ?? null,
      grantInterest: r.grantInterest ?? null,
      message: r.message ?? null,
      preferredLanguage: r.preferredLanguage ?? null,
      utmSource: r.utmSource ?? null,
      status: r.status,
      notes: r.notes ?? null,
      contactCount: r.contactCount,
      createdAt: r.createdAt,
      anonymized: Boolean(r.anonymizedAt),
    }));
  },
});

export const update = adminMutation({
  args: { id: v.id("serviceRequests"), status: v.optional(statusValidator), notes: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get("serviceRequests", args.id);
    if (!row) throw new Error("Request not found");
    await ctx.db.patch("serviceRequests", args.id, {
      ...(args.status ? { status: args.status } : {}),
      ...(args.notes !== undefined ? { notes: args.notes.slice(0, 4000) } : {}),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Requests that did not become clients are anonymized after 12 months. */
export const purgeExpired = internalMutation({
  args: {},
  returns: v.object({ anonymized: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const old = await ctx.db
      .query("serviceRequests")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", now - RETENTION_MS))
      .take(200);
    let anonymized = 0;
    for (const r of old) {
      if (r.anonymizedAt || r.status === "won" || r.updatedAt >= now - RETENTION_MS) continue;
      await ctx.db.patch("serviceRequests", r._id, {
        fullName: "[deleted]",
        phone: undefined,
        email: undefined,
        organizationName: undefined,
        message: undefined,
        notes: undefined,
        anonymizedAt: now,
        updatedAt: now,
      });
      anonymized += 1;
    }
    return { anonymized };
  },
});
