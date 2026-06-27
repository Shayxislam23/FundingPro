import { v } from "convex/values";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const ADMIN_GRANTS_BATCH = 100;

async function collectAdminGrants(ctx: QueryCtx, search?: string) {
  const searchQ = search?.trim().toLowerCase();
  const matched: Doc<"grants">[] = [];
  let cursor: string | null = null;
  let isDone = false;

  while (!isDone) {
    const batch = await ctx.db
      .query("grants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .paginate({ numItems: ADMIN_GRANTS_BATCH, cursor });

    for (const grant of batch.page) {
      if (searchQ && !grant.title.toLowerCase().includes(searchQ)) continue;
      matched.push(grant);
    }

    isDone = batch.isDone;
    cursor = batch.continueCursor;
  }

  cursor = null;
  isDone = false;
  while (!isDone) {
    const batch = await ctx.db
      .query("grants")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .order("desc")
      .paginate({ numItems: ADMIN_GRANTS_BATCH, cursor });

    for (const grant of batch.page) {
      if (searchQ && !grant.title.toLowerCase().includes(searchQ)) continue;
      matched.push(grant);
    }

    isDone = batch.isDone;
    cursor = batch.continueCursor;
  }

  matched.sort((a, b) => b.updatedAt - a.updatedAt);
  return matched;
}

export const list = adminQuery({
  args: { search: v.optional(v.string()), page: v.number(), limit: v.number() },
  returns: v.object({
    grants: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        status: v.string(),
        isActive: v.boolean(),
        deadline: v.union(v.string(), v.null()),
      })
    ),
    total: v.number(),
    page: v.number(),
    limit: v.number(),
    pages: v.number(),
  }),
  handler: async (ctx, args) => {
    const grants = await collectAdminGrants(ctx, args.search);
    const total = grants.length;
    const offset = (args.page - 1) * args.limit;
    const page = grants.slice(offset, offset + args.limit);
    return {
      grants: page.map((g) => ({
        id: g._id,
        title: g.title,
        status: g.status,
        isActive: g.isActive,
        deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
      })),
      total,
      page: args.page,
      limit: args.limit,
      pages: Math.ceil(total / args.limit) || 1,
    };
  },
});

export const create = adminMutation({
  args: {
    title: v.string(),
    donorId: v.string(),
    description: v.optional(v.string()),
    sectors: v.optional(v.array(v.string())),
    countryScope: v.optional(v.array(v.string())),
    amountMin: v.optional(v.number()),
    amountMax: v.optional(v.number()),
    deadline: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("grants", {
      title: args.title,
      donorId: args.donorId as Id<"donors">,
      description: args.description,
      sectors: args.sectors ?? [],
      countryScope: args.countryScope ?? [],
      applicantTypes: [],
      currency: "USD",
      status: "active",
      isActive: true,
      isFeatured: false,
      amountMin: args.amountMin,
      amountMax: args.amountMax,
      deadline: args.deadline,
      lastUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = adminMutation({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch("grants", id as Id<"grants">, {
      ...patch,
      lastUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const listDonors = adminQuery({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      nameRu: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx) => {
    const donors = await paginateAll(
      ctx.db.query("donors").withIndex("by_active", (q) => q.eq("isActive", true))
    );
    return donors.map((d) => ({
      id: d._id,
      name: d.name,
      nameRu: d.nameRu ?? null,
    }));
  },
});

export const createDonor = adminMutation({
  args: {
    name: v.string(),
    nameRu: v.optional(v.string()),
    shortName: v.optional(v.string()),
    country: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("donors", {
      name: args.name,
      nameRu: args.nameRu,
      shortName: args.shortName,
      country: args.country,
      website: args.website,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listRequirements = adminQuery({
  args: { grantId: v.string() },
  returns: v.array(
    v.object({
      id: v.string(),
      requirementType: v.string(),
      text: v.string(),
      required: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const rows = await paginateAll(
      ctx.db
        .query("grantRequirements")
        .withIndex("by_grant", (q) => q.eq("grantId", args.grantId as Id<"grants">))
    );
    return rows.map((r) => ({
      id: r._id,
      requirementType: r.requirementType,
      text: r.text,
      required: r.required,
    }));
  },
});

export const addRequirement = adminMutation({
  args: {
    grantId: v.string(),
    text: v.string(),
    requirementType: v.optional(v.string()),
    required: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("grantRequirements", {
      grantId: args.grantId as Id<"grants">,
      requirementType: args.requirementType ?? "general",
      text: args.text,
      required: args.required ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
