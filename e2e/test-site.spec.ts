import { expect, test } from "@playwright/test";

const banner = "TEST SITE - sample data only, not for real payments";

test("production test site keeps the banner and rejects passwordless demo login", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const status = page.getByRole("status");
  await expect(status).toHaveText(banner);
  await expect(status).toHaveAttribute("title", /cold start/);

  await page.goto("/admin/login");
  await expect(page.getByRole("status")).toHaveText(banner);
  await expect(page.getByRole("heading", { name: "Officer sign in" })).toBeVisible();
  await expect(page.getByText("DEV ONLY")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sign in as demo/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in as Ana Reyes" })).toHaveCount(0);
  await expect(page.getByText("Production sign-in uses Supabase Auth only.")).toBeVisible();

  await page.goto("/resident/login");
  await expect(page.getByRole("status")).toHaveText(banner);
  await expect(page.getByText("DEV ONLY")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sign in as demo/ })).toHaveCount(0);

  expect((await request.post("/dev/session")).status()).toBe(404);
  expect((await request.get("/dev/session")).status()).toBe(404);
  expect((await request.post("/dev/reset")).status()).toBe(404);

  await page.context().addCookies([
    {
      name: "duesko_demo_user",
      value: "33333333-3333-4333-8333-333333333301",
      url: "http://127.0.0.1:43118",
    },
  ]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByText("DEV ONLY")).toHaveCount(0);
});
