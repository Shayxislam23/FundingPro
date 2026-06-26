import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";

export const getStatus = authedQuery({
  args: {},
  returns: v.object({
    steps: v.object({
      profile: v.boolean(),
      documents: v.boolean(),
      saved_grant: v.boolean(),
      eligibility: v.boolean(),
      ai_proposal: v.boolean(),
    }),
    completedCount: v.number(),
    totalSteps: v.number(),
    isComplete: v.boolean(),
  }),
  handler: async (ctx) => {
    const [membership, docs, saved, apps, eligibility, proposals] = await Promise.all([
      ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .first(),
      ctx.db
        .query("documents")
        .withIndex("by_user_status", (q) => q.eq("userId", ctx.user._id).eq("status", "active"))
        .collect(),
      ctx.db
        .query("savedGrants")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .collect(),
      ctx.db
        .query("applications")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .collect(),
      ctx.db
        .query("eligibilityChecks")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .collect(),
      ctx.db
        .query("proposalProjects")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
        .collect(),
    ]);

    const steps = {
      profile: !!membership,
      documents: docs.length > 0,
      saved_grant: saved.length > 0 || apps.length > 0,
      eligibility: eligibility.length > 0,
      ai_proposal: proposals.length > 0,
    };

    const completedCount = Object.values(steps).filter(Boolean).length;
    const totalSteps = 5;

    return {
      steps,
      completedCount,
      totalSteps,
      isComplete: completedCount === totalSteps,
    };
  },
});
