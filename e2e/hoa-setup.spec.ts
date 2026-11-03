import { expect, type Page, test } from "@playwright/test";

function field(page: Page, name: string) {
  return page.getByLabel(name).filter({ visible: true });
}

test.beforeEach(async ({ request }) => {
  const response = await request.post("/dev/reset");
  expect(response.status()).toBe(204);
});

test("demo sign-in as admin", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Villa Esperanza Homeowners Association, Inc.",
  );
  await expect(
    page.getByText("Signed in as Ana Reyes, admin treasurer."),
  ).toBeVisible();
});

test("HOA setup requires a registered name", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
  const name = field(page, "Registered name");

  await name.fill("");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(name).toHaveJSProperty("validity.valueMissing", true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Villa Esperanza Homeowners Association, Inc.",
  );

  await name.fill("   ");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Registered name is required.",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Villa Esperanza Homeowners Association, Inc.",
  );

  await name.fill("Sampaguita Residences Homeowners Association, Inc.");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sampaguita Residences Homeowners Association, Inc.",
  );
});

test("add and edit a flat unit and a per-sqm unit", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();

  await page.getByRole("link", { name: "Add unit" }).click();
  await field(page, "Unit label").fill("Blk 3 Lot 2");
  await field(page, "Flat monthly amount").check();
  await field(page, "Amount (PHP)").fill("2500");
  await page.getByRole("button", { name: "Add unit" }).click();
  await expect(page.getByRole("heading", { name: "Blk 3 Lot 2" })).toBeVisible();
  await expect(page.getByText("Flat rate · ₱2,500.00 a month")).toBeVisible();

  await page.getByRole("link", { name: "Add unit" }).click();
  await field(page, "Unit label").fill("Blk 3 Lot 3");
  await field(page, "Per square metre").check();
  await field(page, "Amount (PHP)").fill("40");
  await field(page, "Floor area (sqm)").fill("32.5");
  await page.getByRole("button", { name: "Add unit" }).click();
  await expect(page.getByRole("heading", { name: "Blk 3 Lot 3" })).toBeVisible();
  await expect(
    page.getByText("₱40.00 per sqm × 32.5 sqm · ₱1,300.00 a month"),
  ).toBeVisible();

  await page.getByRole("link", { name: "Edit Blk 3 Lot 2" }).click();
  await field(page, "Unit label").fill("Blk 3 Lot 2A");
  await field(page, "Amount (PHP)").fill("2750.50");
  await page.getByRole("button", { name: "Save unit" }).click();
  await expect(page.getByRole("heading", { name: "Blk 3 Lot 2A" })).toBeVisible();
  await expect(page.getByText("Flat rate · ₱2,750.50 a month")).toBeVisible();

  await page.getByRole("link", { name: "Edit Blk 3 Lot 3" }).click();
  await field(page, "Floor area (sqm)").fill("40");
  await page.getByRole("button", { name: "Save unit" }).click();
  await expect(
    page.getByText("₱40.00 per sqm × 40 sqm · ₱1,600.00 a month"),
  ).toBeVisible();
});

test("resident sees only their own unit", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in as Ana Reyes" }).click();
  await page.getByRole("link", { name: "Add unit" }).click();
  await field(page, "Unit label").fill("Blk 9 Lot 9");
  await field(page, "Flat monthly amount").check();
  await field(page, "Amount (PHP)").fill("999");
  await page.getByRole("button", { name: "Add unit" }).click();
  await expect(page.getByRole("heading", { name: "Blk 9 Lot 9" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "Sign in as Juan dela Cruz" }).click();
  await expect(page).toHaveURL(/\/resident$/);
  await expect(page.getByRole("heading", { name: "Blk 1 Lot 4" })).toBeVisible();
  await expect(
    page.getByText("Flat rate · ₱1,500.00 a month").filter({ visible: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Blk 9 Lot 9" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Blk 1 Lot 5" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Blk 2 Lot 1" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Add unit" })).toHaveCount(0);
});
