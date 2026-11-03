import { expect, test } from "@playwright/test";

const forbidden = /\bofficial receipt\b|\bbir\b|\bcas\b|\baccredited\b|\bregistered\b|(?<![A-Za-z])OR(?![A-Za-z])/;

async function signInOfficer(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("export and acknowledgment at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ request }) => {
    expect((await request.post("/dev/reset")).status()).toBe(204);
  });

  test("officer downloads a payments CSV and opens an acknowledgment", async ({ page }) => {
    await signInOfficer(page);
    await page.getByRole("complementary", { name: "Officer menu" }).getByRole("link", { name: "Export" }).click();
    await expect(page.getByRole("heading", { name: "Payments CSV" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/duesko-payments\.csv/);
    const path = await download.path();
    expect(path).toBeTruthy();
    const { readFileSync } = await import("node:fs");
    const body = readFileSync(path!, "utf8");
    expect(body).toContain("proof_status");
    expect(body).toContain("1500.00");
    expect(body).toContain("approved");

    await page.goto("/admin/payments");
    await page.getByRole("link", { name: "Open acknowledgment" }).first().click();
    await expect(page.getByRole("heading", { name: "PAYMENT ACKNOWLEDGMENT", exact: true })).toBeVisible();
    const text = await page.locator("article.acknowledgment").innerText();
    expect(text).toMatch(/Cash received by officer/);
    expect(text).toMatch(/THIS IS NOT AN INVOICE/);
    expect(text).not.toMatch(forbidden);
  });
});

test.describe("export and acknowledgment at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ request }) => {
    expect((await request.post("/dev/reset")).status()).toBe(204);
  });

  test("mobile nav opens export and a cash acknowledgment", async ({ page }) => {
    await signInOfficer(page);
    await page.getByRole("navigation", { name: "Officer" }).locator("visible=true").getByRole("link", { name: "Export" }).click();
    await expect(page.getByRole("heading", { name: "Payments CSV" })).toBeVisible();

    await page.getByRole("navigation", { name: "Officer" }).locator("visible=true").getByRole("link", { name: "Payments", exact: true }).click();
    await page.getByRole("link", { name: "Record cash" }).click();
    await page.getByLabel("Unit").selectOption({ label: "Blk 1 Lot 4 · November 2026 dues" });
    await page.getByLabel("Amount", { exact: true }).fill("1500");
    await page.getByLabel("Date received").fill("2026-11-03");
    await page.getByRole("button", { name: "Save & issue acknowledgment" }).click();
    await expect(page.getByRole("heading", { name: "PAYMENT ACKNOWLEDGMENT", exact: true })).toBeVisible();
    const text = await page.locator("article.acknowledgment").innerText();
    expect(text).toMatch(/Juan dela Cruz/);
    expect(text).toMatch(/Blk 1 Lot 4/);
    expect(text).toMatch(/Cash received by officer/);
    expect(text).not.toMatch(forbidden);

    await page.context().clearCookies();
    await page.goto("/resident/login");
    await page.getByRole("button", { name: "Sign in as Juan dela Cruz" }).click();
    await page.getByRole("link", { name: "View payment acknowledgments" }).click();
    await page.getByRole("link", { name: /PAYMENT ACKNOWLEDGMENT/ }).first().click();
    await expect(page.getByRole("heading", { name: "PAYMENT ACKNOWLEDGMENT", exact: true })).toBeVisible();
    const residentText = await page.locator("article.acknowledgment").innerText();
    expect(residentText).not.toMatch(forbidden);
  });
});
