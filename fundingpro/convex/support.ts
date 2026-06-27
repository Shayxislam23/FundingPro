import { v } from "convex/values";
import { adminMutation, adminQuery, authedMutation, authedQuery } from "./lib/customFunctions";
import type { Id } from "./_generated/dataModel";

export const listForUser = authedQuery({
  args: { page: v.number(), limit: v.number() },
  returns: v.object({
    tickets: v.array(
      v.object({
        id: v.string(),
        subject: v.string(),
        message: v.string(),
        status: v.string(),
        priority: v.string(),
        created_at: v.string(),
      })
    ),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("supportTickets")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    all.sort((a, b) => b.createdAt - a.createdAt);
    const total = all.length;
    const offset = (args.page - 1) * args.limit;
    const page = all.slice(offset, offset + args.limit);

    return {
      tickets: page.map((t) => ({
        id: t._id,
        subject: t.subject,
        message: t.message,
        status: t.status,
        priority: t.priority,
        created_at: new Date(t.createdAt).toISOString(),
      })),
      total,
    };
  },
});

export const create = authedMutation({
  args: {
    subject: v.string(),
    message: v.string(),
    priority: v.string(),
  },
  returns: v.object({ ticketId: v.string(), status: v.string() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("supportTickets", {
      userId: ctx.user._id,
      subject: args.subject,
      message: args.message,
      status: "OPEN",
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
    });
    return { ticketId: id, status: "OPEN" };
  },
});

export const listForAdmin = adminQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      subject: v.string(),
      message: v.string(),
      status: v.string(),
      priority: v.string(),
      userId: v.string(),
      userEmail: v.union(v.string(), v.null()),
      createdAt: v.string(),
      resolvedAt: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    const result = [];
    for (const t of tickets) {
      const user = await ctx.db.get("users", t.userId);
      result.push({
        id: t._id,
        subject: t.subject,
        message: t.message,
        status: t.status,
        priority: t.priority,
        userId: user?.clerkId ?? t.userId,
        userEmail: user?.email ?? null,
        createdAt: new Date(t.createdAt).toISOString(),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt).toISOString() : null,
      });
    }
    return result;
  },
});

export const updateStatus = adminMutation({
  args: { ticketId: v.string(), status: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "RESOLVED" || args.status === "CLOSED") {
      patch.resolvedAt = Date.now();
    }
    await ctx.db.patch("supportTickets", args.ticketId as Id<"supportTickets">, patch);
    return null;
  },
});
