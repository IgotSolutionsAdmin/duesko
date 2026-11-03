import { expect, type Page, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.beforeEach(async ({ request }) => {
  const response = await request.post("/dev/reset");
  expect(response.status()).toBe(204);
});

async function signIn(page: Page, name: "Ana Reyes" | "Juan dela Cruz") {
  await page.context().clearCookies();
  const home = name === "Ana Reyes" ? /\/admin$/ : /\/resident$/;
  await page.goto(name === "Ana Reyes" ? "/admin/login" : "/resident/login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
  await page.waitForURL(home);
}

async function uploadProof(page: Page, reference: string) {
  await page.getByRole("link", { name: "Upload proof of payment" }).click();
  await page.getByLabel("Amount (PHP)").fill("1500");
  await page.getByLabel("Payment date").fill("2026-11-03");
  await page.getByLabel("Method").selectOption("gcash");
  await page.getByLabel("Reference no.").fill(reference);
  await page.getByLabel("Proof of payment").setInputFiles({
    name: "proof.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByRole("button", { name: "Upload proof of payment" }).click();
  await expect(page.locator('[data-status="pending"]').first()).toBeVisible();
}

test("resident uploads proof and the officer approves it", async ({ page }) => {
  await signIn(page, "Juan dela Cruz");
  await uploadProof(page, "GC-APPROVE");
  await expect(page.locator('[data-status="pending"]').first()).toBeVisible();

  await signIn(page, "Ana Reyes");
  await page.goto("/admin/payments");
  const img = page.getByRole("img", { name: "Proof of payment" });
  await expect(img).toBeVisible();
  const src = await img.getAttribute("src");
  expect(src).toBeTruthy();
  const image = await page.request.get(src!);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const uploaded = page.locator("li").filter({ hasText: "GC-APPROVE" });
  await uploaded.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("GC-APPROVE")).toHaveCount(0);

  await signIn(page, "Juan dela Cruz");
  await expect(page.getByRole("heading", { name: "November 2026 dues" })).toBeVisible();
  await expect(page.getByText("Paid Nov 3 · GCash")).toBeVisible();
});

test("officer rejects a proof and the resident sees the reason", async ({ page }) => {
  await signIn(page, "Juan dela Cruz");
  await uploadProof(page, "GC-REJECT");
  await signIn(page, "Ana Reyes");
  await page.goto("/admin/payments");
  const uploaded = page.locator("li").filter({ hasText: "GC-REJECT" }).first();
  await uploaded.getByRole("button", { name: "Reject" }).click();
  const dialog = page.getByTestId("reject-dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Reason for rejection").fill("Reference number does not match");
  await dialog.getByRole("button", { name: "Reject" }).click();
  await signIn(page, "Juan dela Cruz");
  await expect(page.getByText("Rejected: Reference number does not match").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "November 2026 dues" })).toBeVisible();
  await expect(page.getByText("Due Nov 5")).toBeVisible();
});

test("officer records cash and a resident cannot see another unit's payment", async ({ page }) => {
  await signIn(page, "Ana Reyes");
  await page.getByRole("link", { name: "Payments" }).click();
  await page.getByRole("link", { name: "Record cash" }).click();
  await page.getByLabel("Unit").selectOption({ label: "Blk 2 Lot 1 · November 2026 dues" });
  await page.getByLabel("Amount received (PHP)").fill("1680");
  await page.getByLabel("Date received").fill("2026-11-03");
  await page.getByLabel("HOA reference no.").fill("CR-42");
  await page.getByRole("button", { name: "Save cash payment" }).click();
  await expect(page.getByText("CR-42")).toHaveCount(0);
  await expect(page.getByText("Cash").first()).toBeVisible();

  await signIn(page, "Juan dela Cruz");
  await expect(page.getByRole("main").getByText("Blk 2 Lot 1")).toHaveCount(0);
  await expect(page.getByRole("main").getByText("CR-42")).toHaveCount(0);
  await page.goto("/admin/payments");
  await expect(page).toHaveURL(/\/resident/);
});
