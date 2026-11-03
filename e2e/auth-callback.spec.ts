import { expect, test } from "@playwright/test";

test("an auth callback without a code does not open a portal", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(
    page.getByText(/Supabase is not configured for this server\.|This sign-in link is incomplete\./),
  ).toBeVisible();
});

test("set password without a session returns to the portal chooser", async ({ page }) => {
  await page.goto("/auth/set-password");
  await expect(page).toHaveURL(/127\.0\.0\.1:43117\/$/);
  await expect(page.getByRole("heading", { name: "Choose a portal" })).toBeVisible();
});
