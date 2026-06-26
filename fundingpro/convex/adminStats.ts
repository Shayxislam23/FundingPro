import { v } from "convex/values";
import { adminQuery } from "./lib/customFunctions";

export const dashboard = adminQuery({
  args: {},
  returns: v.object({
    totalUsers: v.number(),
    totalOrganizations: v.number(),
    totalGrants: v.number(),
    totalApplications: v.number(),
    totalSupportTickets: v.number(),
    activeSubscriptions: v.number(),
    aiRequestsThisMonth: v.number(),
    openTickets: v.number(),
    subscriptionRequests: v.number(),
    recentUsers: v.array(
      v.object({
        id: v.string(),
        email: v.union(v.string(), v.null()),
        createdAt: v.string(),
      })
    ),
    integrationStatus: v.string(),
  }),
  handler: async (ctx) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [users, orgs, grants, apps, tickets, subs, ai, requests] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("organizations").collect(),
        ctx.db.query("grants").collect(),
        ctx.db.query("applications").collect(),
        ctx.db.query("supportTickets").collect(),
        ctx.db.query("subscriptions").collect(),
        ctx.db.query("aiRequests").collect(),
        ctx.db.query("subscriptionRequests").collect(),
      ]);

    const recentUsers = [...users]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((u) => ({
        id: u.clerkId,
        email: u.email ?? null,
        createdAt: new Date(u.createdAt).toISOString(),
      }));

    return {
      totalUsers: users.length,
      totalOrganizations: orgs.filter((o) => !o.deletedAt).length,
      totalGrants: grants.length,
      totalApplications: apps.length,
      totalSupportTickets: tickets.length,
      activeSubscriptions: subs.filter((s) => s.status === "ACTIVE").length,
      aiRequestsThisMonth: ai.filter((a) => a.createdAt >= monthStart.getTime()).length,
      openTickets: tickets.filter((t) => t.status === "OPEN").length,
      subscriptionRequests: requests.filter((r) => r.status === "PENDING").length,
      recentUsers,
      integrationStatus: "convex",
    };
  },
});

export const funnel = adminQuery({
  args: { last30DaysSignups: v.optional(v.boolean()) },
  returns: v.object({
    signups: v.number(),
    withOrg: v.number(),
    withSavedGrant: v.number(),
    withApplication: v.number(),
    withSubscription: v.number(),
    conversionRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const cutoff = args.last30DaysSignups
      ? Date.now() - 30 * 24 * 60 * 60 * 1000
      : 0;

    const users = await ctx.db.query("users").collect();
    const filtered = users.filter((u) => u.createdAt >= cutoff);

    let withOrg = 0;
    let withSaved = 0;
    let withApp = 0;
    let withSub = 0;

    for (const user of filtered) {
      const [org, saved, app, sub] = await Promise.all([
        ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first(),
        ctx.db
          .query("savedGrants")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first(),
        ctx.db
          .query("applications")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first(),
        ctx.db
          .query("subscriptions")
          .withIndex("by_user_status", (q) =>
            q.eq("userId", user._id).eq("status", "ACTIVE")
          )
          .first(),
      ]);
      if (org) withOrg++;
      if (saved) withSaved++;
      if (app) withApp++;
      if (sub) withSub++;
    }

    const signups = filtered.length;
    return {
      signups,
      withOrg,
      withSavedGrant: withSaved,
      withApplication: withApp,
      withSubscription: withSub,
      conversionRate: signups > 0 ? withSub / signups : 0,
    };
  },
});
