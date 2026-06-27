import { v } from "convex/values";
import { query } from "./_generated/server";
import { authedMutation, authedQuery, adminMutation, adminQuery } from "./lib/customFunctions";
import type { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    specialty: v.optional(v.string()),
    country: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  returns: v.object({
    consultants: v.array(
      v.object({
        id: v.string(),
        bio: v.union(v.string(), v.null()),
        specialties: v.array(v.string()),
        country: v.union(v.string(), v.null()),
        rating: v.number(),
        reviewCount: v.number(),
        isVerified: v.boolean(),
        organizationName: v.string(),
      })
    ),
    total: v.number(),
    page: v.number(),
    limit: v.number(),
    pages: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit, 1), 50);
    const pageNumber = Math.max(args.page, 1);
    const offset = (pageNumber - 1) * limit;
    const scanLimit = Math.max(offset + limit, 500);

    let profiles = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(scanLimit);

    if (args.specialty) {
      profiles = profiles.filter((p) => p.specialties.includes(args.specialty!));
    }
    if (args.country) {
      profiles = profiles.filter((p) => p.country === args.country);
    }

    const total = profiles.length;
    const page = profiles.slice(offset, offset + limit);
    const result = [];
    for (const p of page) {
      const org = await ctx.db.get("organizations", p.organizationId);
      result.push({
        id: p._id,
        bio: p.bio ?? null,
        specialties: p.specialties,
        country: p.country ?? null,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isVerified: p.isVerified,
        organizationName: org?.name ?? "",
      });
    }

    return {
      consultants: result,
      total,
      page: pageNumber,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  },
});

export const createOrder = authedMutation({
  args: {
    consultantId: v.string(),
    packageName: v.string(),
    amountUsd: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    orderId: v.string(),
    status: v.string(),
    payment: v.object({ paymentId: v.string(), amountUsd: v.number() }),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderId = await ctx.db.insert("consultantOrders", {
      clientUserId: ctx.user._id,
      consultantId: args.consultantId as Id<"consultantProfiles">,
      packageName: args.packageName,
      amountUsd: args.amountUsd,
      status: "PENDING",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
    const paymentId = await ctx.db.insert("payments", {
      userId: ctx.user._id,
      amountUsd: args.amountUsd,
      currency: "USD",
      status: "PENDING",
      provider: "uzum",
      idempotencyKey: `consultant-${orderId}`,
      serviceType: "consultant_order",
      metadata: { orderId: String(orderId), packageName: args.packageName },
      createdAt: now,
      updatedAt: now,
    });
    return {
      orderId,
      status: "PENDING",
      payment: { paymentId, amountUsd: args.amountUsd },
    };
  },
});

export const listUserOrders = authedQuery({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      packageName: v.string(),
      amountUsd: v.number(),
      status: v.string(),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("consultantOrders")
      .withIndex("by_client", (q) => q.eq("clientUserId", ctx.user._id))
      .collect();
    return orders.map((o) => ({
      id: o._id,
      packageName: o.packageName,
      amountUsd: o.amountUsd,
      status: o.status,
      createdAt: new Date(o.createdAt).toISOString(),
    }));
  },
});

export const listAdminOrders = adminQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      packageName: v.string(),
      status: v.string(),
      amountUsd: v.number(),
      clientUserId: v.string(),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const orders = await ctx.db
      .query("consultantOrders")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    const result = [];
    for (const o of orders) {
      const user = await ctx.db.get("users", o.clientUserId);
      result.push({
        id: o._id,
        packageName: o.packageName,
        status: o.status,
        amountUsd: o.amountUsd,
        clientUserId: user?.clerkId ?? o.clientUserId,
        createdAt: new Date(o.createdAt).toISOString(),
      });
    }
    return result;
  },
});

export const updateOrderStatus = adminMutation({
  args: { orderId: v.string(), status: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("consultantOrders", args.orderId as Id<"consultantOrders">, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});
