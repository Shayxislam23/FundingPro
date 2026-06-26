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

function matchDonorKey(
  donor: { name: string; shortName?: string | null },
): string | undefined {
  const seed = SEED_DONORS.find(
    (s) => s.shortName === donor.shortName || s.name === donor.name,
  );
  return seed?.key;
}

export const run = internalMutation({
  args: {},
  returns: seedResultValidator,
  handler: async (ctx) => {
    const now = Date.now();
    const donorIdByKey = new Map<string, Id<"donors">>();

    const existingDonors = await ctx.db.query("donors").collect();
    for (const donor of existingDonors) {
      const key = matchDonorKey(donor);
      if (key) {
        donorIdByKey.set(key, donor._id);
      }
    }

    let donorsInserted = 0;
    for (const donor of SEED_DONORS) {
      if (donorIdByKey.has(donor.key)) {
        continue;
      }
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
      donorsInserted += 1;
    }

    const existingPlans = await ctx.db.query("plans").collect();
    const planSlugs = new Set(existingPlans.map((p) => p.slug));
    let plansInserted = 0;
    for (const plan of SEED_PLANS) {
      if (planSlugs.has(plan.slug)) {
        continue;
      }
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
      plansInserted += 1;
    }

    const existingSettings = await ctx.db.query("settings").collect();
    const settingKeys = new Set(existingSettings.map((s) => s.key));
    let settingsInserted = 0;
    for (const setting of SEED_SETTINGS) {
      if (settingKeys.has(setting.key)) {
        continue;
      }
      await ctx.db.insert("settings", {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        createdAt: now,
        updatedAt: now,
      });
      settingsInserted += 1;
    }

    const existingOrgs = await ctx.db.query("organizations").collect();
    const orgNames = new Set(existingOrgs.map((o) => o.name));
    let organizationsInserted = 0;
    for (const org of SEED_ORGANIZATIONS) {
      if (orgNames.has(org.name)) {
        continue;
      }
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
      organizationsInserted += 1;
    }

    const existingConsultants = await ctx.db.query("consultantProfiles").collect();
    let consultantsInserted = 0;
    if (existingConsultants.length === 0) {
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
        consultantsInserted += 1;
      }
    }

    const existingGrants = await ctx.db.query("grants").collect();
    const grantTitles = new Set(existingGrants.map((g) => g.title));
    const grantIdByKey = new Map<string, Id<"grants">>();

    for (const grant of existingGrants) {
      const seed = SEED_GRANTS.find((s) => s.title === grant.title);
      if (seed) {
        grantIdByKey.set(seed.key, grant._id);
      }
    }

    let grantsInserted = 0;
    for (const grant of SEED_GRANTS) {
      if (grantTitles.has(grant.title)) {
        continue;
      }

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
      grantsInserted += 1;
    }

    const existingRequirements = await ctx.db.query("grantRequirements").collect();
    let grantRequirements = existingRequirements.length;
    if (existingRequirements.length === 0) {
      grantRequirements = 0;
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
    }

    const totalDonors = donorIdByKey.size;
    const totalGrants = grantTitles.size + grantsInserted;
    const catalogComplete =
      totalDonors >= SEED_DONORS.length && totalGrants >= SEED_GRANTS.length;

    const insertedAnything =
      donorsInserted > 0 ||
      plansInserted > 0 ||
      settingsInserted > 0 ||
      organizationsInserted > 0 ||
      consultantsInserted > 0 ||
      grantsInserted > 0;

    return {
      skipped: catalogComplete && !insertedAnything,
      donors: totalDonors,
      plans: existingPlans.length + plansInserted,
      settings: existingSettings.length + settingsInserted,
      organizations: existingOrgs.length + organizationsInserted,
      consultants: existingConsultants.length + consultantsInserted,
      grants: totalGrants,
      grantRequirements,
    };
  },
});
