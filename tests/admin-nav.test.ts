import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_NAV_LINKS, isAdminNavActive } from "../lib/admin-nav";

describe("admin portal nav", () => {
  it("lists the officer destinations in order", () => {
    assert.deepEqual(
      ADMIN_NAV_LINKS.map((link) => link.label),
      ["Dashboard", "Units", "Charges", "Payments", "Export"],
    );
    assert.deepEqual(
      ADMIN_NAV_LINKS.map((link) => link.href),
      ["/admin", "/admin/units", "/admin/charges", "/admin/payments", "/admin/export"],
    );
  });

  it("highlights the dashboard only on the dashboard", () => {
    assert.equal(isAdminNavActive("/admin", "/admin"), true);
    assert.equal(isAdminNavActive("/admin/units", "/admin"), false);
    assert.equal(isAdminNavActive("/admin/payments", "/admin"), false);
  });

  it("highlights a section on nested officer pages", () => {
    assert.equal(isAdminNavActive("/admin/units/new", "/admin/units"), true);
    assert.equal(isAdminNavActive("/admin/payments/cash", "/admin/payments"), true);
    assert.equal(isAdminNavActive("/admin/charges/new", "/admin/charges"), true);
    assert.equal(isAdminNavActive("/admin/export", "/admin/export"), true);
    assert.equal(isAdminNavActive("/admin/units", "/admin/charges"), false);
  });
});
