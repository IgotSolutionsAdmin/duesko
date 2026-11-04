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

async function viewportShot(page: Page, filename: string) {
  mkdirSync(outDir, { recursive: true });
  await page.screenshot({ path: `${outDir}/${filename}`, fullPage: false });
}

for (const viewport of [
  { suffix: "1440x900", width: 1440, height: 900 },
  { suffix: "390x844", width: 390, height: 844 },
]) {
  test.describe(`v3 reference screens ${viewport.suffix}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ request }) => {
      expect((await request.post("/dev/reset")).status()).toBe(204);
    });

    test(`captures admin dashboard, payments, and resident home at ${viewport.suffix}`, async ({
      page,
    }) => {
      await signIn(page, "Ana Reyes");
      await expect(page.getByRole("heading", { name: /Magandang umaga/ })).toBeVisible();
      await viewportShot(page, `v3-admin-dashboard-${viewport.suffix}.png`);

      await page.goto("/admin/payments");
      await expect(page.getByRole("heading", { name: "Pending proofs" })).toBeVisible();
      await viewportShot(page, `v3-admin-payments-${viewport.suffix}.png`);

      await signIn(page, "Juan dela Cruz");
      await expect(page.getByRole("heading", { name: /Hi,/ })).toBeVisible();
      await viewportShot(page, `v3-resident-home-${viewport.suffix}.png`);
    });
  });
}
