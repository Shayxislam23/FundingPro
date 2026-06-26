import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { adminQuery } from "./lib/customFunctions";
import { getUserByExternalId } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

export const write = internalMutation({
  args: {
    userId: v.optional(v.string()),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let userId: Id<"users"> | undefined;
    if (args.userId) {
      const user = await getUserByExternalId(ctx, args.userId);
      userId = user?._id;
    }
    await ctx.db.insert("auditLogs", {
      userId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const list = adminQuery({
  args: { page: v.number(), limit: v.number() },
  returns: v.object({
    logs: v.array(
      v.object({
        id: v.string(),
        userId: v.union(v.string(), v.null()),
        action: v.string(),
        entityType: v.union(v.string(), v.null()),
        entityId: v.union(v.string(), v.null()),
        createdAt: v.string(),
      })
    ),
    total: v.number(),
    page: v.number(),
    limit: v.number(),
  }),
  handler: async (ctx, args) => {
    const all = await ctx.db.query("auditLogs").collect();
    all.sort((a, b) => b.createdAt - a.createdAt);
    const total = all.length;
    const offset = (args.page - 1) * args.limit;
    const slice = all.slice(offset, offset + args.limit);
    const logs = [];
    for (const row of slice) {
      const user = row.userId ? await ctx.db.get("users", row.userId) : null;
      logs.push({
        id: row._id,
        userId: user?.clerkId ?? null,
        action: row.action,
        entityType: row.entityType ?? null,
        entityId: row.entityId ?? null,
        createdAt: new Date(row.createdAt).toISOString(),
      });
    }
    return { logs, total, page: args.page, limit: args.limit };
  },
});
