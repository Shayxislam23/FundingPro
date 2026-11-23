/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { SEED_GRANTS } from "./seedData";

const modules = import.meta.glob("./**/*.ts");

describe("catalog seed", () => {
  test("seeds only grants that cite a real programme page", () => {
    expect(SEED_GRANTS.length).toBeGreaterThan(0);
    for (const grant of SEED_GRANTS) {
      // Invented entries used short made-up paths such as undp.org/grants/climate-ca.
      expect(grant.sourceUrl, grant.title).toMatch(/^https:\/\/[^/]+\.[a-z]+\/.+/);
    }
  });

  test("production seed (default) adds no demo consultants or organizations", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(internal.seed.run, {});

    expect(result.grants).toBe(SEED_GRANTS.length);
    expect(result.consultants).toBe(0);

    const counts = await t.run(async (ctx) => ({
      consultants: (await ctx.db.query("consultantProfiles").collect()).length,
      organizations: (await ctx.db.query("organizations").collect()).length,
    }));
    expect(counts).toEqual({ consultants: 0, organizations: 0 });
  });

  test("demo data is opt-in for local development", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(internal.seed.run, { includeDemo: true });
    expect(result.consultants).toBeGreaterThan(0);
  });
});
