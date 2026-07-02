import { v } from "convex/values";
import { adminMutation, adminQuery } from "./lib/customFunctions";
import { internalMutation } from "./_generated/server";
import { paginateAll } from "./lib/pagination";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

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
    titleRu: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionRu: v.optional(v.string()),
    sectors: v.optional(v.array(v.string())),
    countryScope: v.optional(v.array(v.string())),
    applicantTypes: v.optional(v.array(v.string())),
    amountMin: v.optional(v.number()),
    amountMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    deadline: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("grants", {
      title: args.title,
      titleRu: args.titleRu,
      donorId: args.donorId as Id<"donors">,
      description: args.description,
      descriptionRu: args.descriptionRu,
      sectors: args.sectors ?? [],
      countryScope: args.countryScope ?? [],
      applicantTypes: args.applicantTypes ?? [],
      currency: args.currency ?? "USD",
      status: "active",
      isActive: args.isActive ?? true,
      isFeatured: args.isFeatured ?? false,
      amountMin: args.amountMin,
      amountMax: args.amountMax,
      deadline: args.deadline,
      sourceUrl: args.sourceUrl,
      lastUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

const importGrantValidator = v.object({
  title: v.string(),
  donorName: v.string(),
  titleRu: v.optional(v.string()),
  description: v.optional(v.string()),
  descriptionRu: v.optional(v.string()),
  sectors: v.optional(v.array(v.string())),
  countryScope: v.optional(v.array(v.string())),
  applicantTypes: v.optional(v.array(v.string())),
  amountMin: v.optional(v.number()),
  amountMax: v.optional(v.number()),
  currency: v.optional(v.string()),
  deadline: v.optional(v.number()),
  sourceUrl: v.optional(v.string()),
});

const IMPORT_BATCH_LIMIT = 100;

async function resolveDonorId(
  ctx: MutationCtx,
  donorName: string,
  donorsByName: Map<string, Id<"donors">>
): Promise<Id<"donors">> {
  const key = donorName.trim().toLowerCase();
  const existing = donorsByName.get(key);
  if (existing) return existing;

  const now = Date.now();
  const donorId = await ctx.db.insert("donors", {
    name: donorName.trim(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  donorsByName.set(key, donorId);
  return donorId;
}

async function donorTitles(
  ctx: MutationCtx,
  donorId: Id<"donors">,
  cache: Map<Id<"donors">, Set<string>>
): Promise<Set<string>> {
  const cached = cache.get(donorId);
  if (cached) return cached;
  const grants = await ctx.db
    .query("grants")
    .withIndex("by_donor", (q) => q.eq("donorId", donorId))
    .collect();
  const titles = new Set(grants.map((g) => g.title.trim().toLowerCase()));
  cache.set(donorId, titles);
  return titles;
}

export const bulkImport = adminMutation({
  args: { grants: v.array(importGrantValidator) },
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    skippedItems: v.array(v.object({ title: v.string(), reason: v.string() })),
  }),
  handler: async (ctx, args) => {
    if (args.grants.length === 0 || args.grants.length > IMPORT_BATCH_LIMIT) {
      throw new Error(`grants must contain 1-${IMPORT_BATCH_LIMIT} items`);
    }

    // One read of the donor catalog for the whole batch (Convex allows a
    // single .paginate() per execution, so avoid paginateAll in loops).
    const donorsByName = new Map<string, Id<"donors">>();
    const activeDonors = await ctx.db
      .query("donors")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    for (const donor of activeDonors) {
      for (const name of [donor.name, donor.nameRu, donor.shortName]) {
        if (name) donorsByName.set(name.trim().toLowerCase(), donor._id);
      }
    }

    const titleCache = new Map<Id<"donors">, Set<string>>();
    const skippedItems: { title: string; reason: string }[] = [];
    let inserted = 0;

    for (const item of args.grants) {
      const title = item.title.trim();
      const sourceUrl = item.sourceUrl?.trim() || undefined;
      if (!title || !item.donorName.trim()) {
        skippedItems.push({ title: title || "(без названия)", reason: "missing_fields" });
        continue;
      }

      if (sourceUrl) {
        const bySource = await ctx.db
          .query("grants")
          .withIndex("by_sourceUrl", (q) => q.eq("sourceUrl", sourceUrl))
          .first();
        if (bySource) {
          skippedItems.push({ title, reason: "duplicate_source_url" });
          continue;
        }
      }

      const donorId = await resolveDonorId(ctx, item.donorName, donorsByName);
      const titles = await donorTitles(ctx, donorId, titleCache);
      if (titles.has(title.toLowerCase())) {
        skippedItems.push({ title, reason: "duplicate_title" });
        continue;
      }
      titles.add(title.toLowerCase());

      const now = Date.now();
      await ctx.db.insert("grants", {
        title,
        titleRu: item.titleRu?.trim() || undefined,
        donorId,
        description: item.description?.trim() || undefined,
        descriptionRu: item.descriptionRu?.trim() || undefined,
        sectors: item.sectors ?? [],
        countryScope: item.countryScope ?? [],
        applicantTypes: item.applicantTypes ?? [],
        amountMin: item.amountMin,
        amountMax: item.amountMax,
        currency: item.currency ?? "USD",
        deadline: item.deadline,
        sourceUrl,
        status: "active",
        isActive: true,
        isFeatured: false,
        lastUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }

    return { inserted, skipped: skippedItems.length, skippedItems };
  },
});

const CLOSE_EXPIRED_BATCH = 100;

export const closeExpiredGrants = internalMutation({
  args: {},
  returns: v.object({ closed: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    // Filter before take so already-closed grants never crowd the batch out.
    const dueForClosure = await ctx.db
      .query("grants")
      .withIndex("by_deadline", (q) => q.gt("deadline", 0).lt("deadline", now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(CLOSE_EXPIRED_BATCH);

    let closed = 0;
    for (const grant of dueForClosure) {
      await ctx.db.patch("grants", grant._id, {
        isActive: false,
        status: "closed",
        lastUpdatedAt: now,
        updatedAt: now,
      });
      closed += 1;
    }
    return { closed };
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
