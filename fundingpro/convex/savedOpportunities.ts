import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";
import type { Id } from "./_generated/dataModel";

export const listIds = authedQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const rows = await paginateAll(
      ctx.db
        .query("savedOpportunities")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
    );
    return rows.map((r) => r.opportunityId);
  },
});

export const save = authedMutation({
  args: { opportunityId: v.string() },
  returns: v.object({ saved: v.boolean() }),
  handler: async (ctx, args) => {
    const opportunityId = args.opportunityId as Id<"opportunities">;
    const existing = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("opportunityId", opportunityId)
      )
      .unique();
    if (!existing) {
      const now = Date.now();
      await ctx.db.insert("savedOpportunities", {
        userId: ctx.user._id,
        opportunityId,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { saved: true };
  },
});

export const unsave = authedMutation({
  args: { opportunityId: v.string() },
  returns: v.object({ saved: v.boolean() }),
  handler: async (ctx, args) => {
    const opportunityId = args.opportunityId as Id<"opportunities">;
    const existing = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("opportunityId", opportunityId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete("savedOpportunities", existing._id);
    }
    return { saved: false };
  },
});

export const isSaved = authedQuery({
  args: { opportunityId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedOpportunities")
      .withIndex("by_user_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("opportunityId", args.opportunityId as Id<"opportunities">)
      )
      .unique();
    return !!existing;
  },
});
