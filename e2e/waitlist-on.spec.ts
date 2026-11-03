import { expect, test } from "@playwright/test";

test.describe("waitlist open", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("submits on the mock path and shows the success message", async ({ page }) => {
    await page.goto("/#waitlist");
    await expect(page.getByTestId("waitlist-closed-note")).toHaveCount(0);
    await page.getByLabel("Full name").fill("Maria Santos");
    await page.getByLabel("Email").fill("maria.santos@example.com");
    await page.getByPlaceholder("09XX XXX XXXX").fill("0917 123 4567");
    await page.getByLabel("HOA / condo name").fill("Greenfields Homeowners Association");
    await page.getByLabel("City / municipality").fill("Quezon City");
    await page.getByLabel("Number of units").selectOption("51-150");
    await page.getByLabel("Your role").selectOption("Treasurer");
    await page.getByRole("checkbox", { name: "GCash" }).check();
    await page.getByRole("checkbox", { name: "Spreadsheet tracking" }).check();
    await page.getByRole("checkbox", { name: /I agree to DuesKo contacting me/ }).check();
    await page.getByRole("button", { name: "Join the Waitlist" }).click();
    await expect(page.getByTestId("waitlist-success")).toHaveText(
      "You're on the list! Salamat, Maria! We've saved your spot on the DuesKo waitlist for Greenfields Homeowners Association. We'll email you at maria.santos@example.com when there's news.",
    );
  });
});
