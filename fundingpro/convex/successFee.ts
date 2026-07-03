import { v } from "convex/values";
import { adminMutation, adminQuery, authedMutation } from "./lib/customFunctions";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Success-fee tracking: FundingPro charges 2-5% of a won grant amount
 * (see /legal/success-fee), only if agreed in advance. This module makes
 * that policy a real, auditable ledger instead of just pricing copy —
 * every "won" application with a reported amount produces one record here.
 */

const DEFAULT_FEE_PERCENT = 3;
const MIN_FEE_PERCENT = 2;
const MAX_FEE_PERCENT = 5;

async function resolveFeePercent(ctx: MutationCtx): Promise<number> {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", "successFeePercent"))
    .unique();
  const parsed = setting ? Number(setting.value) : NaN;
  if (!Number.isFinite(parsed)) return DEFAULT_FEE_PERCENT;
  return Math.min(MAX_FEE_PERCENT, Math.max(MIN_FEE_PERCENT, parsed));
}

/**
 * Called when an application transitions to "won" with a self-reported
 * amount. Idempotent: one record per application. Amount corrections are
 * only applied while the record is still "pending" — once ops has marked
 * it invoiced/paid/waived, the ledger is frozen against user edits.
 */
export async function recordWinIfNeeded(
  ctx: MutationCtx,
  args: { applicationId: Id<"applications">; grantId: Id<"grants">; userId: Id<"users">; wonAmountUsd: number }
): Promise<void> {
  if (!Number.isFinite(args.wonAmountUsd) || args.wonAmountUsd <= 0) return;

  const existing = await ctx.db
    .query("successFeeRecords")
    .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
    .unique();

  const now = Date.now();
  const feePercent = existing?.feePercent ?? (await resolveFeePercent(ctx));
  const feeAmountUsd = Math.round(args.wonAmountUsd * (feePercent / 100) * 100) / 100;

  if (!existing) {
    await ctx.db.insert("successFeeRecords", {
      applicationId: args.applicationId,
      grantId: args.grantId,
      userId: args.userId,
      wonAmountUsd: args.wonAmountUsd,
      feePercent,
      feeAmountUsd,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  if (existing.status === "pending") {
    await ctx.db.patch("successFeeRecords", existing._id, {
      wonAmountUsd: args.wonAmountUsd,
      feeAmountUsd,
      updatedAt: now,
    });
  }
}

export const getMyRecord = authedMutation({
  args: { applicationId: v.string() },
  returns: v.union(
    v.object({
      id: v.string(),
      wonAmountUsd: v.number(),
      feePercent: v.number(),
      feeAmountUsd: v.number(),
      status: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("successFeeRecords")
      .withIndex("by_application", (q) =>
        q.eq("applicationId", args.applicationId as Id<"applications">)
      )
      .unique();
    if (!record || record.userId !== ctx.user._id) return null;
    return {
      id: record._id,
      wonAmountUsd: record.wonAmountUsd,
      feePercent: record.feePercent,
      feeAmountUsd: record.feeAmountUsd,
      status: record.status,
    };
  },
});

const ADMIN_LIST_LIMIT = 200;

export const adminList = adminQuery({
  args: { status: v.optional(v.string()) },
  returns: v.array(
    v.object({
      id: v.string(),
      userEmail: v.union(v.string(), v.null()),
      grantTitle: v.union(v.string(), v.null()),
      wonAmountUsd: v.number(),
      feePercent: v.number(),
      feeAmountUsd: v.number(),
      status: v.string(),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const records = args.status
      ? await ctx.db
          .query("successFeeRecords")
          .withIndex("by_status", (q) => q.eq("status", args.status as "pending"))
          .order("desc")
          .take(ADMIN_LIST_LIMIT)
      : await ctx.db.query("successFeeRecords").order("desc").take(ADMIN_LIST_LIMIT);

    const rows = [];
    for (const r of records) {
      const [user, grant] = await Promise.all([
        ctx.db.get("users", r.userId),
        ctx.db.get("grants", r.grantId),
      ]);
      rows.push({
        id: r._id,
        userEmail: user?.email ?? null,
        grantTitle: grant?.titleRu ?? grant?.title ?? null,
        wonAmountUsd: r.wonAmountUsd,
        feePercent: r.feePercent,
        feeAmountUsd: r.feeAmountUsd,
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
      });
    }
    return rows;
  },
});

export const adminUpdateStatus = adminMutation({
  args: {
    recordId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("invoiced"),
      v.literal("paid"),
      v.literal("waived")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const record = await ctx.db.get("successFeeRecords", args.recordId as Id<"successFeeRecords">);
    if (!record) throw new Error("Success fee record not found");
    await ctx.db.patch("successFeeRecords", record._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});
