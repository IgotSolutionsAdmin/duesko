import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  destinationAfterAuth,
  linkTypeFromParam,
  passwordSignInDestination,
  roleFromUserRows,
} from "../lib/auth-destination";

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

  it("sends a signed-in officer to the admin portal", () => {
    assert.equal(passwordSignInDestination("admin_treasurer", "admin"), "/admin");
    assert.equal(passwordSignInDestination("resident", "admin"), "/resident");
    assert.equal(passwordSignInDestination(null, "admin"), "/admin/login?auth=profile");
    assert.equal(passwordSignInDestination(null, "resident"), "/resident/login?auth=profile");
  });

  it("reads the role that belongs to the session subject", () => {
    const rows = [
      { id: "bc5e0b99-a2d7-414d-8c92-f359345c14f1", role: "admin_treasurer" },
      { id: "other", role: "resident" },
    ];
    assert.equal(roleFromUserRows(rows, "bc5e0b99-a2d7-414d-8c92-f359345c14f1"), "admin_treasurer");
    assert.equal(roleFromUserRows(rows, "missing"), null);
    assert.equal(roleFromUserRows(rows, null), null);
  });

  it("sends password recovery to set-password then the portal", () => {
    assert.equal(
      destinationAfterAuth({
        linkType: "recovery",
        invitedAt: null,
        passwordSet: true,
        role: "admin_treasurer",
      }),
      "/auth/set-password",
    );
  });

  it("ignores unknown link types", () => {
    assert.equal(linkTypeFromParam("not-a-type"), null);
    assert.equal(linkTypeFromParam("recovery"), "recovery");
  });
});
