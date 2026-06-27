import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  mapPayment,
  paymentRecordValidator,
  uzumTransactionValidator,
} from "./lib/paymentHelpers";

function readTransId(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "transId" in payload) {
    const transId = (payload as { transId?: unknown }).transId;
    if (typeof transId === "string" && transId.length > 0) {
      return transId;
    }
  }
  return null;
}

async function hasDuplicatePaymentEvent(
  ctx: MutationCtx,
  paymentId: Id<"payments">,
  eventType: string,
  payload: unknown,
  source: string
): Promise<boolean> {
  const events = await ctx.db
    .query("paymentEvents")
    .withIndex("by_payment_event", (q) =>
      q.eq("paymentId", paymentId).eq("eventType", eventType)
    )
    .collect();

  const transId = readTransId(payload);
  return events.some((event) => {
    if (transId) {
      return readTransId(event.payload) === transId;
    }
    return event.source === source;
  });
}

export const getById = internalQuery({
  args: { paymentId: v.string() },
  returns: paymentRecordValidator,
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment) return null;
    const user = await ctx.db.get("users", payment.userId);
    return mapPayment(payment, user?.clerkId ?? payment.userId);
  },
});

export const insertEvent = internalMutation({
  args: {
    paymentId: v.string(),
    eventType: v.string(),
    payload: v.any(),
    source: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const paymentId = args.paymentId as Id<"payments">;
    const source = args.source ?? "uzum_webhook";
    if (await hasDuplicatePaymentEvent(ctx, paymentId, args.eventType, args.payload, source)) {
      return null;
    }

    await ctx.db.insert("paymentEvents", {
      paymentId,
      eventType: args.eventType,
      payload: args.payload,
      source,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const getUzumTransaction = internalQuery({
  args: { transId: v.string() },
  returns: uzumTransactionValidator,
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("uzumTransactions")
      .withIndex("by_transId", (q) => q.eq("transId", args.transId))
      .unique();
    if (!row) return null;
    return {
      transId: row.transId,
      paymentId: row.paymentId,
      serviceId: row.serviceId,
      state: row.state,
      amountTiyin: row.amountTiyin,
      createTime: row.createTime ? new Date(row.createTime).toISOString() : null,
      confirmTime: row.confirmTime ? new Date(row.confirmTime).toISOString() : null,
      reverseTime: row.reverseTime ? new Date(row.reverseTime).toISOString() : null,
    };
  },
});

export const upsertUzumTransaction = internalMutation({
  args: {
    transId: v.string(),
    paymentId: v.string(),
    serviceId: v.string(),
    state: v.string(),
    amountTiyin: v.number(),
    createTime: v.optional(v.string()),
    confirmTime: v.optional(v.string()),
    reverseTime: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("uzumTransactions")
      .withIndex("by_transId", (q) => q.eq("transId", args.transId))
      .unique();
    const now = Date.now();
    const data = {
      transId: args.transId,
      paymentId: args.paymentId as Id<"payments">,
      serviceId: args.serviceId,
      state: args.state,
      amountTiyin: args.amountTiyin,
      createTime: args.createTime ? new Date(args.createTime).getTime() : undefined,
      confirmTime: args.confirmTime ? new Date(args.confirmTime).getTime() : undefined,
      reverseTime: args.reverseTime ? new Date(args.reverseTime).getTime() : undefined,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch("uzumTransactions", existing._id, data);
    } else {
      await ctx.db.insert("uzumTransactions", { ...data, createdAt: now });
    }
    return null;
  },
});

export const updateProviderRef = internalMutation({
  args: {
    paymentId: v.string(),
    providerRefId: v.string(),
    extraMetadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment) return null;
    const metadata = {
      ...((payment.metadata ?? {}) as Record<string, unknown>),
      ...(args.extraMetadata ?? {}),
    };
    await ctx.db.patch("payments", payment._id, {
      providerRefId: args.providerRefId,
      metadata,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setStatus = internalMutation({
  args: {
    paymentId: v.string(),
    status: v.string(),
    activatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("payments", args.paymentId as Id<"payments">, {
      status: args.status,
      activatedAt: args.activatedAt,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const activateSubscription = internalMutation({
  args: { paymentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment?.subscriptionId) return null;
    if (payment.status === "SUCCESS") return null;

    const now = Date.now();
    await ctx.db.patch("subscriptions", payment.subscriptionId, {
      status: "ACTIVE",
      startDate: now,
      updatedAt: now,
    });
    await ctx.db.patch("payments", payment._id, {
      status: "SUCCESS",
      activatedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const reverseSubscription = internalMutation({
  args: { paymentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment?.subscriptionId) return null;
    if (payment.status === "REFUNDED") return null;

    const now = Date.now();
    await ctx.db.patch("subscriptions", payment.subscriptionId, {
      status: "CANCELLED",
      cancelledAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("payments", payment._id, {
      status: "REFUNDED",
      updatedAt: now,
    });
    return null;
  },
});
