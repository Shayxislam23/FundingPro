import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";

const USAGE_SCAN_LIMIT = 500;

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
        .withIndex("by_user_created", (q) =>
          q.eq("userId", ctx.user._id).gte("createdAt", since)
        )
        .take(USAGE_SCAN_LIMIT),
      ctx.db
        .query("proposalProjects")
        .withIndex("by_user_created", (q) =>
          q.eq("userId", ctx.user._id).gte("createdAt", since)
        )
        .take(USAGE_SCAN_LIMIT),
    ]);

    return {
      eligibilityChecks: eligibility.length,
      aiProposals: proposals.length,
    };
  },
});
