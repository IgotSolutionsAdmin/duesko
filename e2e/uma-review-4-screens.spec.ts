import { expect, type Page, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const outDir = "/opt/cursor/artifacts/screenshots";

async function signIn(page: Page) {
  await page.context().clearCookies();
  await page.goto("/resident/login");
  await page.getByRole("button", { name: "Sign in as Juan dela Cruz" }).click();
  await page.waitForURL(/\/resident$/);
}

test.describe("uma review 4 viewport screenshots", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ request }) => {
    expect((await request.post("/dev/reset")).status()).toBe(204);
  });

  test("captures three resident payment viewport shots", async ({ page }) => {
    await signIn(page);
    await page.goto("/resident/payments");
    await page.getByRole("button", { name: "Upload proof of payment" }).click();
    await expect(page.getByText("Enter the amount in pesos, such as 1500.00.")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    mkdirSync(outDir, { recursive: true });
    await page.screenshot({
      path: `${outDir}/resident-upload-error-bottom-mobile.png`,
      fullPage: false,
    });

    await page.goto("/resident/payments?charge=44444444-4444-4444-8444-444444444402&reupload=1");
    await expect(page.getByTestId("reupload-banner")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    const chargeOption = page.locator("#chargeId option:checked");
    await expect(chargeOption).toHaveText(/Gate repair special assessment/);
    await expect(chargeOption).not.toHaveText(/₱/);
    await page.screenshot({
      path: `${outDir}/resident-reupload-top-mobile.png`,
      fullPage: false,
    });

    await page.goto("/resident/payments");
    await expect(page.getByRole("heading", { name: "Payment history" })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.screenshot({
      path: `${outDir}/resident-history-bottom-mobile.png`,
      fullPage: false,
    });
  });
});
