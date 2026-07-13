import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginateAll } from "./lib/pagination";

const HIGHLIGHTED = new Set(["plan-ngo-pro"]);

const planRow = v.object({
  id: v.string(),
  name: v.string(),
  nameRu: v.string(),
  targetType: v.string(),
  priceUsd: v.number(),
  priceUzs: v.number(),
  features: v.array(v.string()),
  highlighted: v.boolean(),
});

export const list = query({
  args: {},
  returns: v.array(planRow),
  handler: async (ctx) => {
    const plans = await paginateAll(
      ctx.db.query("plans").withIndex("by_active", (q) => q.eq("isActive", true))
    );

    return plans
      .sort((a, b) => a.priceUsd - b.priceUsd)
      .map((p) => {
        let features: string[] = [];
        if (Array.isArray(p.features)) {
          features = p.features.map(String);
        }
        const id = p.slug || p._id;
        return {
          id,
          name: p.name,
          nameRu: p.nameRu ?? p.name,
          targetType: p.targetType,
          priceUsd: p.priceUsd,
          priceUzs: p.priceUzs ?? 0,
          features,
          highlighted: HIGHLIGHTED.has(id),
        };
      });
  },
});

export const getPricing = query({
  args: { planId: v.string() },
  returns: v.union(
    v.object({
      priceUsd: v.number(),
      priceUzs: v.number(),
      nameRu: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const bySlug = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", args.planId))
      .unique();
    const plan = bySlug ?? (await ctx.db.get("plans", args.planId as never));
    if (!plan || !plan.isActive) return null;
    return {
      priceUsd: plan.priceUsd,
      priceUzs: plan.priceUzs ?? 0,
      nameRu: plan.nameRu ?? plan.name,
    };
  },
});

export const getPriceUsd = query({
  args: { planId: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    const bySlug = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", args.planId))
      .unique();
    const plan = bySlug ?? (await ctx.db.get("plans", args.planId as never));
    return plan?.priceUsd ?? null;
  },
});
