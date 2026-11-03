import { expect, type Page, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const outDir = "/opt/cursor/artifacts/screenshots";

async function signIn(page: Page, name: "Ana Reyes" | "Juan dela Cruz") {
  await page.context().clearCookies();
  const home = name === "Ana Reyes" ? /\/admin$/ : /\/resident$/;
  await page.goto(name === "Ana Reyes" ? "/admin/login" : "/resident/login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
  await page.waitForURL(home);
}

async function viewportBottomShot(page: Page, filename: string) {
  mkdirSync(outDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.screenshot({ path: `${outDir}/${filename}`, fullPage: false });
}

test.describe("uma review 3 viewport screenshots", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ request }) => {
    expect((await request.post("/dev/reset")).status()).toBe(204);
  });

  test("captures six mobile viewport shots for review 3", async ({ page }) => {
    await signIn(page, "Ana Reyes");
    await expect(page.getByRole("heading", { name: /Magandang umaga/ })).toBeVisible();
    await viewportBottomShot(page, "admin-dashboard-bottom-mobile.png");

    await page.goto("/admin/units");
    await expect(page.getByRole("link", { name: "Add unit" })).toBeVisible();
    await viewportBottomShot(page, "admin-units-bottom-mobile.png");

    await page.goto("/admin/export");
    await expect(page.getByRole("heading", { name: "Payments CSV" })).toBeVisible();
    await expect(page.getByLabel("Month (optional)")).toHaveValue("");
    await viewportBottomShot(page, "admin-export-mobile.png");

    await signIn(page, "Juan dela Cruz");
    await expect(page.getByRole("heading", { name: /Hi,/ })).toBeVisible();
    await viewportBottomShot(page, "resident-home-bottom-mobile.png");

    await page.goto("/resident/payments");
    await page.getByRole("link", { name: "Re-upload" }).first().click();
    await expect(page.getByTestId("reupload-banner")).toBeVisible();
    await viewportBottomShot(page, "resident-reupload-mobile.png");

    await page.goto("/resident/payments");
    await page.getByRole("button", { name: "Upload proof of payment" }).click();
    const paymentDate = page.getByLabel("Payment date");
    await expect(paymentDate).toBeVisible();
    await paymentDate.scrollIntoViewIfNeeded();
    const banner = page.getByText("TEST SITE - sample data only, not for real payments");
    const bannerBox = await banner.boundingBox();
    const dateBox = await paymentDate.boundingBox();
    expect(bannerBox && dateBox).toBeTruthy();
    expect(bannerBox!.y + bannerBox!.height).toBeLessThanOrEqual(dateBox!.y + 1);
    mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: `${outDir}/resident-upload-error-mobile.png`, fullPage: false });
  });
});
