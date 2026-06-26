import { v } from "convex/values";
import { type QueryCtx } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import type { Id } from "./_generated/dataModel";

async function resolvePlanId(ctx: QueryCtx, planId: string): Promise<Id<"plans">> {
  const bySlug = await ctx.db
    .query("plans")
    .withIndex("by_slug", (q) => q.eq("slug", planId))
    .unique();
  if (bySlug) return bySlug._id;
  return planId as Id<"plans">;
}

export const create = authedMutation({
  args: {
    planId: v.string(),
    planName: v.string(),
    amountUsd: v.number(),
    amountUzs: v.number(),
    amountTiyin: v.number(),
  },
  returns: v.object({
    subscriptionRequestId: v.string(),
    paymentId: v.string(),
    status: v.string(),
    payment: v.object({ paymentId: v.string(), amountUsd: v.number() }),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const planConvexId = await resolvePlanId(ctx, args.planId);

    const paymentId = await ctx.db.insert("payments", {
      userId: ctx.user._id,
      amountUsd: args.amountUsd,
      currency: "UZS",
      status: "PENDING",
      provider: "uzum",
      idempotencyKey: `sub-req-${ctx.user._id}-${args.planId}-${now}`,
      serviceType: "subscription",
      metadata: {
        planId: args.planId,
        planName: args.planName,
        amountUzs: args.amountUzs,
        amountTiyin: args.amountTiyin,
      },
      createdAt: now,
      updatedAt: now,
    });

    const subscriptionRequestId = await ctx.db.insert("subscriptionRequests", {
      userId: ctx.user._id,
      planId: planConvexId,
      status: "PENDING",
      paymentId,
      createdAt: now,
      updatedAt: now,
    });

    return {
      subscriptionRequestId,
      paymentId,
      status: "PENDING",
      payment: { paymentId, amountUsd: args.amountUsd },
    };
  },
});

export const listPendingPlanIds = authedQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("subscriptionRequests")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    const pending = requests.filter((r) => r.status === "PENDING");
    const planIds: string[] = [];
    for (const req of pending) {
      const plan = await ctx.db.get("plans", req.planId);
      planIds.push(plan?.slug ?? req.planId);
    }
    return planIds;
  },
});
