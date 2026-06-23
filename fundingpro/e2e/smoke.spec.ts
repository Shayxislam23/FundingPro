import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FundingPro/i);
  });

  test("public grants catalog loads", async ({ page }) => {
    await page.goto("/grants");
    await expect(page.getByRole("heading", { name: /Гранты для Узбекистана/i })).toBeVisible();
  });
});

test.describe("API smoke", () => {
  test("health endpoint", async ({ request }) => {
    const res = await request.get("/api/v1/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body.service).toBe("FundingPro API");
  });

  test("grants API is public", async ({ request }) => {
    const res = await request.get("/api/v1/grants?limit=3");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data?.grants)).toBe(true);
  });

  test("protected /me returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/v1/me");
    expect(res.status()).toBe(401);
  });

  test("legacy payment webhook returns 410", async ({ request }) => {
    const res = await request.post("/api/v1/payments/webhook");
    expect(res.status()).toBe(410);
  });
});
