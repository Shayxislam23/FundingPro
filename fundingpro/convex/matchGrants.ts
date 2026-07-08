import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { authedQuery } from "./lib/customFunctions";
import { grantMatchProfileValidator } from "./lib/validators";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MIN_CANDIDATES = 50;
const MAX_CANDIDATES = 200;
const FEATURED_CANDIDATES = 50;
const MATCHABLE_STATUSES = ["open", "upcoming", "active"] as const;

function clampLimit(limit: number | undefined) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
}

function candidateBudget(limit: number) {
  return Math.min(Math.max(limit * 20, MIN_CANDIDATES), MAX_CANDIDATES);
}

function normalized(value: string | undefined) {
  return value?.trim().toLowerCase();
}

function includesProfileValue(values: string[], value: string | undefined) {
  const needle = normalized(value);
  if (!needle) return false;
  return values.some((entry) => {
    const haystack = normalized(entry);
    return !!haystack && (haystack === needle || haystack.includes(needle) || needle.includes(haystack));
  });
}

export const match = authedQuery({
  args: {
    profile: grantMatchProfileValidator,
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
    const limit = clampLimit(args.limit);
    const budget = candidateBudget(limit);
    const { sector, country, applicantType } = args.profile;

    const candidates = new Map<string, Doc<"grants">>();

    const addCandidates = (grants: Doc<"grants">[]) => {
      for (const grant of grants) {
        if (grant.isActive) candidates.set(grant._id, grant);
      }
    };

    for (const status of MATCHABLE_STATUSES) {
      if (candidates.size >= budget) break;
      const grants = await ctx.db
        .query("grants")
        .withIndex("by_active_status_deadline", (q) =>
          q.eq("isActive", true).eq("status", status)
        )
        .order("asc")
        .take(budget - candidates.size);
      addCandidates(grants);
    }

    const featured = await ctx.db
      .query("grants")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(FEATURED_CANDIDATES);
    addCandidates(featured);

    if (candidates.size === 0) {
      const fallback = await ctx.db
        .query("grants")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .take(budget);
      addCandidates(fallback);
    }

    const scored = [...candidates.values()].map((grant) => {
      let score = 50;
      const reasons: string[] = [];
      if (includesProfileValue(grant.sectors, sector)) {
        score += 25;
        reasons.push("Совпадение по сектору");
      }
      if (includesProfileValue(grant.countryScope, country)) {
        score += 20;
        reasons.push("Совпадение по стране");
      }
      if (includesProfileValue(grant.applicantTypes, applicantType)) {
        score += 10;
        reasons.push("Совпадение по типу заявителя");
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
