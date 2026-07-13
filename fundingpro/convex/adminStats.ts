import { v } from "convex/values";
import { adminQuery } from "./lib/customFunctions";
import { paginateAll } from "./lib/pagination";

export const dashboard = adminQuery({
  args: {
    monthStart: v.number(),
  },
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
  handler: async (ctx, args) => {
    const [stats, aiThisMonth, recentUsersRaw] = await Promise.all([
      ctx.db
        .query("platformStats")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .unique(),
      paginateAll(
        ctx.db
          .query("aiRequests")
          .withIndex("by_created", (q) => q.gte("createdAt", args.monthStart))
      ),
      ctx.db.query("users").withIndex("by_created").order("desc").take(5),
    ]);

    const recentUsers = recentUsersRaw.map((u) => ({
      id: u.clerkId,
      email: u.email ?? null,
      createdAt: new Date(u.createdAt).toISOString(),
    }));

    return {
      totalUsers: stats?.totalUsers ?? 0,
      totalOrganizations: stats?.totalOrganizations ?? 0,
      totalGrants: stats?.totalGrants ?? 0,
      totalApplications: stats?.totalApplications ?? 0,
      totalSupportTickets: stats?.totalSupportTickets ?? 0,
      activeSubscriptions: stats?.activeSubscriptions ?? 0,
      aiRequestsThisMonth: aiThisMonth.length,
      openTickets: stats?.openTickets ?? 0,
      subscriptionRequests: stats?.subscriptionRequests ?? 0,
      recentUsers,
      integrationStatus: "convex",
    };
  },
});

export const funnel = adminQuery({
  args: {
    last30DaysSignups: v.optional(v.boolean()),
    now: v.optional(v.number()),
  },
  returns: v.object({
    signups: v.number(),
    withOrg: v.number(),
    withSavedGrant: v.number(),
    withApplication: v.number(),
    withSubscription: v.number(),
    conversionRate: v.number(),
    /** Active «Мой путь» participants (labParticipants rows). */
    labParticipants: v.number(),
    /** Lab participants with application proof approved or submitted task. */
    withVerifiedApplication: v.number(),
    /** North Star: verified applications / lab participants (0–1). */
    northStarRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const cutoff = args.last30DaysSignups ? (args.now ?? 0) - 30 * 24 * 60 * 60 * 1000 : 0;
    const users = cutoff
      ? await paginateAll(
          ctx.db
            .query("users")
            .withIndex("by_created", (q) => q.gte("createdAt", cutoff))
        )
      : await paginateAll(ctx.db.query("users"));

    let withOrg = 0;
    let withSaved = 0;
    let withApp = 0;
    let withSub = 0;
    let labParticipants = 0;
    let withVerifiedApplication = 0;

    for (const user of users) {
      const [org, saved, app, sub, lab] = await Promise.all([
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
        ctx.db
          .query("labParticipants")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first(),
      ]);
      if (org) withOrg++;
      if (saved) withSaved++;
      if (app) withApp++;
      if (sub) withSub++;
      if (lab) {
        labParticipants++;
        const proof = lab.applicationProofStatus;
        if (proof === "submitted" || proof === "completed") {
          withVerifiedApplication++;
        }
      }
    }

    const signups = users.length;
    return {
      signups,
      withOrg,
      withSavedGrant: withSaved,
      withApplication: withApp,
      withSubscription: withSub,
      conversionRate: signups > 0 ? withSub / signups : 0,
      labParticipants,
      withVerifiedApplication,
      northStarRate: labParticipants > 0 ? withVerifiedApplication / labParticipants : 0,
    };
  },
});
