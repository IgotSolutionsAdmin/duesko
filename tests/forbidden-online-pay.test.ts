import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scanProductCopyForOnlinePay } from "../lib/scan-product-copy";

describe("forbidden online-pay wording", () => {
  it("does not appear in UI, docs, lib, or tests", () => {
    const violations = scanProductCopyForOnlinePay();
    assert.deepEqual(
      violations,
      [],
      violations.map((v) => `${v.file}: ${v.phrase}`).join("\n") || undefined,
    );
  });
});
