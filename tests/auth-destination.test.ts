import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { destinationAfterAuth, linkTypeFromParam } from "../lib/auth-destination";

describe("auth destination", () => {
  it("sends an invite to set a password", () => {
    assert.equal(
      destinationAfterAuth({
        linkType: "invite",
        invitedAt: "2026-11-03T00:00:00Z",
        passwordSet: false,
        role: "admin_treasurer",
      }),
      "/auth/set-password",
    );
  });

  it("sends an invited account without a chosen password to set one", () => {
    assert.equal(
      destinationAfterAuth({
        linkType: null,
        invitedAt: "2026-11-03T00:00:00Z",
        passwordSet: false,
        role: "resident",
      }),
      "/auth/set-password",
    );
  });

  it("opens the matching portal after a magic link", () => {
    assert.equal(
      destinationAfterAuth({
        linkType: "magiclink",
        invitedAt: "2026-11-03T00:00:00Z",
        passwordSet: true,
        role: "resident",
      }),
      "/resident",
    );
    assert.equal(
      destinationAfterAuth({
        linkType: "email",
        invitedAt: null,
        passwordSet: true,
        role: "admin_treasurer",
      }),
      "/admin",
    );
  });

  it("asks for a profile when the auth user has no association row", () => {
    assert.equal(
      destinationAfterAuth({
        linkType: "magiclink",
        invitedAt: null,
        passwordSet: true,
        role: null,
      }),
      "/admin/login?auth=profile",
    );
  });

  it("ignores unknown link types", () => {
    assert.equal(linkTypeFromParam("not-a-type"), null);
    assert.equal(linkTypeFromParam("recovery"), "recovery");
  });
});
