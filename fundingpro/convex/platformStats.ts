import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

export async function refreshPlatformStatsImpl(ctx: MutationCtx) {
  const [users, organizations, grants, applications, tickets, subscriptions, requests, auditLogs] =
    await Promise.all([
      ctx.db.query("users").take(10_000),
      ctx.db.query("organizations").take(10_000),
      ctx.db.query("grants").take(10_000),
      ctx.db.query("applications").take(10_000),
      ctx.db.query("supportTickets").take(10_000),
      ctx.db.query("subscriptions").take(10_000),
      ctx.db.query("subscriptionRequests").take(10_000),
      ctx.db.query("auditLogs").take(10_000),
    ]);

  const openTickets = await ctx.db
    .query("supportTickets")
    .withIndex("by_status", (q) => q.eq("status", "OPEN"))
    .take(10_000);
  const recentUsers = await ctx.db.query("users").withIndex("by_created").order("desc").take(5);

  const payload = {
    key: "global" as const,
    totalUsers: users.length,
    totalOrganizations: organizations.length,
    totalGrants: grants.length,
    totalApplications: applications.length,
    totalSupportTickets: tickets.length,
    totalAuditLogs: auditLogs.length,
    activeSubscriptions: subscriptions.filter((s) => s.status === "ACTIVE").length,
    openTickets: openTickets.length,
    subscriptionRequests: requests.filter((r) => r.status === "PENDING").length,
    recentUsers: recentUsers.map((u) => ({
      clerkId: u.clerkId,
      email: u.email ?? null,
      createdAt: u.createdAt,
    })),
    updatedAt: Date.now(),
  };

  const existing = await ctx.db
    .query("platformStats")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();

  if (existing) {
    await ctx.db.patch("platformStats", existing._id, payload);
  } else {
    await ctx.db.insert("platformStats", payload);
  }
}

export const refresh = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await refreshPlatformStatsImpl(ctx);
    return null;
  },
});
