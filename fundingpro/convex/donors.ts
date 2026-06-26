import { v } from "convex/values";
import { query } from "./_generated/server";

const donorRow = v.object({
  id: v.string(),
  name: v.string(),
  name_ru: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  country: v.union(v.string(), v.null()),
  website: v.union(v.string(), v.null()),
});

const listResultValidator = v.object({
  donors: v.array(donorRow),
  total: v.number(),
});

export const list = query({
  args: {},
  returns: listResultValidator,
  handler: async (ctx) => {
    const donors = await ctx.db
      .query("donors")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return {
      donors: donors.map((d) => ({
        id: d._id,
        name: d.name,
        name_ru: d.nameRu ?? null,
        description: d.description ?? null,
        country: d.country ?? null,
        website: d.website ?? null,
      })),
      total: donors.length,
    };
  },
});
