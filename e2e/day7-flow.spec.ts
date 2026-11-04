import { expect, type Page, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function signIn(page: Page, name: "Ana Reyes" | "Juan dela Cruz") {
  await page.context().clearCookies();
  const home = name === "Ana Reyes" ? /\/admin$/ : /\/resident$/;
  await page.goto(name === "Ana Reyes" ? "/admin/login" : "/resident/login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
  await page.waitForURL(home);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(`day 7 MVP flow ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ request }) => {
      expect((await request.post("/dev/reset")).status()).toBe(204);
    });

    test("officer and resident manual payment journey", async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await expect(page.getByRole("heading", { name: /Magandang umaga/ })).toBeVisible();
      await page.goto("/admin/units");
      await expect(page.getByRole("heading", { name: /on file/ })).toBeVisible();
      await page.goto("/admin/charges");
      await expect(page.getByRole("heading", { name: "Charges" })).toBeVisible();

      await signIn(page, "Juan dela Cruz");
      await page.goto("/resident/help");
      await expect(page.getByRole("heading", { name: "Paying your dues" })).toBeVisible();
      await expect(page.getByText(/does not process payments/i)).toBeVisible();

      await page.goto("/resident/payments");
      await page.getByLabel("Charge").selectOption({ label: "November 2026 dues" });
      await page.getByLabel("Amount", { exact: true }).fill("1500");
      await page.getByLabel("Payment date").fill("2026-11-04");
      await page.getByLabel("Method").selectOption("bank_transfer");
      await page.getByLabel("Reference no.").fill("DAY7-FLOW");
      await page.getByLabel("Proof of payment").setInputFiles({
        name: "proof.png",
        mimeType: "image/png",
        buffer: png,
      });
      await page.getByRole("button", { name: "Upload proof of payment" }).click();
      await expect(page.locator('[data-status="pending"]').first()).toBeVisible();

      await signIn(page, "Ana Reyes");
      await page.goto("/admin/payments");
      const row = page.locator("li").filter({ hasText: "DAY7-FLOW" });
      await row.getByRole("button", { name: "Approve" }).click();
      await expect(page.getByText("DAY7-FLOW")).toHaveCount(0);

      await signIn(page, "Juan dela Cruz");
      await page.goto("/resident/acknowledgments");
      await expect(page.getByRole("link", { name: /PAYMENT ACKNOWLEDGMENT/ }).first()).toBeVisible();

      await signIn(page, "Ana Reyes");
      await page.goto("/admin/payments");
      await page.getByRole("link", { name: "Record cash" }).click();
      await page.getByLabel("Unit").selectOption({ label: "Blk 1 Lot 5 · November 2026 dues" });
      await page.getByLabel("Amount", { exact: true }).fill("1500");
      await page.getByLabel("Date received").fill("2026-11-04");
      await page.getByRole("button", { name: "Save & issue acknowledgment" }).click();
      await expect(page.getByRole("heading", { name: "PAYMENT ACKNOWLEDGMENT", exact: true })).toBeVisible();

      await page.goto("/admin/export");
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download CSV" }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/duesko-payments\.csv/);
    });
  });
}
