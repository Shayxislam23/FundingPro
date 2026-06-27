import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const grantListValidator = v.object({
  id: v.string(),
  title: v.string(),
  title_ru: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  sectors: v.array(v.string()),
  country_scope: v.array(v.string()),
  amount_min: v.union(v.number(), v.null()),
  amount_max: v.union(v.number(), v.null()),
  deadline: v.union(v.string(), v.null()),
  donor: v.object({
    id: v.string(),
    name: v.string(),
    name_ru: v.union(v.string(), v.null()),
  }),
});

const listResultValidator = v.object({
  grants: v.array(grantListValidator),
  total: v.number(),
  page: v.number(),
  limit: v.number(),
  pages: v.number(),
  continueCursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
});

const BATCH_SIZE = 50;

function mapGrantListItem(grant: Doc<"grants">, donor: Doc<"donors"> | null) {
  return {
    id: grant._id,
    title: grant.title,
    title_ru: grant.titleRu ?? null,
    description: grant.description ?? null,
    sectors: grant.sectors,
    country_scope: grant.countryScope,
    amount_min: grant.amountMin ?? null,
    amount_max: grant.amountMax ?? null,
    deadline: grant.deadline ? new Date(grant.deadline).toISOString() : null,
    donor: {
      id: donor?._id ?? "",
      name: donor?.name ?? "",
      name_ru: donor?.nameRu ?? null,
    },
  };
}

function matchesSearch(
  grant: Doc<"grants">,
  donor: Doc<"donors"> | null,
  search: string
): boolean {
  const q = search.toLowerCase();
  const haystack = [
    grant.title,
    grant.titleRu,
    grant.description,
    donor?.name,
    donor?.nameRu,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

type ListFilterArgs = {
  search?: string;
  sector?: string;
  country?: string;
  donorId?: string;
  deadlineBefore?: string;
  deadlineAfter?: string;
  activeOnly?: boolean;
  featured?: boolean;
  today?: number;
};

function passesFilters(
  grant: Doc<"grants">,
  donor: Doc<"donors"> | null,
  args: ListFilterArgs
): boolean {
  if (!grant.isActive) return false;
  if (args.featured && !grant.isFeatured) return false;
  if (args.search && !matchesSearch(grant, donor, args.search)) return false;
  if (args.sector && !grant.sectors.includes(args.sector)) return false;
  if (args.country && !grant.countryScope.includes(args.country)) return false;
  if (args.donorId && grant.donorId !== args.donorId) return false;
  if (args.deadlineBefore && grant.deadline) {
    if (grant.deadline > new Date(args.deadlineBefore).getTime()) return false;
  }
  if (args.activeOnly) {
    const today = args.today ?? 0;
    const openStatuses = ["open", "upcoming", "active"];
    if (!openStatuses.includes(grant.status)) return false;
    if (grant.deadline && grant.deadline < today) return false;
  } else if (args.deadlineAfter) {
    const after = new Date(args.deadlineAfter).getTime();
    if (grant.deadline && grant.deadline < after) return false;
  }
  return true;
}

function grantsIndexQuery(ctx: QueryCtx, args: ListFilterArgs) {
  if (args.donorId) {
    return ctx.db
      .query("grants")
      .withIndex("by_donor", (q) => q.eq("donorId", args.donorId as Id<"donors">));
  }
  if (args.featured) {
    return ctx.db
      .query("grants")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true));
  }
  return ctx.db
    .query("grants")
    .withIndex("by_active_status_deadline", (q) => q.eq("isActive", true));
}

async function listFilteredGrants(
  ctx: QueryCtx,
  args: ListFilterArgs,
  donorCache: Map<string, Doc<"donors"> | null>
) {
  async function getDonor(id: Id<"donors">) {
    if (!donorCache.has(id)) {
      donorCache.set(id, await ctx.db.get("donors", id));
    }
    return donorCache.get(id) ?? null;
  }

  const matched: Array<{ grant: Doc<"grants">; donor: Doc<"donors"> | null }> = [];
  let cursor: string | null = null;
  let isDone = false;

  while (!isDone) {
    const batch = await grantsIndexQuery(ctx, args)
      .order("asc")
      .paginate({ numItems: BATCH_SIZE, cursor });

    for (const grant of batch.page) {
      const donor = await getDonor(grant.donorId);
      if (passesFilters(grant, donor, args)) {
        matched.push({ grant, donor });
      }
    }

    isDone = batch.isDone;
    cursor = batch.continueCursor;
  }

  matched.sort((a, b) => {
    const da = a.grant.deadline ?? Number.MAX_SAFE_INTEGER;
    const db = b.grant.deadline ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });

  return matched;
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    sector: v.optional(v.string()),
    country: v.optional(v.string()),
    donorId: v.optional(v.string()),
    deadlineBefore: v.optional(v.string()),
    deadlineAfter: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    today: v.optional(v.number()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  returns: listResultValidator,
  handler: async (ctx, args) => {
    const donorCache = new Map<string, Doc<"donors"> | null>();
    const filterArgs: ListFilterArgs = {
      search: args.search,
      sector: args.sector,
      country: args.country,
      donorId: args.donorId,
      deadlineBefore: args.deadlineBefore,
      deadlineAfter: args.deadlineAfter,
      activeOnly: args.activeOnly,
      featured: args.featured,
      today: args.today,
    };

    if (args.paginationOpts) {
      const pageItems: Array<{ grant: Doc<"grants">; donor: Doc<"donors"> | null }> = [];
      let cursor = args.paginationOpts.cursor;
      let isDone = false;
      const target = args.paginationOpts.numItems;

      while (pageItems.length < target && !isDone) {
        const batch = await grantsIndexQuery(ctx, filterArgs)
          .order("asc")
          .paginate({ numItems: BATCH_SIZE, cursor });

        for (const grant of batch.page) {
          const donor = donorCache.has(grant.donorId)
            ? (donorCache.get(grant.donorId) ?? null)
            : await (async () => {
                const d = await ctx.db.get("donors", grant.donorId);
                donorCache.set(grant.donorId, d);
                return d;
              })();

          if (passesFilters(grant, donor, filterArgs)) {
            pageItems.push({ grant, donor });
            if (pageItems.length >= target) break;
          }
        }

        isDone = batch.isDone;
        cursor = batch.continueCursor;
      }

      pageItems.sort((a, b) => {
        const da = a.grant.deadline ?? Number.MAX_SAFE_INTEGER;
        const db = b.grant.deadline ?? Number.MAX_SAFE_INTEGER;
        return da - db;
      });

      const limit = target;
      return {
        grants: pageItems.map(({ grant, donor }) => mapGrantListItem(grant, donor)),
        total: pageItems.length,
        page: 1,
        limit,
        pages: isDone ? 1 : 2,
        continueCursor: isDone ? null : cursor,
        isDone: isDone && pageItems.length < target,
      };
    }

    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const matched = await listFilteredGrants(ctx, filterArgs, donorCache);
    const total = matched.length;
    const offset = (page - 1) * limit;
    const pageItems = matched.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      grants: pageItems.map(({ grant, donor }) => mapGrantListItem(grant, donor)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      continueCursor: hasMore ? String(page + 1) : null,
      isDone: !hasMore,
    };
  },
});

export const getById = query({
  args: { id: v.string() },
  returns: v.union(
    v.object({
      id: v.string(),
      title: v.string(),
      title_ru: v.union(v.string(), v.null()),
      description: v.union(v.string(), v.null()),
      description_ru: v.union(v.string(), v.null()),
      sectors: v.array(v.string()),
      country_scope: v.array(v.string()),
      amount_min: v.union(v.number(), v.null()),
      amount_max: v.union(v.number(), v.null()),
      deadline: v.union(v.string(), v.null()),
      donor: v.object({
        id: v.string(),
        name: v.string(),
        name_ru: v.union(v.string(), v.null()),
        website: v.union(v.string(), v.null()),
      }),
      grant_requirements: v.array(
        v.object({
          id: v.string(),
          requirement_type: v.string(),
          text: v.string(),
          required: v.boolean(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let grant: Doc<"grants"> | null = null;
    try {
      grant = await ctx.db.get("grants", args.id as Id<"grants">);
    } catch {
      return null;
    }
    if (!grant) return null;

    const donor = await ctx.db.get("donors", grant.donorId);
    const requirements = await ctx.db
      .query("grantRequirements")
      .withIndex("by_grant", (q) => q.eq("grantId", grant!._id))
      .collect();

    const base = mapGrantListItem(grant, donor);
    return {
      ...base,
      description_ru: grant.descriptionRu ?? null,
      donor: {
        id: donor?._id ?? "",
        name: donor?.name ?? "",
        name_ru: donor?.nameRu ?? null,
        website: donor?.website ?? null,
      },
      grant_requirements: requirements.map((r) => ({
        id: r._id,
        requirement_type: r.requirementType,
        text: r.text,
        required: r.required,
      })),
    };
  },
});

export const healthCheck = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const grant = await ctx.db.query("grants").first();
    return grant !== null || true;
  },
});
