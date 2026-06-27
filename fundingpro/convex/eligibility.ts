import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { eligibilityAnswersValidator } from "./lib/validators";
import type { Id } from "./_generated/dataModel";

export const getGrant = authedQuery({
  args: { grantId: v.string() },
  returns: v.union(
    v.object({
      title: v.string(),
      sectors: v.array(v.string()),
      country_scope: v.array(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const grant = await ctx.db.get("grants", args.grantId as Id<"grants">);
    if (!grant) return null;
    return {
      title: grant.title,
      sectors: grant.sectors,
      country_scope: grant.countryScope,
    };
  },
});

export const saveCheck = authedMutation({
  args: {
    grantId: v.optional(v.union(v.string(), v.null())),
    answers: eligibilityAnswersValidator,
    score: v.number(),
    status: v.string(),
    strengths: v.array(v.string()),
    gaps: v.array(v.string()),
    nextSteps: v.array(v.string()),
    aiRequestId: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("eligibilityChecks", {
      userId: ctx.user._id,
      grantId: args.grantId ? (args.grantId as Id<"grants">) : undefined,
      answers: args.answers,
      score: args.score,
      status: args.status,
      strengths: args.strengths,
      gaps: args.gaps,
      nextSteps: args.nextSteps,
      aiRequestId: args.aiRequestId ? (args.aiRequestId as Id<"aiRequests">) : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});
