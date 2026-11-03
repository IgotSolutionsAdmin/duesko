import { expect, type Page, test } from "@playwright/test";

async function signIn(page: Page, name: "Ana Reyes" | "Juan dela Cruz") {
  await page.context().clearCookies();
  const home = name === "Ana Reyes" ? /\/admin$/ : /\/resident$/;
  await page.goto(name === "Ana Reyes" ? "/admin/login" : "/resident/login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
  await page.waitForURL(home);
}

async function expectLastAboveNav(page: Page) {
  const bar = page.getByTestId("bottom-nav");
  if (!(await bar.isVisible())) return;
  const navBox = await bar.boundingBox();
  expect(navBox).toBeTruthy();
  const padding = await page.locator("main.portal-main").evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
  expect(padding).toBeGreaterThanOrEqual((navBox?.height ?? 0) - 1);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const lastBox = await page.getByTestId("page-end").boundingBox();
  expect(lastBox).toBeTruthy();
  expect((lastBox?.y ?? 0) + (lastBox?.height ?? 0)).toBeLessThanOrEqual((navBox?.y ?? 0) + 1);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(`nav clearance ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ request }) => {
      expect((await request.post("/dev/reset")).status()).toBe(204);
    });

    test("last content on admin pages sits above the bottom nav", async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await expectLastAboveNav(page);

      await page.goto("/admin/payments");
      await expect(page.getByRole("heading", { name: "Pending proofs" })).toBeVisible();
      await expectLastAboveNav(page);

      await page.goto("/admin/payments?error=1");
      await expect(page.getByTestId("list-error")).toBeVisible();
      await expectLastAboveNav(page);

      await page.goto("/admin/acknowledgments");
      await expect(page.getByRole("heading", { name: "PAYMENT ACKNOWLEDGMENT", exact: true })).toBeVisible();
      await expectLastAboveNav(page);

      await page.goto("/admin/units");
      await expect(page.getByRole("link", { name: "Add unit" })).toBeVisible();
      await expectLastAboveNav(page);
    });

    test("last content on every resident screen sits above the bottom nav", async ({ page }) => {
      await signIn(page, "Juan dela Cruz");
      await expectLastAboveNav(page);

      await page.goto("/resident/payments");
      await expect(page.getByRole("heading", { name: "Upload proof of payment" })).toBeVisible();
      await expectLastAboveNav(page);

      await page.getByRole("button", { name: "Upload proof of payment" }).click();
      await expect(page.getByText("Enter the amount in pesos, such as 1500.00.")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Payment history" })).toBeVisible();
      await expectLastAboveNav(page);

      await page.getByRole("link", { name: "Re-upload" }).first().click();
      await expect(page.getByTestId("reupload-banner")).toBeVisible();
      await expectLastAboveNav(page);

      await page.goto("/resident/help");
      await expect(page.getByRole("heading", { name: "Paying your dues" })).toBeVisible();
      await expectLastAboveNav(page);

      await page.goto("/resident/acknowledgments");
      await expect(page.getByRole("heading", { name: "Acknowledgments" })).toBeVisible();
      await expectLastAboveNav(page);
    });
  });
}
