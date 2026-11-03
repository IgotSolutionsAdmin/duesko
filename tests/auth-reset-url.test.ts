import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyAuthNextDestination,
  passwordResetRedirectTo,
  safeAuthNext,
} from "../lib/auth-reset-url";

describe("password reset redirect", () => {
  it("builds the callback URL with a set-password next param", () => {
    assert.equal(
      passwordResetRedirectTo("https://duesko.vercel.app"),
      "https://duesko.vercel.app/auth/callback?next=%2Fauth%2Fset-password",
    );
  });

  it("only allows the set-password next path", () => {
    assert.equal(safeAuthNext("/auth/set-password"), "/auth/set-password");
    assert.equal(safeAuthNext("/admin"), null);
    assert.equal(safeAuthNext("https://evil.example"), null);
  });

  it("keeps recovery on set-password when the link asked for it", () => {
    assert.equal(
      applyAuthNextDestination("/auth/set-password", "/auth/set-password"),
      "/auth/set-password",
    );
    assert.equal(applyAuthNextDestination("/admin", "/auth/set-password"), "/admin");
  });
});
