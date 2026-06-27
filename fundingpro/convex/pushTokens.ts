import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { authedMutation } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";

const platformValidator = v.union(v.literal("ios"), v.literal("android"));

const pushTokenRecordValidator = v.object({
  id: v.string(),
  token: v.string(),
  platform: platformValidator,
  updatedAt: v.string(),
});

export const upsert = authedMutation({
  args: {
    token: v.string(),
    platform: platformValidator,
  },
  returns: pushTokenRecordValidator,
  handler: async (ctx, args) => {
    const trimmedToken = args.token.trim();
    if (!trimmedToken) {
      throw new Error("Push token is required");
    }
    if (trimmedToken.length > 512) {
      throw new Error("Push token is too long");
    }

    const now = Date.now();

    const existingByToken = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", trimmedToken))
      .unique();

    if (existingByToken) {
      await ctx.db.patch("pushTokens", existingByToken._id, {
        userId: ctx.user._id,
        platform: args.platform,
        updatedAt: now,
      });
      return {
        id: existingByToken._id,
        token: trimmedToken,
        platform: args.platform,
        updatedAt: new Date(now).toISOString(),
      };
    }

    const id = await ctx.db.insert("pushTokens", {
      userId: ctx.user._id,
      token: trimmedToken,
      platform: args.platform,
      updatedAt: now,
    });

    return {
      id,
      token: trimmedToken,
      platform: args.platform,
      updatedAt: new Date(now).toISOString(),
    };
  },
});

export const listForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      id: v.id("pushTokens"),
      token: v.string(),
      platform: platformValidator,
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const rows = await paginateAll(
      ctx.db
        .query("pushTokens")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
    );

    return rows.map((row) => ({
      id: row._id,
      token: row.token,
      platform: row.platform,
      updatedAt: row.updatedAt,
    }));
  },
});
