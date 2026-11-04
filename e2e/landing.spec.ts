import { expect, test } from "@playwright/test";
import { LANDING_FAQ, LANDING_HERO, LANDING_HOW, LANDING_PROBLEM } from "../lib/landing-copy";
import { onlinePayForbiddenRegex } from "../lib/forbidden-online-pay";

const forbiddenPhrases =
  /\bofficial receipt\b|\bbir\b|\bcas\b|\baccredited\b|\bregistered\b/i;
const standaloneOr = /(?<![A-Za-z])OR(?![A-Za-z])/;
const onlinePayForbidden = onlinePayForbiddenRegex();

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(`public landing ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("shows sections, anchors, sign-in, and no banned words", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle("DuesKo | Simple HOA & Condo Dues Collection");
      await expect(page.getByRole("heading", { level: 1, name: LANDING_HERO.h1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: LANDING_PROBLEM.heading })).toBeVisible();
      await expect(page.getByRole("heading", { name: LANDING_HOW.heading })).toBeVisible();
      await expect(page.getByRole("heading", { name: "What you get" })).toBeVisible();
      await expect(page.getByRole("heading", { name: LANDING_FAQ.heading })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Be one of the first communities to try DuesKo." }),
      ).toBeVisible();

      await page.getByRole("link", { name: "See how it works" }).click();
      await expect(page).toHaveURL(/#how$/);
      await expect(page.locator("#how")).toBeInViewport();

      await page.getByRole("link", { name: "Join the Waitlist" }).first().click();
      await expect(page).toHaveURL(/#waitlist$/);
      await expect(page.locator("#waitlist")).toBeInViewport();

      const landingText = await page.locator("body").innerText();
      expect(landingText).not.toMatch(forbiddenPhrases);
      expect(landingText).not.toMatch(onlinePayForbidden);
      expect(landingText).not.toMatch(standaloneOr);

      await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { name: "Choose a portal" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Officer sign in" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Resident sign in" })).toBeVisible();

      await page.goto("/privacy");
      await expect(page.getByRole("heading", { name: "Privacy Notice" })).toBeVisible();
      await expect(page.getByText("Privacy Notice coming soon.")).toBeVisible();
      const privacyText = await page.locator("body").innerText();
      expect(privacyText).not.toMatch(forbiddenPhrases);
      expect(privacyText).not.toMatch(onlinePayForbidden);
      expect(privacyText).not.toMatch(standaloneOr);
    });
  });
}
