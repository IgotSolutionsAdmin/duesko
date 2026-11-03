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

async function shot(page: Page, name: string) {
  mkdirSync(outDir, { recursive: true });
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
}

for (const viewport of [
  { suffix: "desktop", width: 1440, height: 900 },
  { suffix: "mobile", width: 390, height: 844 },
]) {
  test.describe(`day 6 screenshots ${viewport.suffix}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ request }) => {
      expect((await request.post("/dev/reset")).status()).toBe(204);
    });

    test(`captures admin and resident screens at ${viewport.suffix}`, async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await expect(page.getByRole("heading", { name: /Magandang umaga/ })).toBeVisible();
      await shot(page, `admin-dashboard-${viewport.suffix}.png`);

      await page.goto("/admin/units");
      await expect(page.getByRole("heading", { name: /on file/ })).toBeVisible();
      await shot(page, `admin-units-${viewport.suffix}.png`);

      await page.goto("/admin/charges");
      await expect(page.getByRole("heading", { name: "Charges" })).toBeVisible();
      await shot(page, `admin-charges-${viewport.suffix}.png`);

      await page.goto("/admin/payments");
      await expect(page.getByText("Pending review").first()).toBeVisible();
      await expect(page.getByText("Approved").first()).toBeVisible();
      await expect(page.getByText("Rejected").first()).toBeVisible();
      await shot(page, `admin-payments-${viewport.suffix}.png`);

      await page.getByRole("button", { name: "Reject" }).first().click();
      await expect(page.getByTestId("reject-dialog")).toBeVisible();
      await shot(page, `admin-reject-dialog-${viewport.suffix}.png`);
      await page.getByRole("button", { name: "Cancel" }).click();

      await page.goto("/admin/export");
      await expect(page.getByRole("heading", { name: "Payments CSV" })).toBeVisible();
      await shot(page, `admin-export-${viewport.suffix}.png`);

      await page.goto("/admin/acknowledgments");
      await expect(page.getByRole("heading", { name: "PAYMENT ACKNOWLEDGMENT", exact: true })).toBeVisible();
      await shot(page, `admin-acknowledgment-${viewport.suffix}.png`);

      await signIn(page, "Juan dela Cruz");
      await expect(page.getByRole("heading", { name: /Hi,/ })).toBeVisible();
      await expect(page.getByTestId("how-to-pay")).toBeVisible();
      await shot(page, `resident-home-${viewport.suffix}.png`);
      await shot(page, `resident-how-to-pay-${viewport.suffix}.png`);

      await page.goto("/resident/payments");
      await page.getByRole("button", { name: "Upload proof of payment" }).click();
      await expect(page.getByText("Enter the amount in pesos, such as 1500.00.")).toBeVisible();
      await shot(page, `resident-upload-error-${viewport.suffix}.png`);

      await expect(page.getByRole("heading", { name: "Payment history" })).toBeVisible();
      await shot(page, `resident-history-${viewport.suffix}.png`);

      await page.getByRole("link", { name: "Re-upload" }).first().click();
      await expect(page.getByTestId("reupload-banner")).toBeVisible();
      await shot(page, `resident-reupload-${viewport.suffix}.png`);
    });
  });
}
