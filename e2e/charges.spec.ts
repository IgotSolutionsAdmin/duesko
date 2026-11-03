import { expect, type Locator, type Page, test } from "@playwright/test";

function field(scope: Page | Locator, name: string) {
  return scope.getByLabel(name).filter({ visible: true });
}

test.beforeEach(async ({ request }) => {
  const response = await request.post("/dev/reset");
  expect(response.status()).toBe(204);
});

async function signIn(page: Page, name: string) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
}

test("create monthly dues for every unit", async ({ page }) => {
  await signIn(page, "Ana Reyes");
  await page.getByRole("link", { name: "Charges" }).click();
  const monthly = page.getByRole("region", { name: "Monthly dues" });
  await field(monthly, "Period").fill("2026-12");
  await field(monthly, "Due date").fill("2026-12-05");
  await monthly.getByRole("button", { name: "Create monthly dues" }).click();

  const list = page.getByRole("region", { name: "Charge list" });
  await expect(list.getByRole("heading", { name: "December 2026 dues" })).toHaveCount(3);
  await expect(list.getByText("Blk 1 Lot 4", { exact: true })).toHaveCount(3);
  await expect(list.getByText("Blk 1 Lot 5", { exact: true })).toHaveCount(2);
  await expect(list.getByText("Blk 2 Lot 1", { exact: true })).toHaveCount(2);
  await expect(list.locator("p", { hasText: "₱1,500.00" })).toHaveCount(4);
  await expect(list.locator("p", { hasText: "₱1,680.00" })).toHaveCount(2);
  await expect(list.getByText("Unpaid").first()).toBeVisible();
});

test("create a special assessment for a selected unit", async ({ page }) => {
  await signIn(page, "Ana Reyes");
  await page.getByRole("link", { name: "Charges" }).click();
  const special = page.getByRole("region", { name: "Special assessment" });
  await field(special, "Description").fill("Christmas lights");
  await field(special, "Amount (PHP)").fill("500");
  await field(special, "Due date").fill("2026-12-20");
  await special.getByLabel("Selected units").check();
  await special.getByLabel("Blk 1 Lot 5").check();
  await special.getByRole("button", { name: "Create special assessment" }).click();

  const list = page.getByRole("region", { name: "Charge list" });
  await expect(list.getByRole("heading", { name: "Christmas lights" })).toHaveCount(1);
  const card = list.locator("li").filter({ hasText: "Christmas lights" });
  await expect(card.locator("p", { hasText: "₱500.00" })).toHaveCount(1);
  await expect(card.getByText("Blk 1 Lot 5")).toBeVisible();
  await expect(card.getByText("Unpaid")).toBeVisible();
});

test("resident sees only their own charges", async ({ page }) => {
  await signIn(page, "Ana Reyes");
  await page.getByRole("link", { name: "Charges" }).click();
  const monthly = page.getByRole("region", { name: "Monthly dues" });
  await field(monthly, "Period").fill("2026-12");
  await field(monthly, "Due date").fill("2026-12-05");
  await monthly.getByRole("button", { name: "Create monthly dues" }).click();

  const special = page.getByRole("region", { name: "Special assessment" });
  await field(special, "Description").fill("Christmas lights");
  await field(special, "Amount (PHP)").fill("500");
  await field(special, "Due date").fill("2026-12-20");
  await special.getByLabel("Selected units").check();
  await special.getByLabel("Blk 1 Lot 5").check();
  await special.getByRole("button", { name: "Create special assessment" }).click();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "Sign in as Juan dela Cruz" }).click();

  const yours = page.getByRole("region", { name: "Your charges" });
  await expect(yours.getByRole("heading", { name: "December 2026 dues" })).toHaveCount(1);
  await expect(yours.locator("p", { hasText: "₱1,500.00" })).toHaveCount(2);
  await expect(yours.getByRole("heading", { name: "November 2026 dues" })).toHaveCount(1);
  await expect(
    yours.getByRole("heading", { name: "Gate repair special assessment" }),
  ).toHaveCount(1);
  await expect(yours.getByRole("heading", { name: "Christmas lights" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Blk 1 Lot 4" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blk 1 Lot 5" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Blk 2 Lot 1" })).toHaveCount(0);
});
