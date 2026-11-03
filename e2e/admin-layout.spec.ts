import { expect, test } from "@playwright/test";

test.describe("officer desktop layout", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ request }) => {
    const response = await request.post("/dev/reset");
    expect(response.status()).toBe(204);
  });

  test("sidebar is visible and navigates, then sign out", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    const sidebar = page.getByRole("complementary", { name: "Officer menu" });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(sidebar.getByText("Villa Esperanza Homeowners Association, Inc.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();

    await sidebar.getByRole("link", { name: "Units" }).click();
    await expect(page).toHaveURL(/\/admin\/units$/);
    await expect(sidebar.getByRole("link", { name: "Units" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await sidebar.getByRole("link", { name: "Charges" }).click();
    await expect(page).toHaveURL(/\/admin\/charges$/);

    await sidebar.getByRole("link", { name: "Payments" }).click();
    await expect(page).toHaveURL(/\/admin\/payments$/);

    await sidebar.getByRole("link", { name: "Export" }).click();
    await expect(page).toHaveURL(/\/admin\/export$/);
    await expect(page.getByRole("heading", { name: "Payments CSV" })).toBeVisible();

    await sidebar.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Officer sign in" })).toBeVisible();
  });
});

test.describe("officer mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ request }) => {
    const response = await request.post("/dev/reset");
    expect(response.status()).toBe(204);
  });

  test("bottom nav and hamburger work", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await expect(page.getByRole("complementary", { name: "Officer menu" })).toBeHidden();
    const bar = page.getByRole("navigation", { name: "Officer" }).locator("visible=true");
    const dashboard = bar.getByRole("link", { name: "Dashboard" });
    await expect(dashboard).toBeVisible();
    await expect(dashboard).toHaveAttribute("aria-current", "page");
    await expect(bar.getByRole("link", { name: "Payments", exact: true })).toBeVisible();
    await expect(bar.getByRole("link", { name: "Payments/Proofs" })).toHaveCount(0);
    const box = await dashboard.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expect(dashboard.locator("span").last()).toHaveCSS("font-size", "12px");
    await expect(dashboard.locator("span").last()).toHaveCSS("color", "rgb(15, 42, 51)");
    await expect(bar.locator("svg")).toHaveCount(5);

    await bar.getByRole("link", { name: "Units" }).click();
    await expect(page).toHaveURL(/\/admin\/units$/);
    await bar.getByRole("link", { name: "Export" }).click();
    await expect(page).toHaveURL(/\/admin\/export$/);

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe("resident desktop layout", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ request }) => {
    expect((await request.post("/dev/reset")).status()).toBe(204);
  });

  test("sidebar replaces the phone bottom bar", async ({ page }) => {
    await page.goto("/resident/login");
    await page.getByRole("button", { name: "Sign in as Juan dela Cruz" }).click();
    await expect(page).toHaveURL(/\/resident$/);
    const sidebar = page.getByRole("complementary", { name: "Resident menu" });
    await expect(sidebar).toBeVisible();
    await expect(page.getByTestId("bottom-nav")).toBeHidden();
    await sidebar.getByRole("link", { name: "Payments" }).click();
    await expect(page).toHaveURL(/\/resident\/payments$/);
  });
});
