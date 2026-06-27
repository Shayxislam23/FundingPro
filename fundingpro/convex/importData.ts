/**
 * NOTE: This migration intentionally uses bounded `.collect()` reads where
 * index-only uniqueness checks are not available across imported legacy rows.
 */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { paymentMetadataValidator } from "./lib/validators";

const pgUserValidator = v.object({
  id: v.string(),
  email: v.union(v.string(), v.null()),
  phone: v.union(v.string(), v.null()),
  emailVerified: v.boolean(),
  isActive: v.boolean(),
  isBanned: v.boolean(),
  platformRole: v.union(v.literal("user"), v.literal("admin")),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.union(v.number(), v.null()),
});

const pgOrganizationValidator = v.object({
  id: v.string(),
  name: v.string(),
  legalName: v.union(v.string(), v.null()),
  type: v.string(),
  country: v.union(v.string(), v.null()),
  city: v.union(v.string(), v.null()),
  sector: v.union(v.string(), v.null()),
  description: v.union(v.string(), v.null()),
  website: v.union(v.string(), v.null()),
  registrationNo: v.union(v.string(), v.null()),
  isVerified: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.union(v.number(), v.null()),
});

const pgOrganizationMemberValidator = v.object({
  organizationId: v.string(),
  userId: v.string(),
  role: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const pgApplicationValidator = v.object({
  userId: v.string(),
  organizationId: v.union(v.string(), v.null()),
  grantTitle: v.string(),
  status: v.string(),
  notes: v.union(v.string(), v.null()),
  submittedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const pgPaymentValidator = v.object({
  userId: v.string(),
  amountUsd: v.number(),
  currency: v.string(),
  status: v.string(),
  provider: v.string(),
  providerRefId: v.union(v.string(), v.null()),
  idempotencyKey: v.string(),
  serviceType: v.string(),
  metadata: v.optional(paymentMetadataValidator),
  activatedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const pgUserConsentValidator = v.object({
  userId: v.string(),
  consentType: v.string(),
  documentVersion: v.string(),
  locale: v.union(v.string(), v.null()),
  createdAt: v.number(),
});

const importResultValidator = v.object({
  skipped: v.boolean(),
  users: v.number(),
  organizations: v.number(),
  organizationMembers: v.number(),
  applications: v.number(),
  payments: v.number(),
  userConsents: v.number(),
});

export const importBatch = internalMutation({
  args: {
    users: v.array(pgUserValidator),
    organizations: v.array(pgOrganizationValidator),
    organizationMembers: v.array(pgOrganizationMemberValidator),
    applications: v.array(pgApplicationValidator),
    payments: v.array(pgPaymentValidator),
    userConsents: v.array(pgUserConsentValidator),
  },
  returns: importResultValidator,
  handler: async (ctx, args) => {
    const sampleUsers = await ctx.db.query("users").take(100);
    const hasImportedUsers = sampleUsers.some((u) =>
      u.clerkId.startsWith("import:")
    );

    if (hasImportedUsers) {
      return {
        skipped: true,
        users: 0,
        organizations: 0,
        organizationMembers: 0,
        applications: 0,
        payments: 0,
        userConsents: 0,
      };
    }

    const userIdByPg = new Map<string, Id<"users">>();
    const orgIdByPg = new Map<string, Id<"organizations">>();
    const grantIdByTitle = new Map<string, Id<"grants">>();

    const grants = await ctx.db.query("grants").take(500);
    for (const grant of grants) {
      grantIdByTitle.set(grant.title, grant._id);
    }

    let users = 0;
    for (const row of args.users) {
      const importKey = `import:${row.id}`;
      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", importKey))
        .unique();
      if (existing) {
        userIdByPg.set(row.id, existing._id);
        continue;
      }

      const userId = await ctx.db.insert("users", {
        clerkId: importKey,
        tokenIdentifier: importKey,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        emailVerified: row.emailVerified,
        isActive: row.isActive,
        isBanned: row.isBanned,
        platformRole: row.platformRole,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt ?? undefined,
      });

      await ctx.db.insert("userIdentities", {
        userId,
        provider: "pg_import",
        providerId: row.id,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });

      userIdByPg.set(row.id, userId);
      users += 1;
    }

    let organizations = 0;
    for (const row of args.organizations) {
      const orgId = await ctx.db.insert("organizations", {
        name: row.name,
        legalName: row.legalName ?? undefined,
        type: row.type,
        country: row.country ?? undefined,
        city: row.city ?? undefined,
        sector: row.sector ?? undefined,
        description: row.description ?? undefined,
        website: row.website ?? undefined,
        registrationNo: row.registrationNo ?? undefined,
        isVerified: row.isVerified,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt ?? undefined,
      });
      orgIdByPg.set(row.id, orgId);
      organizations += 1;
    }

    let organizationMembers = 0;
    for (const row of args.organizationMembers) {
      const userId = userIdByPg.get(row.userId);
      const organizationId = orgIdByPg.get(row.organizationId);
      if (!userId || !organizationId) continue;

      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId,
        role: row.role,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      organizationMembers += 1;
    }

    let applications = 0;
    for (const row of args.applications) {
      const userId = userIdByPg.get(row.userId);
      const grantId = grantIdByTitle.get(row.grantTitle);
      if (!userId || !grantId) continue;

      const organizationId = row.organizationId
        ? orgIdByPg.get(row.organizationId)
        : undefined;

      await ctx.db.insert("applications", {
        userId,
        organizationId,
        grantId,
        status: row.status,
        notes: row.notes ?? undefined,
        submittedAt: row.submittedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      applications += 1;
    }

    let payments = 0;
    for (const row of args.payments) {
      const userId = userIdByPg.get(row.userId);
      if (!userId) continue;

      const existing = await ctx.db
        .query("payments")
        .withIndex("by_idempotency", (q) =>
          q.eq("idempotencyKey", row.idempotencyKey)
        )
        .unique();
      if (existing) continue;

      await ctx.db.insert("payments", {
        userId,
        amountUsd: row.amountUsd,
        currency: row.currency,
        status: row.status,
        provider: row.provider,
        providerRefId: row.providerRefId ?? undefined,
        idempotencyKey: row.idempotencyKey,
        serviceType: row.serviceType,
        metadata: row.metadata,
        activatedAt: row.activatedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      payments += 1;
    }

    let userConsents = 0;
    for (const row of args.userConsents) {
      const userId = userIdByPg.get(row.userId);
      if (!userId) continue;

      const existingConsents = await ctx.db
        .query("userConsents")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId).eq("consentType", row.consentType)
        )
        .collect();
      if (
        existingConsents.some((c) => c.documentVersion === row.documentVersion)
      ) {
        continue;
      }

      await ctx.db.insert("userConsents", {
        userId,
        consentType: row.consentType,
        documentVersion: row.documentVersion,
        locale: row.locale ?? undefined,
        createdAt: row.createdAt,
      });
      userConsents += 1;
    }

    return {
      skipped: false,
      users,
      organizations,
      organizationMembers,
      applications,
      payments,
      userConsents,
    };
  },
});
