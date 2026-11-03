import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportMonthOptions, formatExportMonthLabel } from "../lib/export-months";
import type { Charge, Payment } from "../lib/types";

describe("export month options", () => {
  it("collects distinct months from charges and payments", () => {
    const charges = [
      { period: "2026-11", dueDate: "2026-11-05" },
      { period: null, dueDate: "2026-12-01" },
    ] as Charge[];
    const payments = [{ paidAt: "2026-10-15T00:00:00.000Z" }] as Payment[];
    assert.deepEqual(exportMonthOptions(charges, payments), ["2026-12", "2026-11", "2026-10"]);
  });

  it("labels months for the export dropdown", () => {
    assert.equal(formatExportMonthLabel("2026-11"), "November 2026");
  });
});
