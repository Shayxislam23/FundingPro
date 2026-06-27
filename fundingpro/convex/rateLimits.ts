import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const rateLimitSnapshot = v.object({
  limit: v.number(),
  remaining: v.number(),
  resetAt: v.number(),
});

const rateLimitResult = rateLimitSnapshot.extend({
  allowed: v.boolean(),
  count: v.number(),
});

export const checkRateLimit = internalMutation({
  args: {
    key: v.string(),
    maxRequests: v.number(),
    windowMs: v.number(),
  },
  returns: rateLimitResult,
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing || now > existing.resetAt) {
      const resetAt = now + args.windowMs;
      if (existing) {
        await ctx.db.patch("rateLimitBuckets", existing._id, { count: 1, resetAt });
      } else {
        await ctx.db.insert("rateLimitBuckets", {
          key: args.key,
          count: 1,
          resetAt,
        });
      }
      return {
        allowed: true,
        limit: args.maxRequests,
        remaining: Math.max(0, args.maxRequests - 1),
        resetAt,
        count: 1,
      };
    }

    if (existing.count >= args.maxRequests) {
      return {
        allowed: false,
        limit: args.maxRequests,
        remaining: 0,
        resetAt: existing.resetAt,
        count: existing.count,
      };
    }

    const nextCount = existing.count + 1;
    await ctx.db.patch("rateLimitBuckets", existing._id, { count: nextCount });
    return {
      allowed: true,
      limit: args.maxRequests,
      remaining: Math.max(0, args.maxRequests - nextCount),
      resetAt: existing.resetAt,
      count: nextCount,
    };
  },
});

export const getRateLimitSnapshot = internalQuery({
  args: {
    key: v.string(),
    maxRequests: v.number(),
    windowMs: v.number(),
  },
  returns: rateLimitSnapshot,
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing || now > existing.resetAt) {
      return {
        limit: args.maxRequests,
        remaining: args.maxRequests - 1,
        resetAt: now + args.windowMs,
      };
    }

    return {
      limit: args.maxRequests,
      remaining: Math.max(0, args.maxRequests - existing.count),
      resetAt: existing.resetAt,
    };
  },
});
