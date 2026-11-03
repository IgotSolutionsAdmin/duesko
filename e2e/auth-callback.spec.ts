import { expect, test } from "@playwright/test";

test("an auth callback without a code does not open a portal", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(
    page.getByText(/Supabase is not configured for this server\.|This sign-in link is incomplete\./),
  ).toBeVisible();
});

test("set password without a session returns to officer sign-in", async ({ page }) => {
  await page.goto("/auth/set-password");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Officer sign in" })).toBeVisible();
});

test("a rejected sign-in stays on the officer login", async ({ page }) => {
  await page.goto("/sign-in?auth=invalid");
  await expect(page).toHaveURL(/\/admin\/login\?auth=invalid$/);
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a portal" })).toHaveCount(0);
});

test("password reset confirmation stays on the officer login", async ({ page }) => {
  await page.goto("/admin/login?auth=reset-sent");
  await expect(page.getByText("If that email has an account, we sent a link.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a portal" })).toHaveCount(0);
});

test("an officer session stays on the admin portal", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.reload();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Choose a portal" })).toHaveCount(0);
});
