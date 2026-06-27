import { v } from "convex/values";
import { type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { authedMutation, authedQuery, adminQuery } from "./lib/customFunctions";
import type { Doc, Id } from "./_generated/dataModel";

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  SAVED: "Сохранена",
  IN_PROGRESS: "В работе",
  SUBMITTED: "Подана",
  AWARDED: "Одобрена",
  REJECTED: "Отклонена",
  WITHDRAWN: "Отозвана",
};

async function listUserApplications(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  status?: string
) {
  const apps: Doc<"applications">[] = [];
  const baseQuery = status
    ? ctx.db
        .query("applications")
        .withIndex("by_user_and_status", (q) => q.eq("userId", userId).eq("status", status))
    : ctx.db
        .query("applications")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId));

  let cursor: string | null = null;
  let isDone = false;
  while (!isDone) {
    const batch = await baseQuery.order("desc").paginate({ numItems: 50, cursor });
    apps.push(...batch.page);
    isDone = batch.isDone;
    cursor = batch.continueCursor;
  }

  return apps;
}

async function listAdminApplications(
  ctx: { db: QueryCtx["db"] },
  status?: string
) {
  const apps: Doc<"applications">[] = [];
  const baseQuery = status
    ? ctx.db.query("applications").withIndex("by_status", (q) => q.eq("status", status))
    : ctx.db.query("applications");

  let cursor: string | null = null;
  let isDone = false;
  while (!isDone) {
    const batch = await baseQuery.order("desc").paginate({ numItems: 50, cursor });
    apps.push(...batch.page);
    isDone = batch.isDone;
    cursor = batch.continueCursor;
  }

  apps.sort((a, b) => b.updatedAt - a.updatedAt);
  return apps;
}

async function mapApplication(ctx: { db: QueryCtx["db"] }, app: Doc<"applications">) {
  const grant = await ctx.db.get("grants", app.grantId);
  let donor: Doc<"donors"> | null = null;
  if (grant) {
    donor = await ctx.db.get("donors", grant.donorId);
  }
  return {
    id: app._id,
    status: app.status,
    notes: app.notes ?? null,
    created_at: new Date(app.createdAt).toISOString(),
    updated_at: new Date(app.updatedAt).toISOString(),
    grant: grant
      ? {
          id: grant._id,
          title: grant.title,
          title_ru: grant.titleRu ?? null,
          deadline: grant.deadline ? new Date(grant.deadline).toISOString() : null,
          amount_min: grant.amountMin ?? null,
          amount_max: grant.amountMax ?? null,
          donor: {
            name: donor?.name ?? null,
            name_ru: donor?.nameRu ?? null,
          },
        }
      : null,
  };
}

const applicationRow = v.object({
  id: v.string(),
  status: v.string(),
  notes: v.union(v.string(), v.null()),
  created_at: v.string(),
  updated_at: v.string(),
  grant: v.union(
    v.object({
      id: v.string(),
      title: v.string(),
      title_ru: v.union(v.string(), v.null()),
      deadline: v.union(v.string(), v.null()),
      amount_min: v.union(v.number(), v.null()),
      amount_max: v.union(v.number(), v.null()),
      donor: v.object({
        name: v.union(v.string(), v.null()),
        name_ru: v.union(v.string(), v.null()),
      }),
    }),
    v.null()
  ),
});

export const list = authedQuery({
  args: {
    status: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  returns: v.object({
    applications: v.array(applicationRow),
    total: v.number(),
    page: v.number(),
    limit: v.number(),
    pages: v.number(),
  }),
  handler: async (ctx, args) => {
    const apps = await listUserApplications(ctx, ctx.user._id, args.status);

    const total = apps.length;
    const offset = (args.page - 1) * args.limit;
    const pageApps = apps.slice(offset, offset + args.limit);
    const applications = await Promise.all(pageApps.map((a) => mapApplication(ctx, a)));

    return {
      applications,
      total,
      page: args.page,
      limit: args.limit,
      pages: Math.ceil(total / args.limit) || 1,
    };
  },
});

export const create = authedMutation({
  args: {
    grantId: v.string(),
    notes: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.union(
    v.object({
      applicationId: v.string(),
      status: v.string(),
      alreadyExists: v.boolean(),
    }),
    v.object({ error: v.literal("GRANT_NOT_FOUND") })
  ),
  handler: async (ctx, args) => {
    const grant = await ctx.db.get("grants", args.grantId as Id<"grants">);
    if (!grant) return { error: "GRANT_NOT_FOUND" as const };

    const existing = await ctx.db
      .query("applications")
      .withIndex("by_user_and_grant", (q) =>
        q.eq("userId", ctx.user._id).eq("grantId", grant._id)
      )
      .first();

    if (existing) {
      return {
        applicationId: existing._id,
        status: existing.status,
        alreadyExists: true,
      };
    }

    const now = Date.now();
    const id = await ctx.db.insert("applications", {
      userId: ctx.user._id,
      grantId: grant._id,
      status: "SAVED",
      notes: args.notes ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { applicationId: id, status: "SAVED", alreadyExists: false };
  },
});

export const getForUser = authedQuery({
  args: { applicationId: v.string() },
  returns: v.union(applicationRow, v.object({ forbidden: v.literal(true) }), v.null()),
  handler: async (ctx, args) => {
    const app = await ctx.db.get("applications", args.applicationId as Id<"applications">);
    if (!app) return null;
    if (app.userId !== ctx.user._id) return { forbidden: true as const };
    return await mapApplication(ctx, app);
  },
});

export const update = authedMutation({
  args: {
    applicationId: v.string(),
    status: v.optional(v.string()),
    notes: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.union(v.object({ id: v.string(), status: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const app = await ctx.db.get("applications", args.applicationId as Id<"applications">);
    if (!app || app.userId !== ctx.user._id) return null;

    const previousStatus = app.status;
    const nextStatus = args.status ?? app.status;
    const patch: Partial<Doc<"applications">> = { updatedAt: Date.now() };
    if (args.status !== undefined) patch.status = args.status;
    if (args.notes !== undefined) patch.notes = args.notes ?? undefined;
    await ctx.db.patch("applications", app._id, patch);

    if (args.status !== undefined && args.status !== previousStatus) {
      const label = APPLICATION_STATUS_LABELS[args.status] ?? args.status;
      await ctx.scheduler.runAfter(0, internal.pushNotifications.sendToUser, {
        userId: app.userId,
        title: "Статус заявки обновлён",
        body: `Ваша заявка: ${label}`,
        data: {
          type: "application_status",
          applicationId: app._id,
          status: args.status,
        },
      });
    }

    return { id: app._id, status: nextStatus };
  },
});

export const remove = authedMutation({
  args: { applicationId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const app = await ctx.db.get("applications", args.applicationId as Id<"applications">);
    if (!app || app.userId !== ctx.user._id) return false;
    await ctx.db.delete("applications", app._id);
    return true;
  },
});

export const listForAdmin = adminQuery({
  args: { limit: v.number(), status: v.optional(v.string()) },
  returns: v.object({
    applications: v.array(applicationRow),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const apps = await listAdminApplications(ctx, args.status);
    const total = apps.length;
    const slice = apps.slice(0, args.limit);
    const applications = await Promise.all(slice.map((a) => mapApplication(ctx, a)));
    return { applications, total };
  },
});
