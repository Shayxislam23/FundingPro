import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { resolvePlanId } from "./lib/paymentHelpers";

const seedResultValidator = v.object({
  paymentId: v.string(),
  subscriptionId: v.string(),
  amountTiyin: v.number(),
  userId: v.string(),
});

type SeedProvider = "uzum" | "payme" | "click";

async function seedPaymentInternal(
  ctx: MutationCtx,
  args: {
    email?: string;
    planSlug?: string;
    clerkId?: string;
    provider?: SeedProvider;
  }
) {
  const now = Date.now();
  const provider = args.provider ?? "uzum";
  const email = args.email ?? `${provider}-e2e-${now}@test.local`;
  const clerkId = args.clerkId ?? `e2e-${provider}-${now}`;
  const planSlug = args.planSlug ?? "plan-ngo-basic";
  const amountTiyin = 38400000;

  let user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      clerkId,
      tokenIdentifier: `e2e|${clerkId}`,
      email,
      emailVerified: true,
      isActive: true,
      isBanned: false,
      platformRole: "user",
      createdAt: now,
      updatedAt: now,
    });
    user = await ctx.db.get("users", userId);
    if (!user) throw new Error("Failed to create E2E user");
  }

  const planConvexId = await resolvePlanId(ctx, planSlug);

  const subscriptionId = await ctx.db.insert("subscriptions", {
    userId: user._id,
    planId: planConvexId,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });

  const paymentId = await ctx.db.insert("payments", {
    userId: user._id,
    subscriptionId,
    amountUsd: 30,
    currency: "UZS",
    status: "PENDING",
    provider,
    idempotencyKey: `e2e-${provider}-${now}`,
    serviceType: "subscription",
    metadata: {
      planId: planSlug,
      planName: "Basic",
      amountUzs: 384000,
      amountTiyin,
    },
    createdAt: now,
    updatedAt: now,
  });

  return { paymentId, subscriptionId, amountTiyin, userId: user._id };
}

/** Seeds a pending subscription payment for Merchant/Checkout E2E scripts. */
export const seedPayment = internalMutation({
  args: {
    email: v.optional(v.string()),
    planSlug: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    provider: v.optional(v.union(v.literal("uzum"), v.literal("payme"), v.literal("click"))),
  },
  returns: seedResultValidator,
  handler: async (ctx, args) => seedPaymentInternal(ctx, args),
});

/** @deprecated Use seedPayment */
export const seedUzumPayment = internalMutation({
  args: {
    email: v.optional(v.string()),
    planSlug: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  returns: seedResultValidator,
  handler: async (ctx, args) => seedPaymentInternal(ctx, { ...args, provider: "uzum" }),
});

export const seedPaymePayment = internalMutation({
  args: {
    email: v.optional(v.string()),
    planSlug: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  returns: seedResultValidator,
  handler: async (ctx, args) => seedPaymentInternal(ctx, { ...args, provider: "payme" }),
});

export const seedClickPayment = internalMutation({
  args: {
    email: v.optional(v.string()),
    planSlug: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  returns: seedResultValidator,
  handler: async (ctx, args) => seedPaymentInternal(ctx, { ...args, provider: "click" }),
});

export const getPaymentStatus = internalQuery({
  args: { paymentId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    return payment?.status ?? null;
  },
});

export const getSubscriptionStatusByPayment = internalQuery({
  args: { paymentId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment?.subscriptionId) return null;
    const sub = await ctx.db.get("subscriptions", payment.subscriptionId);
    return sub?.status ?? null;
  },
});

export const getUzumTransactionState = internalQuery({
  args: { transId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("uzumTransactions")
      .withIndex("by_transId", (q) => q.eq("transId", args.transId))
      .unique();
    return row?.state ?? null;
  },
});

/** Simulates checkout return activation without calling Uzum Checkout API. */
export const activateMockCheckout = internalMutation({
  args: { paymentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment) throw new Error("Payment not found");

    const now = Date.now();
    const meta = {
      ...((payment.metadata ?? {}) as Record<string, unknown>),
      checkoutMock: true,
      checkoutOrderId: args.paymentId,
    };

    await ctx.db.patch("payments", payment._id, {
      metadata: meta,
      providerRefId: args.paymentId,
      updatedAt: now,
    });

    if (payment.subscriptionId) {
      const end = now + 30 * 24 * 60 * 60 * 1000;
      await ctx.db.patch("subscriptions", payment.subscriptionId, {
        status: "ACTIVE",
        startDate: now,
        endDate: end,
        updatedAt: now,
      });
    }

    await ctx.db.patch("payments", payment._id, {
      status: "SUCCESS",
      activatedAt: now,
      updatedAt: now,
    });

    return null;
  },
});
