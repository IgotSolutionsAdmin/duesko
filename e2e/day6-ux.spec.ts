import { expect, type Page, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const howToPay = "DuesKo does not process payments. Pay your HOA through its usual channels, then upload your proof here.";

async function signIn(page: Page, name: "Ana Reyes" | "Juan dela Cruz") {
  await page.context().clearCookies();
  const home = name === "Ana Reyes" ? /\/admin$/ : /\/resident$/;
  await page.goto(name === "Ana Reyes" ? "/admin/login" : "/resident/login");
  await page.getByRole("button", { name: `Sign in as ${name}` }).click();
  await page.waitForURL(home);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test.describe(`day 6 ux ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ request }) => {
      expect((await request.post("/dev/reset")).status()).toBe(204);
    });

    test("shows How to pay, proof statuses, sample badges, and re-upload", async ({ page }) => {
      await signIn(page, "Juan dela Cruz");
      await expect(page.getByTestId("how-to-pay").first()).toContainText(howToPay);
      await expect(page.locator('[data-status="rejected"]').first()).toBeVisible();
      await expect(page.getByText("Rejected: Reference number does not match").first()).toBeVisible();
      const rejectedRow = page
        .getByRole("heading", { name: "Gate repair special assessment" })
        .locator("xpath=ancestor::li[1]");
      await expect(rejectedRow.getByText("Rejected: Reference number does not match")).toBeVisible();
      const reasonY = (await rejectedRow.getByText("Rejected: Reference number does not match").boundingBox())?.y ?? 0;
      const reuploadY = (await rejectedRow.getByRole("link", { name: "Re-upload" }).boundingBox())?.y ?? 0;
      expect(reasonY).toBeLessThan(reuploadY);
      await expect(page.getByRole("link", { name: "Re-upload" }).first()).toBeVisible();
      await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();

      await page.getByRole("link", { name: "Re-upload" }).first().click();
      await expect(page.getByTestId("reupload-banner")).toBeVisible();
      await expect(page.getByTestId("how-to-pay").first()).toContainText(howToPay);
      await expect(page.locator("#chargeId")).toHaveValue(/.+/);
      await expect(page.locator("#amount")).toHaveValue(/^\d+\.\d{2}$/);
    });

    test("validates the upload inline and keeps the selected file", async ({ page }) => {
      await signIn(page, "Juan dela Cruz");
      await page.goto("/resident/payments");
      await expect(page.getByRole("button", { name: "Choose photo or PDF" })).toBeVisible();
      await expect(page.getByText("Enter the amount in pesos, such as 1500.00.")).toHaveCount(0);
      const proof = page.locator("#proof");
      await proof.scrollIntoViewIfNeeded();
      await proof.setInputFiles({
        name: "proof.png",
        mimeType: "image/png",
        buffer: png,
      });
      await proof.dispatchEvent("input");
      await proof.dispatchEvent("change");
      await expect
        .poll(async () => proof.evaluate((el) => (el as HTMLInputElement).files?.[0]?.name ?? ""))
        .toBe("proof.png");
      await page.getByRole("button", { name: "Upload proof of payment" }).click();
      await expect(page.getByText("Enter the amount in pesos, such as 1500.00.")).toBeVisible();
      await expect(page.getByText("proof.png")).toBeVisible();
      await expect
        .poll(async () => proof.evaluate((el) => (el as HTMLInputElement).files?.[0]?.name ?? ""))
        .toBe("proof.png");
    });

    test("blocks a second upload while one is pending review", async ({ page }) => {
      await signIn(page, "Juan dela Cruz");
      await page.getByRole("link", { name: "Upload proof of payment" }).click();
      await page.getByLabel("Amount", { exact: true }).fill("1500");
      await page.getByLabel("Payment date").fill("2026-11-03");
      await page.getByLabel("Reference no.").fill("GC-PENDING");
      await page.getByLabel("Proof of payment").setInputFiles({
        name: "proof.png",
        mimeType: "image/png",
        buffer: png,
      });
      await page.getByRole("button", { name: "Upload proof of payment" }).click();
      await expect(page.locator('[data-status="pending"]').first()).toBeVisible();
      await page.goto("/resident/payments");
      await expect(page.locator("#chargeId option", { hasText: "pending review" })).toHaveCount(1);
    });

    test("officer edits How to pay and residents see it", async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await page.goto("/admin/more");
      const field = page.locator("#howToPay");
      await field.click();
      await field.press("ControlOrMeta+A");
      await field.pressSequentially("Bank deposit at BPI, then upload your proof.", { delay: 10 });
      await page.getByRole("button", { name: "Save how to pay" }).click();
      await page.waitForURL(/\/admin\/more/);
      await expect(field).toHaveValue("Bank deposit at BPI, then upload your proof.");

      await signIn(page, "Juan dela Cruz");
      await expect(page.getByTestId("how-to-pay")).toContainText("Bank deposit at BPI");
    });

    test("payments list shows pending, paid, and rejected", async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await page.goto("/admin/payments");
      await expect(page.getByText("Pending review").first()).toBeVisible();
      await expect(page.getByText("Paid").first()).toBeVisible();
      await expect(page.getByText("Rejected").first()).toBeVisible();
      await page.getByRole("button", { name: "Reject" }).first().click();
      const dialog = page.getByTestId("reject-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("Reason for rejection")).toBeVisible();
      await expect(dialog.getByPlaceholder("e.g. Reference number does not match")).toBeVisible();
      const submit = dialog.getByRole("button", { name: "Reject" });
      await expect(submit).toBeDisabled();
      await expect(dialog.getByRole("alert")).toHaveCount(0);
      await dialog.getByLabel("Reason for rejection").fill("Reference number does not match");
      await expect(submit).toBeEnabled();
      await expect(submit).toHaveCSS("background-color", "rgb(220, 38, 38)");
    });

    test("payments error sits in the pending list and units show Sample once", async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await page.goto("/admin/payments?error=1");
      const error = page.getByTestId("list-error");
      await expect(error).toHaveText(/Couldn't load pending proofs/);
      await expect(error.getByRole("link", { name: "Retry" })).toBeVisible();
      await page.goto("/admin/payments");
      await page.getByRole("button", { name: "Approve" }).click();
      await expect(page.getByTestId("list-empty").getByRole("link", { name: "Record a cash or manual payment" })).toBeVisible();
      await page.goto("/admin/units");
      await expect(page.getByRole("heading", { name: /on file/ })).toBeVisible();
      await expect(page.getByText("Sample", { exact: true })).toHaveCount(1);
    });

    test("charges title sits beside Sample and export asks to select a month", async ({ page }) => {
      await signIn(page, "Ana Reyes");
      await page.goto("/admin/charges");
      const heading = page.getByRole("heading", { name: "Charges" });
      await expect(heading).toBeVisible();
      const header = heading.locator("xpath=ancestor::header[1]");
      await expect(header.getByText("Sample", { exact: true })).toBeVisible();
      await page.goto("/admin/export");
      await expect(page.getByLabel("Month (optional)")).toBeVisible();
      await expect(page.getByLabel("Month (optional)")).toHaveValue("");
    });
  });
}
