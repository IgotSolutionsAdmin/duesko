import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  const response = await request.post("/dev/reset");
  expect(response.status()).toBe(204);
});

test("admin login routes to the admin portal", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Charges" })).toBeVisible();
  await page.goto("/resident");
  await expect(page).toHaveURL(/\/admin$/);
});

test("a resident cannot open admin pages", async ({ page }) => {
  await page.goto("/resident/login");
  await page.getByRole("button", { name: "Sign in as Juan dela Cruz" }).click();
  await expect(page).toHaveURL(/\/resident$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/resident$/);
  await page.goto("/admin/payments");
  await expect(page).toHaveURL(/\/resident$/);
  await page.goto("/admin/charges");
  await expect(page).toHaveURL(/\/resident$/);
  await expect(page.getByRole("link", { name: "My account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
});
