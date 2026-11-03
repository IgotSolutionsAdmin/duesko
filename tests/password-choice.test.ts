import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { passwordChoiceError } from "../lib/password-choice";

describe("password choice", () => {
  it("requires 8 characters and a matching confirmation", () => {
    assert.equal(passwordChoiceError("short", "short"), "short");
    assert.equal(passwordChoiceError("long-enough", "different"), "mismatch");
    assert.equal(passwordChoiceError("long-enough", "long-enough"), null);
  });
});
