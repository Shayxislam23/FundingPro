import { v, type Infer } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  paymentRecordValidator,
  uzumTransactionValidator,
} from "./lib/paymentHelpers";

type PaymentRecord = Infer<typeof paymentRecordValidator>;
type UzumTransaction = Infer<typeof uzumTransactionValidator>;

function assertSystemSecret(systemSecret: string) {
  const expected = process.env.CONVEX_SYSTEM_SECRET;
  if (!expected || systemSecret !== expected) {
    throw new Error("Unauthorized system access");
  }
}

export const getById = action({
  args: {
    systemSecret: v.string(),
    paymentId: v.string(),
  },
  returns: paymentRecordValidator,
  handler: async (ctx, args): Promise<PaymentRecord> => {
    assertSystemSecret(args.systemSecret);
    return await ctx.runQuery(internal.paymentsInternal.getById, {
      paymentId: args.paymentId,
    });
  },
});

export const insertEvent = action({
  args: {
    systemSecret: v.string(),
    paymentId: v.string(),
    eventType: v.string(),
    payload: v.any(),
    source: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertSystemSecret(args.systemSecret);
    await ctx.runMutation(internal.paymentsInternal.insertEvent, {
      paymentId: args.paymentId,
      eventType: args.eventType,
      payload: args.payload,
      source: args.source,
    });
    return null;
  },
});

export const getUzumTransaction = action({
  args: {
    systemSecret: v.string(),
    transId: v.string(),
  },
  returns: uzumTransactionValidator,
  handler: async (ctx, args): Promise<UzumTransaction> => {
    assertSystemSecret(args.systemSecret);
    return await ctx.runQuery(internal.paymentsInternal.getUzumTransaction, {
      transId: args.transId,
    });
  },
});

export const upsertUzumTransaction = action({
  args: {
    systemSecret: v.string(),
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
    assertSystemSecret(args.systemSecret);
    const { systemSecret: _, ...payload } = args;
    await ctx.runMutation(internal.paymentsInternal.upsertUzumTransaction, payload);
    return null;
  },
});

export const updateProviderRef = action({
  args: {
    systemSecret: v.string(),
    paymentId: v.string(),
    providerRefId: v.string(),
    extraMetadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertSystemSecret(args.systemSecret);
    const { systemSecret: _, ...payload } = args;
    await ctx.runMutation(internal.paymentsInternal.updateProviderRef, payload);
    return null;
  },
});

export const setStatus = action({
  args: {
    systemSecret: v.string(),
    paymentId: v.string(),
    status: v.string(),
    activatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertSystemSecret(args.systemSecret);
    const { systemSecret: _, ...payload } = args;
    await ctx.runMutation(internal.paymentsInternal.setStatus, payload);
    return null;
  },
});

export const activateSubscription = action({
  args: {
    systemSecret: v.string(),
    paymentId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertSystemSecret(args.systemSecret);
    await ctx.runMutation(internal.paymentsInternal.activateSubscription, {
      paymentId: args.paymentId,
    });
    return null;
  },
});

export const reverseSubscription = action({
  args: {
    systemSecret: v.string(),
    paymentId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertSystemSecret(args.systemSecret);
    await ctx.runMutation(internal.paymentsInternal.reverseSubscription, {
      paymentId: args.paymentId,
    });
    return null;
  },
});
