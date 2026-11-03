import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const outDir = "/opt/cursor/artifacts/screenshots";

test("captures four landing viewport shots", async ({ page }) => {
  mkdirSync(outDir, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${outDir}/landing-hero-desktop.png`, fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${outDir}/landing-hero-mobile.png`, fullPage: false });

  await page.locator("#waitlist h2").evaluate((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo(0, Math.max(0, top));
  });
  await expect(page.getByRole("heading", { name: "Be one of the first communities to try DuesKo." })).toBeVisible();
  await expect(page.getByTestId("waitlist-closed-note")).toBeVisible();
  await page.screenshot({ path: `${outDir}/landing-waitlist-off-mobile.png`, fullPage: false });

  await page.locator("#faq h2").evaluate((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo(0, Math.max(0, top));
  });
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
  await page.screenshot({ path: `${outDir}/landing-faq-mobile.png`, fullPage: false });
});
