import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import type { Id } from "./_generated/dataModel";

export const listIds = authedQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("savedGrants")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    return rows.map((r) => r.grantId);
  },
});

export const save = authedMutation({
  args: { grantId: v.string() },
  returns: v.object({ saved: v.boolean() }),
  handler: async (ctx, args) => {
    const grantId = args.grantId as Id<"grants">;
    const existing = await ctx.db
      .query("savedGrants")
      .withIndex("by_user_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("grantId", grantId)
      )
      .unique();
    if (!existing) {
      const now = Date.now();
      await ctx.db.insert("savedGrants", {
        userId: ctx.user._id,
        grantId,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { saved: true };
  },
});

export const unsave = authedMutation({
  args: { grantId: v.string() },
  returns: v.object({ saved: v.boolean() }),
  handler: async (ctx, args) => {
    const grantId = args.grantId as Id<"grants">;
    const existing = await ctx.db
      .query("savedGrants")
      .withIndex("by_user_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("grantId", grantId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete("savedGrants", existing._id);
    }
    return { saved: false };
  },
});

export const isSaved = authedQuery({
  args: { grantId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedGrants")
      .withIndex("by_user_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("grantId", args.grantId as Id<"grants">)
      )
      .unique();
    return !!existing;
  },
});
