import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";

export const monthlyUsage = authedQuery({
  args: {},
  returns: v.object({
    eligibilityChecks: v.number(),
    aiProposals: v.number(),
  }),
  handler: async (ctx) => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const since = monthStart.getTime();

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
