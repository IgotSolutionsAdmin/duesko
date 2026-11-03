import { expect, test } from "@playwright/test";

const banner = "TEST SITE - sample data only, not for real payments";

test("without the test-site flag there is no banner, demo sign-in, or dev routes", async ({
  page,
  request,
}) => {
  await page.goto("/admin/login");
  await expect(page.getByText(banner)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sign in as/ })).toHaveCount(0);
  await expect(page.getByText("Production sign-in uses Supabase Auth only.")).toBeVisible();

  expect((await request.post("/dev/session")).status()).toBe(404);
  expect((await request.post("/dev/reset")).status()).toBe(404);
  expect((await request.get("/dev/proofs/sample-token")).status()).toBe(404);
});
