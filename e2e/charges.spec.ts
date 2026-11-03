import { expect, type Locator, type Page, test } from "@playwright/test";

function field(scope: Page | Locator, name: string) {
  return scope.getByLabel(name).filter({ visible: true });
}

test.beforeEach(async ({ request }) => {
  const response = await request.post("/dev/reset");
  expect(response.status()).toBe(204);
});

async function signIn(page: Page, name: string) {
  const portal = name === "Ana Reyes" ? "/admin/login" : "/resident/login";
  await page.goto(portal);
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
}

test("create monthly dues for every unit", async ({ page }) => {
  await signIn(page, "Ana Reyes");
  await page.getByRole("link", { name: "Charges" }).click();
  await page.getByRole("link", { name: "Create charge" }).filter({ visible: true }).click();
  await field(page, "Period").fill("2026-12");
  await field(page, "Due date").fill("2026-12-05");
  await page.getByRole("button", { name: "Create charge" }).click();

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
  await page.getByRole("link", { name: "Create charge" }).filter({ visible: true }).click();
  await page.getByLabel("Special assessment").check();
  await field(page, "Charge name").fill("Christmas lights");
  await field(page, "Amount per unit").fill("500");
  await field(page, "Due date").fill("2026-12-20");
  await page.getByLabel("Selected units").check();
  await page.getByLabel("Blk 1 Lot 5").check();
  await page.getByRole("button", { name: "Create charge" }).click();

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
  await page.getByRole("link", { name: "Create charge" }).filter({ visible: true }).click();
  await field(page, "Period").fill("2026-12");
  await field(page, "Due date").fill("2026-12-05");
  await page.getByRole("button", { name: "Create charge" }).click();

  await page.getByRole("link", { name: "Create charge" }).filter({ visible: true }).click();
  await page.getByLabel("Special assessment").check();
  await field(page, "Charge name").fill("Christmas lights");
  await field(page, "Amount per unit").fill("500");
  await field(page, "Due date").fill("2026-12-20");
  await page.getByLabel("Selected units").check();
  await page.getByLabel("Blk 1 Lot 5").check();
  await page.getByRole("button", { name: "Create charge" }).click();

  await page.goto("/admin");
  await page.getByRole("button", { name: "Switch to Juan dela Cruz, resident" }).click();

  const yours = page.getByRole("region", { name: "My dues and payments" });
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
