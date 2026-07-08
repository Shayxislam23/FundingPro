import { v } from "convex/values";
import { authedMutation, authedQuery, adminQuery } from "./lib/customFunctions";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mapPayment, paymentRecordValidator, resolvePlanId } from "./lib/paymentHelpers";

const reconciliationSeverityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium")
);

const reconciliationIssueValidator = v.object({
  paymentId: v.string(),
  provider: v.string(),
  severity: reconciliationSeverityValidator,
  code: v.string(),
  message: v.string(),
  paymentStatus: v.string(),
  providerState: v.union(v.string(), v.null()),
  expectedAmountTiyin: v.union(v.number(), v.null()),
  providerAmountTiyin: v.union(v.number(), v.null()),
});

type ProviderSnapshot = {
  state: string;
  amountTiyin: number;
};

type ReconciliationIssue = {
  paymentId: string;
  provider: string;
  severity: "critical" | "high" | "medium";
  code: string;
  message: string;
  paymentStatus: string;
  providerState: string | null;
  expectedAmountTiyin: number | null;
  providerAmountTiyin: number | null;
};

function expectedAmountTiyin(payment: Doc<"payments">): number | null {
  const amount = Number(payment.metadata?.amountTiyin ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function isProviderPaid(provider: string, state: string): boolean {
  if (provider === "payme") return state === "2";
  if (provider === "uzum") return state === "CONFIRMED";
  if (provider === "click") return state === "COMPLETED";
  return false;
}

function isProviderRefunded(provider: string, state: string): boolean {
  if (provider === "payme") return state === "-2";
  if (provider === "uzum") return state === "REVERSED";
  return false;
}

async function getProviderSnapshot(
  ctx: { db: QueryCtx["db"] },
  payment: Doc<"payments">
): Promise<ProviderSnapshot | null> {
  if (payment.provider === "payme") {
    const tx = await ctx.db
      .query("paymeTransactions")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", payment._id))
      .order("desc")
      .first();
    return tx ? { state: String(tx.state), amountTiyin: tx.amountTiyin } : null;
  }

  if (payment.provider === "uzum") {
    const tx = await ctx.db
      .query("uzumTransactions")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", payment._id))
      .order("desc")
      .first();
    return tx ? { state: tx.state, amountTiyin: tx.amountTiyin } : null;
  }

  if (payment.provider === "click") {
    const tx = await ctx.db
      .query("clickTransactions")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", payment._id))
      .order("desc")
      .first();
    return tx ? { state: tx.state, amountTiyin: tx.amountTiyin } : null;
  }

  return null;
}

function buildReconciliationIssue(
  payment: Doc<"payments">,
  snapshot: ProviderSnapshot | null
): ReconciliationIssue | null {
  const expected = expectedAmountTiyin(payment);
  const base = {
    paymentId: payment._id,
    provider: payment.provider,
    paymentStatus: payment.status,
    providerState: snapshot?.state ?? null,
    expectedAmountTiyin: expected,
    providerAmountTiyin: snapshot?.amountTiyin ?? null,
  };

  if (snapshot && expected !== null && snapshot.amountTiyin !== expected) {
    return {
      ...base,
      severity: "critical",
      code: "amount_mismatch",
      message: "Provider transaction amount differs from local payment amount.",
    };
  }

  if (snapshot && isProviderPaid(payment.provider, snapshot.state) && payment.status !== "SUCCESS") {
    return {
      ...base,
      severity: "critical",
      code: "provider_paid_local_not_success",
      message: "Provider shows paid, but local payment is not SUCCESS.",
    };
  }

  if (snapshot && isProviderRefunded(payment.provider, snapshot.state) && payment.status !== "REFUNDED") {
    return {
      ...base,
      severity: "critical",
      code: "provider_refunded_local_not_refunded",
      message: "Provider shows refunded/reversed, but local payment is not REFUNDED.",
    };
  }

  if (payment.status === "SUCCESS" && !snapshot) {
    return {
      ...base,
      severity: "high",
      code: "local_success_missing_provider_transaction",
      message: "Local payment is SUCCESS, but provider transaction is missing.",
    };
  }

  if (payment.status === "SUCCESS" && snapshot && !isProviderPaid(payment.provider, snapshot.state)) {
    return {
      ...base,
      severity: "high",
      code: "local_success_provider_not_paid",
      message: "Local payment is SUCCESS, but provider state is not paid.",
    };
  }

  const hasProviderStart =
    Boolean(payment.providerRefId) ||
    Boolean(payment.metadata?.checkoutOrderId) ||
    Boolean(payment.metadata?.orderId);
  if (payment.status === "PENDING" && hasProviderStart && !snapshot) {
    return {
      ...base,
      severity: "medium",
      code: "pending_missing_provider_transaction",
      message: "Payment has provider reference metadata, but no provider transaction row.",
    };
  }

  return null;
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
  returns: paymentRecordValidator,
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
    reconciliation: v.object({
      checkedPayments: v.number(),
      openIssues: v.number(),
      criticalIssues: v.number(),
      highIssues: v.number(),
      mediumIssues: v.number(),
      amountMismatches: v.number(),
      missingProviderTransactions: v.number(),
      issues: v.array(reconciliationIssueValidator),
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
    const reconciliationIssues = (
      await Promise.all(
        payments.map(async (payment) => {
          const snapshot = await getProviderSnapshot(ctx, payment);
          return buildReconciliationIssue(payment, snapshot);
        })
      )
    ).filter((issue): issue is ReconciliationIssue => issue !== null);

    const paymentRows = await Promise.all(
      payments.slice(0, 50).map(async (p) => {
        const user = await ctx.db.get("users", p.userId);
        const meta = (p.metadata ?? {}) as Record<string, string>;
        const platformShareUsd =
          Number.isFinite(Number(meta.platformShareUsd))
            ? Number(meta.platformShareUsd)
            : null;
        return {
          id: p._id,
          userEmail: user?.email ?? null,
          planName: meta.planName ?? null,
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
      reconciliation: {
        checkedPayments: payments.length,
        openIssues: reconciliationIssues.length,
        criticalIssues: reconciliationIssues.filter((issue) => issue.severity === "critical").length,
        highIssues: reconciliationIssues.filter((issue) => issue.severity === "high").length,
        mediumIssues: reconciliationIssues.filter((issue) => issue.severity === "medium").length,
        amountMismatches: reconciliationIssues.filter((issue) => issue.code === "amount_mismatch").length,
        missingProviderTransactions: reconciliationIssues.filter((issue) =>
          issue.code.includes("missing_provider_transaction")
        ).length,
        issues: reconciliationIssues.slice(0, 50),
      },
      payments: paymentRows,
      subscriptionRequests: subscriptionRequestRows,
    };
  },
});
