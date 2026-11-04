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

test.describe("day 7 launch mobile screenshots", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ request }) => {
    expect((await request.post("/dev/reset")).status()).toBe(204);
  });

  test("captures six MVP mobile viewport shots", async ({ page }) => {
    mkdirSync(outDir, { recursive: true });
    await signIn(page, "Ana Reyes");
    await expect(page.getByRole("heading", { name: /Magandang umaga/ })).toBeVisible();
    await page.screenshot({ path: `${outDir}/day7-admin-dashboard-mobile.png`, fullPage: false });

    await page.goto("/admin/charges");
    await expect(page.getByRole("heading", { name: "Charges" })).toBeVisible();
    await page.screenshot({ path: `${outDir}/day7-admin-charges-mobile.png`, fullPage: false });

    await page.goto("/admin/payments");
    await expect(page.getByRole("heading", { name: "Pending proofs" })).toBeVisible();
    await page.screenshot({ path: `${outDir}/day7-admin-payments-mobile.png`, fullPage: false });

    await signIn(page, "Juan dela Cruz");
    await page.goto("/resident/help");
    await expect(page.getByRole("heading", { name: "Paying your dues" })).toBeVisible();
    await page.screenshot({ path: `${outDir}/day7-resident-help-mobile.png`, fullPage: false });

    await page.goto("/resident/payments");
    await expect(page.getByRole("heading", { name: "Upload proof of payment" })).toBeVisible();
    await page.screenshot({ path: `${outDir}/day7-resident-upload-mobile.png`, fullPage: false });

    await page.goto("/resident/acknowledgments");
    await expect(page.getByRole("heading", { name: "Acknowledgments" })).toBeVisible();
    await page.screenshot({ path: `${outDir}/day7-resident-acknowledgments-mobile.png`, fullPage: false });
  });
});
