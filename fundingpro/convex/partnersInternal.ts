import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { resolvePlanId } from "./lib/paymentHelpers";

const SESSION_TTL_MS = 30 * 60 * 1000;
const LAUNCH_CODE_TTL_MS = 2 * 60 * 1000;
const NONCE_TTL_MS = 10 * 60 * 1000;

const partnerSessionValidator = v.object({
  sessionId: v.string(),
  channelSlug: v.string(),
  externalUserId: v.string(),
  status: v.union(v.literal("pending"), v.literal("active"), v.literal("expired")),
  userId: v.union(v.string(), v.null()),
  expiresAt: v.number(),
});

export const getSessionByTokenHash = internalQuery({
  args: { sessionTokenHash: v.string() },
  returns: v.union(partnerSessionValidator, v.null()),
  handler: async (ctx, args) => {
    let row = await ctx.db
      .query("partnerSessions")
      .withIndex("by_token_hash", (q) => q.eq("sessionTokenHash", args.sessionTokenHash))
      .unique();
    if (!row) {
      row = await ctx.db
        .query("partnerSessions")
        .withIndex("by_client_token_hash", (q) =>
          q.eq("clientSessionTokenHash", args.sessionTokenHash)
        )
        .unique();
    }
    if (!row) return null;
    const now = Date.now();
    const status = row.expiresAt <= now ? ("expired" as const) : row.status;
    return {
      sessionId: row._id,
      channelSlug: row.channelSlug,
      externalUserId: row.externalUserId,
      status,
      userId: row.userId ? String(row.userId) : null,
      expiresAt: row.expiresAt,
    };
  },
});

export const getSessionById = internalQuery({
  args: { sessionId: v.string() },
  returns: v.union(partnerSessionValidator, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db.get("partnerSessions", args.sessionId as Id<"partnerSessions">);
    if (!row) return null;
    const now = Date.now();
    const status = row.expiresAt <= now ? ("expired" as const) : row.status;
    return {
      sessionId: row._id,
      channelSlug: row.channelSlug,
      externalUserId: row.externalUserId,
      status,
      userId: row.userId ? String(row.userId) : null,
      expiresAt: row.expiresAt,
    };
  },
});

/**
 * Create a new partner session. Refuses to rotate tokens on an already-open
 * session for the same bank user (blocks signed-init replay from stealing a fresh token).
 */
export const createSession = internalMutation({
  args: {
    channelSlug: v.string(),
    externalUserId: v.string(),
    sessionTokenHash: v.string(),
    launchCodeHash: v.string(),
    locale: v.optional(v.union(v.literal("ru"), v.literal("uz"))),
    displayName: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.string(),
    expiresAt: v.number(),
    launchCodeExpiresAt: v.number(),
    reused: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;
    const launchCodeExpiresAt = now + LAUNCH_CODE_TTL_MS;

    const existing = await ctx.db
      .query("partnerSessions")
      .withIndex("by_channel_external", (q) =>
        q.eq("channelSlug", args.channelSlug).eq("externalUserId", args.externalUserId)
      )
      .order("desc")
      .first();

    if (existing && existing.status !== "expired" && existing.expiresAt > now) {
      // Do not overwrite sessionTokenHash — that would hand a replayer a new bearer.
      // Refresh launch code + session TTL so re-init near expiry still works.
      await ctx.db.patch("partnerSessions", existing._id, {
        launchCodeHash: args.launchCodeHash,
        launchCodeExpiresAt,
        expiresAt,
        locale: args.locale ?? existing.locale,
        displayName: args.displayName ?? existing.displayName,
        updatedAt: now,
      });
      return {
        sessionId: existing._id,
        expiresAt,
        launchCodeExpiresAt,
        reused: true,
      };
    }

    const sessionId = await ctx.db.insert("partnerSessions", {
      channelSlug: args.channelSlug,
      externalUserId: args.externalUserId,
      sessionTokenHash: args.sessionTokenHash,
      launchCodeHash: args.launchCodeHash,
      launchCodeExpiresAt,
      status: "pending",
      locale: args.locale,
      displayName: args.displayName,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return { sessionId, expiresAt, launchCodeExpiresAt, reused: false };
  },
});

/** Exchange one-time launch code → set WebView client token (bank sessionTokenHash untouched). */
export const exchangeLaunchCode = internalMutation({
  args: {
    launchCodeHash: v.string(),
    clientSessionTokenHash: v.string(),
  },
  returns: v.union(
    v.object({
      sessionId: v.string(),
      channelSlug: v.string(),
      status: v.union(v.literal("pending"), v.literal("active"), v.literal("expired")),
      expiresAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("partnerSessions")
      .withIndex("by_launch_code_hash", (q) => q.eq("launchCodeHash", args.launchCodeHash))
      .unique();
    if (!row) return null;

    const now = Date.now();
    if (row.expiresAt <= now) {
      await ctx.db.patch("partnerSessions", row._id, {
        status: "expired",
        launchCodeHash: undefined,
        launchCodeExpiresAt: undefined,
        updatedAt: now,
      });
      return null;
    }
    if (!row.launchCodeExpiresAt || row.launchCodeExpiresAt <= now) {
      await ctx.db.patch("partnerSessions", row._id, {
        launchCodeHash: undefined,
        launchCodeExpiresAt: undefined,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.patch("partnerSessions", row._id, {
      clientSessionTokenHash: args.clientSessionTokenHash,
      launchCodeHash: undefined,
      launchCodeExpiresAt: undefined,
      status: "active",
      updatedAt: now,
    });

    return {
      sessionId: row._id,
      channelSlug: row.channelSlug,
      status: "active" as const,
      expiresAt: row.expiresAt,
    };
  },
});

/** Persist a partner request nonce; returns false if already used. Serialized per channel via lock. */
export const consumeRequestNonce = internalMutation({
  args: {
    channelSlug: v.string(),
    nonceHash: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const now = Date.now();

    let lock = await ctx.db
      .query("partnerNonceLocks")
      .withIndex("by_channel", (q) => q.eq("channelSlug", args.channelSlug))
      .unique();
    if (!lock) {
      const lockId = await ctx.db.insert("partnerNonceLocks", {
        channelSlug: args.channelSlug,
        updatedAt: now,
      });
      lock = await ctx.db.get("partnerNonceLocks", lockId);
    } else {
      // OCC conflict point — concurrent nonce checks for the same channel serialize.
      await ctx.db.patch("partnerNonceLocks", lock._id, { updatedAt: now });
    }

    const existing = await ctx.db
      .query("partnerRequestNonces")
      .withIndex("by_channel_nonce", (q) =>
        q.eq("channelSlug", args.channelSlug).eq("nonceHash", args.nonceHash)
      )
      .unique();
    if (existing && existing.expiresAt > now) {
      return false;
    }
    if (existing) {
      await ctx.db.patch("partnerRequestNonces", existing._id, {
        expiresAt: now + NONCE_TTL_MS,
        createdAt: now,
      });
      return true;
    }
    await ctx.db.insert("partnerRequestNonces", {
      channelSlug: args.channelSlug,
      nonceHash: args.nonceHash,
      expiresAt: now + NONCE_TTL_MS,
      createdAt: now,
    });
    return true;
  },
});

export const activateSession = internalMutation({
  args: {
    sessionTokenHash: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    userId: v.optional(v.string()),
    rotatedSessionTokenHash: v.optional(v.string()),
  },
  returns: v.union(partnerSessionValidator, v.null()),
  handler: async (ctx, args) => {
    type MatchKind = "bank" | "client" | "id";
    let matched: MatchKind = "id";
    let row =
      (args.sessionTokenHash
        ? await ctx.db
            .query("partnerSessions")
            .withIndex("by_token_hash", (q) => q.eq("sessionTokenHash", args.sessionTokenHash!))
            .unique()
        : null) ?? null;

    if (args.sessionTokenHash && row) {
      matched = "bank";
    } else if (args.sessionTokenHash) {
      row = await ctx.db
        .query("partnerSessions")
        .withIndex("by_client_token_hash", (q) =>
          q.eq("clientSessionTokenHash", args.sessionTokenHash!)
        )
        .unique();
      if (row) matched = "client";
    } else if (args.sessionId) {
      row = await ctx.db.get("partnerSessions", args.sessionId as Id<"partnerSessions">);
      matched = "id";
    }

    if (!row) return null;

    const now = Date.now();
    if (row.expiresAt <= now) {
      await ctx.db.patch("partnerSessions", row._id, {
        status: "expired",
        updatedAt: now,
      });
      return {
        sessionId: row._id,
        channelSlug: row.channelSlug,
        externalUserId: row.externalUserId,
        status: "expired" as const,
        userId: row.userId ? String(row.userId) : null,
        expiresAt: row.expiresAt,
      };
    }

    // Do not rebind a session that already belongs to another user.
    if (
      args.userId &&
      row.userId &&
      String(row.userId) !== args.userId
    ) {
      return null;
    }

    const patch: {
      status: "active";
      updatedAt: number;
      userId?: Id<"users">;
      sessionTokenHash?: string;
      clientSessionTokenHash?: string;
    } = {
      status: "active",
      updatedAt: now,
    };

    if (args.userId && !row.userId) {
      patch.userId = args.userId as Id<"users">;
      if (args.rotatedSessionTokenHash) {
        // Rotate the bearer that was presented — never overwrite the other side's token.
        if (matched === "client") {
          patch.clientSessionTokenHash = args.rotatedSessionTokenHash;
        } else if (matched === "bank") {
          patch.sessionTokenHash = args.rotatedSessionTokenHash;
        }
      }
    }

    await ctx.db.patch("partnerSessions", row._id, patch);

    const effectiveUserId =
      row.userId ? String(row.userId) : args.userId ? args.userId : null;

    return {
      sessionId: row._id,
      channelSlug: row.channelSlug,
      externalUserId: row.externalUserId,
      status: "active" as const,
      userId: effectiveUserId,
      expiresAt: row.expiresAt,
    };
  },
});

export const getMonthlyCompletedCount = internalQuery({
  args: {
    channelSlug: v.string(),
    yearMonth: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("partnerMonthlyStats")
      .withIndex("by_channel_month", (q) =>
        q.eq("channelSlug", args.channelSlug).eq("yearMonth", args.yearMonth)
      )
      .unique();
    return row?.completedTransactions ?? 0;
  },
});

export const incrementMonthlyCompleted = internalMutation({
  args: {
    channelSlug: v.string(),
    yearMonth: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const row = await ctx.db
      .query("partnerMonthlyStats")
      .withIndex("by_channel_month", (q) =>
        q.eq("channelSlug", args.channelSlug).eq("yearMonth", args.yearMonth)
      )
      .unique();

    if (row) {
      const completedTransactions = row.completedTransactions + 1;
      await ctx.db.patch("partnerMonthlyStats", row._id, {
        completedTransactions,
        updatedAt: now,
      });
      return completedTransactions;
    }

    await ctx.db.insert("partnerMonthlyStats", {
      channelSlug: args.channelSlug,
      yearMonth: args.yearMonth,
      completedTransactions: 1,
      createdAt: now,
      updatedAt: now,
    });
    return 1;
  },
});

export const createPartnerPayment = internalMutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    planName: v.string(),
    amountUsd: v.number(),
    amountUzs: v.number(),
    amountTiyin: v.number(),
    serviceType: v.string(),
    idempotencyKey: v.string(),
    channelSlug: v.string(),
    partnerSharePercent: v.number(),
    fundingProSharePercent: v.number(),
    externalUserId: v.optional(v.string()),
  },
  returns: v.object({
    paymentId: v.string(),
    subscriptionId: v.union(v.string(), v.null()),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .unique();
    if (existing) {
      return {
        paymentId: existing._id,
        subscriptionId: existing.subscriptionId ? String(existing.subscriptionId) : null,
        status: existing.status,
      };
    }

    const userId = args.userId as Id<"users">;
    const now = Date.now();
    let subscriptionId: Id<"subscriptions"> | undefined;

    if (args.serviceType === "subscription") {
      const planConvexId = await resolvePlanId(ctx, args.planId);
      subscriptionId = await ctx.db.insert("subscriptions", {
        userId,
        planId: planConvexId,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      });
    }

    const paymentId = await ctx.db.insert("payments", {
      userId,
      subscriptionId,
      amountUsd: args.amountUsd,
      currency: "UZS",
      status: "PENDING",
      provider: "zoomrad",
      idempotencyKey: args.idempotencyKey,
      serviceType: args.serviceType,
      metadata: {
        planId: args.planId,
        planName: args.planName,
        amountUzs: args.amountUzs,
        amountTiyin: args.amountTiyin,
        partnerChannel: args.channelSlug,
        partnerSharePercent: args.partnerSharePercent,
        fundingProSharePercent: args.fundingProSharePercent,
        partnerExternalUserId: args.externalUserId,
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      paymentId,
      subscriptionId: subscriptionId ? String(subscriptionId) : null,
      status: "PENDING",
    };
  },
});

export const processPartnerWebhook = internalMutation({
  args: {
    paymentId: v.string(),
    externalTransactionId: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    amountTiyin: v.number(),
    idempotencyKey: v.string(),
    channelSlug: v.string(),
  },
  returns: v.object({
    paymentId: v.string(),
    status: v.string(),
    duplicate: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const payment = await ctx.db.get("payments", args.paymentId as Id<"payments">);
    if (!payment) {
      return { paymentId: args.paymentId, status: "NOT_FOUND", duplicate: false };
    }

    if (payment.provider !== "zoomrad") {
      return { paymentId: payment._id, status: "PROVIDER_MISMATCH", duplicate: false };
    }

    const meta = (payment.metadata ?? {}) as {
      amountTiyin?: number;
      partnerChannel?: string;
    };
    if (meta.partnerChannel && meta.partnerChannel !== args.channelSlug) {
      return { paymentId: payment._id, status: "CHANNEL_MISMATCH", duplicate: false };
    }

    const expectedAmount =
      typeof meta.amountTiyin === "number" && Number.isFinite(meta.amountTiyin)
        ? meta.amountTiyin
        : null;
    if (expectedAmount !== null && expectedAmount !== args.amountTiyin) {
      return { paymentId: payment._id, status: "AMOUNT_MISMATCH", duplicate: false };
    }

    const duplicateEvents = await ctx.db
      .query("paymentEvents")
      .withIndex("by_payment_event", (q) =>
        q.eq("paymentId", payment._id).eq("eventType", `zoomrad_${args.status}`)
      )
      .take(20);

    const isDuplicate = duplicateEvents.some((event) => {
      const payload = event.payload as {
        transId?: string;
        externalTransactionId?: string;
        idempotencyKey?: string;
      };
      return (
        payload.transId === args.externalTransactionId ||
        payload.externalTransactionId === args.externalTransactionId ||
        payload.idempotencyKey === args.idempotencyKey
      );
    });

    if (isDuplicate) {
      return { paymentId: payment._id, status: payment.status, duplicate: true };
    }

    const now = Date.now();
    await ctx.db.insert("paymentEvents", {
      paymentId: payment._id,
      eventType: `zoomrad_${args.status}`,
      payload: {
        transId: args.externalTransactionId,
        amount: args.amountTiyin,
        state: args.status,
        idempotencyKey: args.idempotencyKey,
      },
      source: `${args.channelSlug}_webhook`,
      createdAt: now,
    });

    if (args.status === "success" && payment.status !== "SUCCESS") {
      if (payment.subscriptionId) {
        const subscription = await ctx.db.get("subscriptions", payment.subscriptionId);
        const plan = subscription ? await ctx.db.get("plans", subscription.planId) : null;
        const DAY_MS = 24 * 60 * 60 * 1000;
        const billingPeriodMs = plan?.billingPeriod === "yearly" ? 365 * DAY_MS : 30 * DAY_MS;
        const extendFrom = Math.max(now, subscription?.endDate ?? 0);
        if (subscription) {
          await ctx.db.patch("subscriptions", subscription._id, {
            status: "ACTIVE",
            startDate: subscription.startDate ?? now,
            endDate: extendFrom + billingPeriodMs,
            updatedAt: now,
          });
        }
      }

      await ctx.db.patch("payments", payment._id, {
        status: "SUCCESS",
        providerRefId: args.externalTransactionId,
        activatedAt: now,
        updatedAt: now,
      });

      const yearMonth = new Date(now).toISOString().slice(0, 7);
      const statsRow = await ctx.db
        .query("partnerMonthlyStats")
        .withIndex("by_channel_month", (q) =>
          q.eq("channelSlug", args.channelSlug).eq("yearMonth", yearMonth)
        )
        .unique();
      if (statsRow) {
        await ctx.db.patch("partnerMonthlyStats", statsRow._id, {
          completedTransactions: statsRow.completedTransactions + 1,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("partnerMonthlyStats", {
          channelSlug: args.channelSlug,
          yearMonth,
          completedTransactions: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      return { paymentId: payment._id, status: "SUCCESS", duplicate: false };
    }

    if (args.status === "failed" && payment.status === "PENDING") {
      await ctx.db.patch("payments", payment._id, {
        status: "FAILED",
        updatedAt: now,
      });
      return { paymentId: payment._id, status: "FAILED", duplicate: false };
    }

    return { paymentId: payment._id, status: payment.status, duplicate: false };
  },
});
