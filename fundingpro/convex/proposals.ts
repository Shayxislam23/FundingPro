import { v } from "convex/values";
import { authedMutation, authedQuery, adminQuery } from "./lib/customFunctions";
import type { Id } from "./_generated/dataModel";

export const logRequest = authedMutation({
  args: {
    requestType: v.string(),
    model: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    redactionApplied: v.boolean(),
    status: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiRequests", {
      userId: ctx.user._id,
      requestType: args.requestType,
      model: args.model,
      inputTokens: args.inputTokens ?? 0,
      outputTokens: args.outputTokens ?? 0,
      hasPersonalData: false,
      redactionApplied: args.redactionApplied,
      status: args.status ?? "success",
      createdAt: Date.now(),
    });
  },
});

export const saveProject = authedMutation({
  args: {
    title: v.string(),
    grantId: v.optional(v.string()),
    donorFormat: v.string(),
    sections: v.record(v.string(), v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const projectId = await ctx.db.insert("proposalProjects", {
      userId: ctx.user._id,
      title: args.title,
      grantId: args.grantId ? (args.grantId as Id<"grants">) : undefined,
      donorFormat: args.donorFormat,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
    });

    for (const [sectionType, content] of Object.entries(args.sections)) {
      await ctx.db.insert("proposalSections", {
        projectId,
        sectionType,
        content,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
    return projectId;
  },
});

export const listProjects = authedQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      status: v.string(),
      grantId: v.union(v.string(), v.null()),
      createdAt: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const projects = await ctx.db
      .query("proposalProjects")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    return projects
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((p) => ({
        id: p._id,
        title: p.title,
        status: p.status,
        grantId: p.grantId ?? null,
        createdAt: new Date(p.createdAt).toISOString(),
      }));
  },
});

export const listAiLogs = adminQuery({
  args: { page: v.number(), limit: v.number() },
  returns: v.object({
    logs: v.array(
      v.object({
        id: v.string(),
        userId: v.string(),
        requestType: v.string(),
        model: v.string(),
        status: v.string(),
        createdAt: v.string(),
      })
    ),
    total: v.number(),
    page: v.number(),
    limit: v.number(),
  }),
  handler: async (ctx, args) => {
    const all = await ctx.db.query("aiRequests").collect();
    all.sort((a, b) => b.createdAt - a.createdAt);
    const total = all.length;
    const offset = (args.page - 1) * args.limit;
    const slice = all.slice(offset, offset + args.limit);
    const logs = [];
    for (const row of slice) {
      const user = await ctx.db.get("users", row.userId);
      logs.push({
        id: row._id,
        userId: user?.clerkId ?? row.userId,
        requestType: row.requestType,
        model: row.model,
        status: row.status,
        createdAt: new Date(row.createdAt).toISOString(),
      });
    }
    return { logs, total, page: args.page, limit: args.limit };
  },
});
