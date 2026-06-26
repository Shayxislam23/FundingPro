import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";

export const monthlyUsage = authedQuery({
  args: {
    monthStart: v.number(),
  },
  returns: v.object({
    eligibilityChecks: v.number(),
    aiProposals: v.number(),
  }),
  handler: async (ctx, args) => {
    const since = args.monthStart;

    const [eligibility, proposals] = await Promise.all([
      ctx.db
        .query("eligibilityChecks")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .collect(),
      ctx.db
        .query("proposalProjects")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .collect(),
    ]);

    return {
      eligibilityChecks: eligibility.filter((e) => e.createdAt >= since).length,
      aiProposals: proposals.filter((p) => p.createdAt >= since).length,
    };
  },
});
