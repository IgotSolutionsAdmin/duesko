import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { csvDocument, csvField } from "../lib/csv";
import {
  chargesCsv,
  exportFileName,
  filterPayments,
  paymentsCsv,
  unitsCsv,
} from "../lib/export-data";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { seed } from "../lib/mock/seed";

const admin = seed.users.find((user) => user.role === "admin_treasurer");
const resident = seed.users.find((user) => user.role === "resident");
if (!admin || !resident) throw new Error("Seed is missing demo users");

describe("csv export", () => {
  it("escapes quotes, commas, and line breaks", () => {
    assert.equal(csvField('He said "hi"'), '"He said ""hi"""');
    assert.equal(csvField("a,b"), '"a,b"');
    const doc = csvDocument(["name", "note"], [["Villa", "line\nbreak"]]);
    assert.ok(doc.startsWith("\uFEFF"));
    assert.match(doc, /"line\nbreak"/);
  });

  it("writes pesos, proof status, and an audit row for the officer", async () => {
    const repository = createMemoryRepository(structuredClone(seed));
    const [units, charges, payments, people] = await Promise.all([
      repository.listUnits(admin.id),
      repository.listCharges(admin.id),
      repository.listPayments(admin.id),
      repository.listUsers(admin.id),
    ]);
    const unitsFile = unitsCsv(units);
    assert.match(unitsFile, /Blk 1 Lot 4/);
    assert.match(unitsFile, /1500\.00/);

    const chargesFile = chargesCsv(charges, units, { month: "2026-11", status: null });
    assert.match(chargesFile, /November 2026 dues/);

    const paymentsFile = paymentsCsv(payments, charges, units, people, {
      month: "2026-11",
      status: "approved",
    });
    assert.match(paymentsFile, /proof_status/);
    assert.match(paymentsFile, /approved/);
    assert.match(paymentsFile, /1500\.00/);
    assert.match(paymentsFile, /Ana Reyes/);
    assert.match(paymentsFile, /DK-5555555555554555/);
    assert.equal(filterPayments(payments, { month: "2026-12", status: null }).length, 0);

    const audit = await repository.recordExport(admin.id, {
      kind: "payments",
      month: "2026-11",
      status: "approved",
    });
    assert.equal(audit.ok, true);
    const denied = await repository.recordExport(resident.id, {
      kind: "payments",
      month: null,
      status: null,
    });
    assert.equal(denied.ok, false);
    assert.equal(exportFileName("payments", { month: "2026-11", status: "approved" }), "duesko-payments-2026-11-approved.csv");
  });
});
