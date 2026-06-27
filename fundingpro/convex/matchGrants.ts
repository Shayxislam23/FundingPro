import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";

export const match = authedQuery({
  args: {
    profile: v.any(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      grantId: v.string(),
      title: v.string(),
      titleRu: v.union(v.string(), v.null()),
      score: v.number(),
      reason: v.string(),
      reasons: v.array(v.string()),
      donorName: v.union(v.string(), v.null()),
      deadline: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const profile = args.profile as Record<string, unknown>;
    const sector = typeof profile.sector === "string" ? profile.sector : undefined;
    const country = typeof profile.country === "string" ? profile.country : undefined;

    const grants = await paginateAll(
      ctx.db.query("grants").withIndex("by_active", (q) => q.eq("isActive", true))
    );

    const scored = grants.map((grant) => {
      let score = 50;
      const reasons: string[] = [];
      if (sector && grant.sectors.includes(sector)) {
        score += 25;
        reasons.push("Совпадение по сектору");
      }
      if (country && grant.countryScope.includes(country)) {
        score += 20;
        reasons.push("Совпадение по стране");
      }
      if (grant.isFeatured) {
        score += 5;
        reasons.push("Рекомендуемый грант");
      }
      return { grant, score: Math.min(score, 100), reasons };
    });

    const result = [];
    for (const { grant, score, reasons } of scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)) {
      const donor = await ctx.db.get("donors", grant.donorId);
      result.push({
        grantId: grant._id,
        title: grant.title,
        titleRu: grant.titleRu ?? null,
        score,
        reason: reasons.join("; ") || "Подходит по профилю",
        reasons,
        donorName: donor?.name ?? null,
        deadline: grant.deadline ? new Date(grant.deadline).toISOString() : null,
      });
    }
    return result;
  },
});
