import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  SEED_CONSULTANTS,
  SEED_DONORS,
  SEED_GRANT_REQUIREMENTS,
  SEED_GRANTS,
  SEED_ORGANIZATIONS,
  SEED_PLANS,
  SEED_SETTINGS,
  parseDeadline,
} from "./seedData";

const seedResultValidator = v.object({
  skipped: v.boolean(),
  donors: v.number(),
  plans: v.number(),
  settings: v.number(),
  organizations: v.number(),
  consultants: v.number(),
  grants: v.number(),
  grantRequirements: v.number(),
});

export const run = internalMutation({
  args: {},
  returns: seedResultValidator,
  handler: async (ctx) => {
    const existingDonors = await ctx.db.query("donors").take(1);
    if (existingDonors.length > 0) {
      return {
        skipped: true,
        donors: 0,
        plans: 0,
        settings: 0,
        organizations: 0,
        consultants: 0,
        grants: 0,
        grantRequirements: 0,
      };
    }

    const now = Date.now();
    const donorIdByKey = new Map<string, Id<"donors">>();

    for (const donor of SEED_DONORS) {
      const id = await ctx.db.insert("donors", {
        name: donor.name,
        nameRu: donor.nameRu,
        shortName: donor.shortName,
        country: donor.country,
        website: donor.website,
        description: donor.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      donorIdByKey.set(donor.key, id);
    }

    for (const plan of SEED_PLANS) {
      await ctx.db.insert("plans", {
        slug: plan.slug,
        name: plan.name,
        nameRu: plan.nameRu,
        targetType: plan.targetType,
        priceUsd: plan.priceUsd,
        priceUzs: plan.priceUzs,
        billingPeriod: "monthly",
        features: plan.features,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const setting of SEED_SETTINGS) {
      await ctx.db.insert("settings", {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const org of SEED_ORGANIZATIONS) {
      await ctx.db.insert("organizations", {
        name: org.name,
        legalName: org.legalName,
        type: org.type,
        country: org.country,
        city: org.city,
        sector: org.sector,
        isVerified: org.isVerified,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const consultant of SEED_CONSULTANTS) {
      const organizationId = await ctx.db.insert("organizations", {
        name: consultant.orgName,
        type: "CONSULTANT",
        country: consultant.country,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("consultantProfiles", {
        organizationId,
        bio: consultant.bio,
        specialties: [...consultant.specialties],
        country: consultant.country,
        rating: consultant.rating,
        reviewCount: consultant.reviewCount,
        isVerified: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const grantIdByKey = new Map<string, Id<"grants">>();

    for (const grant of SEED_GRANTS) {
      const donorId = donorIdByKey.get(grant.donorKey);
      if (!donorId) {
        throw new Error(`Missing donor for grant ${grant.key}`);
      }

      const id = await ctx.db.insert("grants", {
        title: grant.title,
        titleRu: grant.titleRu,
        description: grant.description,
        descriptionRu: grant.descriptionRu,
        donorId,
        sectors: [...grant.sectors],
        countryScope: [...grant.countryScope],
        applicantTypes: [...grant.applicantTypes],
        amountMin: grant.amountMin,
        amountMax: grant.amountMax,
        currency: "USD",
        deadline: parseDeadline(grant.deadline),
        status: "active",
        isActive: true,
        isFeatured: grant.isFeatured,
        sourceUrl: grant.sourceUrl,
        lastUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      grantIdByKey.set(grant.key, id);
    }

    let grantRequirements = 0;
    for (const req of SEED_GRANT_REQUIREMENTS) {
      const grantId = grantIdByKey.get(req.grantKey);
      if (!grantId) {
        throw new Error(`Missing grant for requirement ${req.grantKey}`);
      }

      await ctx.db.insert("grantRequirements", {
        grantId,
        requirementType: req.requirementType,
        text: req.text,
        required: req.required,
        createdAt: now,
        updatedAt: now,
      });
      grantRequirements += 1;
    }

    return {
      skipped: false,
      donors: SEED_DONORS.length,
      plans: SEED_PLANS.length,
      settings: SEED_SETTINGS.length,
      organizations: SEED_ORGANIZATIONS.length,
      consultants: SEED_CONSULTANTS.length,
      grants: SEED_GRANTS.length,
      grantRequirements,
    };
  },
});
