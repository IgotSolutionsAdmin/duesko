import { expect, test } from "@playwright/test";

const banner = "TEST SITE - sample data only, not for real payments";

test("test site shows the banner and both passwordless demo logins", async ({ page }) => {
  await page.goto("/");
  const status = page.getByRole("status");
  await expect(status).toHaveText(banner);
  await expect(status).toHaveAttribute("title", /cold start/);

  await page.goto("/admin/login");
  await expect(page.getByRole("status")).toHaveText(banner);
  await page.getByRole("button", { name: "Sign in as demo admin (Ana Reyes)" }).click();
  await page.waitForURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");
  await expect(page.getByRole("status")).toHaveText(banner);

  await page.context().clearCookies();
  await page.goto("/resident/login");
  await expect(page.getByRole("status")).toHaveText(banner);
  await expect(
    page.getByRole("button", { name: "Sign in as demo admin (Ana Reyes)" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in as demo resident (Juan dela Cruz)" }).click();
  await page.waitForURL(/\/resident$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Juan");
  await expect(page.getByRole("status")).toHaveText(banner);
});
