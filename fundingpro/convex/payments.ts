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
    provider: v.union(v.literal("uzum"), v.literal("payme"), v.literal("click")),
  },
  returns: v.object({ paymentId: v.string(), subscriptionId: v.string() }),
  handler: async (ctx, args) => {
    const planConvexId = await resolvePlanId(ctx, args.planId);
    const now = Date.now();
    const idempotencyKey = `intent-${ctx.user.clerkId}-${args.planId}-${args.provider}-${now}`;
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
      provider: args.provider,
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
  args: {
    provider: v.optional(
      v.union(v.literal("uzum"), v.literal("payme"), v.literal("click"), v.literal("all"))
    ),
  },
  returns: v.object({
    stats: v.object({
      totalPayments: v.number(),
      pendingPayments: v.number(),
      subscriptionRequests: v.number(),
    }),
    payments: v.array(
      v.object({
        id: v.string(),
        userEmail: v.union(v.string(), v.null()),
        planName: v.union(v.string(), v.null()),
        amountUsd: v.number(),
        platformShareUsd: v.union(v.number(), v.null()),
        createdAt: v.string(),
        status: v.string(),
        provider: v.string(),
        providerRefId: v.union(v.string(), v.null()),
      })
    ),
    subscriptionRequests: v.array(
      v.object({
        id: v.string(),
        subject: v.string(),
        userEmail: v.union(v.string(), v.null()),
        status: v.string(),
        createdAt: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const providerFilter = args.provider && args.provider !== "all" ? args.provider : null;

    const payments = providerFilter
      ? await ctx.db
          .query("payments")
          .withIndex("by_provider", (q) => q.eq("provider", providerFilter))
          .order("desc")
          .take(200)
      : await ctx.db.query("payments").order("desc").take(200);

    const pendingPayments = payments.filter((p) => p.status === "PENDING").length;

    const paymentRows = await Promise.all(
      payments.slice(0, 50).map(async (p) => {
        const user = await ctx.db.get("users", p.userId);
        const meta = (p.metadata ?? {}) as Record<string, unknown>;
        const platformShareUsd =
          typeof meta.platformShareUsd === "number" ? meta.platformShareUsd : null;
        return {
          id: p._id,
          userEmail: user?.email ?? null,
          planName: typeof meta.planName === "string" ? meta.planName : null,
          amountUsd: p.amountUsd,
          platformShareUsd,
          createdAt: new Date(p.createdAt).toISOString(),
          status: p.status,
          provider: p.provider,
          providerRefId: p.providerRefId ?? null,
        };
      })
    );

    const requests = await ctx.db
      .query("subscriptionRequests")
      .order("desc")
      .take(50);

    const subscriptionRequestRows = await Promise.all(
      requests.map(async (r) => {
        const user = await ctx.db.get("users", r.userId);
        const plan = await ctx.db.get("plans", r.planId);
        return {
          id: r._id,
          subject: plan?.nameRu ?? plan?.name ?? "Subscription request",
          userEmail: user?.email ?? null,
          status: r.status,
          createdAt: new Date(r.createdAt).toISOString(),
        };
      })
    );

    return {
      stats: {
        totalPayments: payments.length,
        pendingPayments,
        subscriptionRequests: requests.filter((r) => r.status === "PENDING").length,
      },
      payments: paymentRows,
      subscriptionRequests: subscriptionRequestRows,
    };
  },
});
