import { v } from "convex/values";
import { authedMutation, authedQuery, adminQuery } from "./lib/customFunctions";
import type { Doc, Id } from "./_generated/dataModel";
import { mapPayment } from "./lib/paymentHelpers";
import type { QueryCtx } from "./_generated/server";

async function resolvePlanId(ctx: { db: QueryCtx["db"] }, planId: string) {
  const bySlug = await ctx.db
    .query("plans")
    .withIndex("by_slug", (q) => q.eq("slug", planId))
    .unique();
  if (bySlug) return bySlug._id;
  return planId as Id<"plans">;
}

export const createIntent = authedMutation({
  args: {
    planId: v.string(),
    planName: v.string(),
    amountUsd: v.number(),
    amountUzs: v.number(),
    amountTiyin: v.number(),
  },
  returns: v.object({ paymentId: v.string(), subscriptionId: v.string() }),
  handler: async (ctx, args) => {
    const planConvexId = await resolvePlanId(ctx, args.planId);
    const now = Date.now();
    const idempotencyKey = `intent-${ctx.user.clerkId}-${args.planId}-${now}`;
    const metadata = {
      planId: args.planId,
      planName: args.planName,
      amountUzs: args.amountUzs,
      amountTiyin: args.amountTiyin,
    };

    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: ctx.user._id,
      planId: planConvexId,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    const paymentId = await ctx.db.insert("payments", {
      userId: ctx.user._id,
      subscriptionId,
      amountUsd: args.amountUsd,
      currency: "UZS",
      status: "PENDING",
      provider: "uzum",
      idempotencyKey,
      serviceType: "subscription",
      metadata,
      createdAt: now,
      updatedAt: now,
    });

    return { paymentId, subscriptionId };
  },
});

export const getById = authedQuery({
  args: { paymentId: v.string() },
  returns: v.union(
    v.object({
      id: v.string(),
      userId: v.string(),
      subscriptionId: v.union(v.string(), v.null()),
      amountUsd: v.number(),
      amountTiyin: v.number(),
      currency: v.string(),
      status: v.string(),
      provider: v.string(),
      providerRefId: v.union(v.string(), v.null()),
      idempotencyKey: v.string(),
      serviceType: v.string(),
      metadata: v.any(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment || payment.userId !== ctx.user._id) return null;
    return mapPayment(payment, ctx.user.clerkId);
  },
});

export const adminReport = adminQuery({
  args: {},
  returns: v.object({
    totalRevenueUsd: v.number(),
    successfulPayments: v.number(),
    pendingPayments: v.number(),
    failedPayments: v.number(),
    recentPayments: v.array(
      v.object({
        id: v.string(),
        amountUsd: v.number(),
        status: v.string(),
        createdAt: v.string(),
      })
    ),
  }),
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();
    const successful = payments.filter((p) => p.status === "SUCCESS");
    const pending = payments.filter((p) => p.status === "PENDING");
    const failed = payments.filter((p) => p.status === "FAILED");
    const totalRevenueUsd = successful.reduce((s, p) => s + p.amountUsd, 0);
    const recent = [...payments]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map((p) => ({
        id: p._id,
        amountUsd: p.amountUsd,
        status: p.status,
        createdAt: new Date(p.createdAt).toISOString(),
      }));
    return {
      totalRevenueUsd,
      successfulPayments: successful.length,
      pendingPayments: pending.length,
      failedPayments: failed.length,
      recentPayments: recent,
    };
  },
});
