import { expect, type Page, test } from "@playwright/test";
import { onlinePayForbiddenRegex } from "../lib/forbidden-online-pay";

async function signIn(page: Page, name: "Ana Reyes" | "Juan dela Cruz") {
  await page.context().clearCookies();
  const home = name === "Ana Reyes" ? /\/admin$/ : /\/resident$/;
  await page.goto(name === "Ana Reyes" ? "/admin/login" : "/resident/login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
  await page.waitForURL(home);
}

function expectNoOnlinePayCopy(text: string) {
  expect(text).not.toMatch(onlinePayForbiddenRegex());
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(`portal copy has no online-pay wording ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ request }) => {
      expect((await request.post("/dev/reset")).status()).toBe(204);
    });

    test("public and signed-in screens stay manual-payments only", async ({ page }) => {
      await page.goto("/");
      expectNoOnlinePayCopy(await page.locator("body").innerText());
      await page.goto("/login");
      expectNoOnlinePayCopy(await page.locator("body").innerText());

      await signIn(page, "Ana Reyes");
      for (const path of ["/admin", "/admin/units", "/admin/charges", "/admin/payments", "/admin/export"]) {
        await page.goto(path);
        expectNoOnlinePayCopy(await page.locator("body").innerText());
      }

      await signIn(page, "Juan dela Cruz");
      for (const path of ["/resident", "/resident/help", "/resident/payments", "/resident/acknowledgments"]) {
        await page.goto(path);
        expectNoOnlinePayCopy(await page.locator("body").innerText());
      }
    });
  });
}
