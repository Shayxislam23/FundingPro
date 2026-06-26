import { v } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export function mapPayment(payment: Doc<"payments">, userClerkId: string) {
  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  return {
    id: payment._id,
    userId: userClerkId,
    subscriptionId: payment.subscriptionId ?? null,
    amountUsd: payment.amountUsd,
    amountTiyin: Number(meta.amountTiyin ?? 0),
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    providerRefId: payment.providerRefId ?? null,
    idempotencyKey: payment.idempotencyKey,
    serviceType: payment.serviceType,
    metadata: meta,
  };
}

export async function resolvePlanId(ctx: { db: QueryCtx["db"] }, planId: string) {
  const bySlug = await ctx.db
    .query("plans")
    .withIndex("by_slug", (q) => q.eq("slug", planId))
    .unique();
  if (bySlug) return bySlug._id;
  return planId as Id<"plans">;
}

export const paymentRecordValidator = v.union(
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
);

export const uzumTransactionValidator = v.union(
  v.object({
    transId: v.string(),
    paymentId: v.string(),
    serviceId: v.string(),
    state: v.string(),
    amountTiyin: v.number(),
    createTime: v.union(v.string(), v.null()),
    confirmTime: v.union(v.string(), v.null()),
    reverseTime: v.union(v.string(), v.null()),
  }),
  v.null()
);
