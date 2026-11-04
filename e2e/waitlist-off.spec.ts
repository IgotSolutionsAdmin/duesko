import { expect, test } from "@playwright/test";

test("waitlist stays closed: fields disabled and POST is 403", async ({ page, request }) => {
  await page.goto("/#waitlist");
  await expect(page.getByTestId("waitlist-closed-note")).toHaveText(
    "The waitlist opens soon. Check back shortly.",
  );
  await expect(page.getByLabel("Full name")).toBeDisabled();
  await expect(page.getByLabel("Email")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Join the Waitlist" })).toBeDisabled();

  const response = await request.post("/api/waitlist", {
    form: {
      fullName: "Maria Santos",
      email: "maria.santos@example.com",
      hoaName: "Greenfields Homeowners Association",
      city: "Quezon City",
      units: "51-150",
      role: "Treasurer",
      collectMethods: "GCash",
      consent: "yes",
    },
  });
  expect(response.status()).toBe(403);
});
