import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { duesDescription, parseDueDate, parsePeriod } from "../lib/charges";
import { parseMonthlyForm, parseSpecialForm } from "../lib/charge-form";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { seed } from "../lib/mock/seed";
import { monthlyDuesCentavos } from "../lib/money";

const resident = seed.users.find((user) => user.role === "resident");
const admin = seed.users.find((user) => user.role === "admin_treasurer");
if (!resident?.unitId || !admin) {
  throw new Error("Seed is missing the demo admin treasurer or resident");
}
const residentUnitId = resident.unitId;
const lot5 = seed.units.find((unit) => unit.label === "Blk 1 Lot 5");
const perSqm = seed.units.find((unit) => unit.rateType === "per_sqm");
if (!lot5 || !perSqm) throw new Error("Seed is missing a flat unit or a per-sqm unit");

describe("charge amounts", () => {
  it("names a monthly period in the charge description", () => {
    assert.equal(duesDescription("2026-12"), "December 2026 dues");
    assert.equal(parsePeriod("2026-12").ok, true);
    assert.equal(parsePeriod("2026-13").ok, false);
    assert.equal(parseDueDate("2026-12-05").ok, true);
    assert.equal(parseDueDate("2026-02-31").ok, false);
  });

  it("uses each unit's flat or per-sqm dues for the monthly charge", () => {
    const flat = seed.units.find((unit) => unit.id === residentUnitId);
    assert.ok(flat);
    assert.equal(monthlyDuesCentavos(flat), 150_000);
    assert.equal(monthlyDuesCentavos(perSqm), 168_000);
  });
});

describe("charge access", () => {
  it("creates monthly dues and a selected special assessment without showing other units to the resident", async () => {
    const repository = createMemoryRepository(structuredClone(seed));
    const created = await repository.createMonthlyDues(admin.id, {
      period: "2026-12",
      dueDate: "2026-12-05",
      description: "",
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.value.length, seed.units.length);
    assert.equal(
      created.value.find((charge) => charge.unitId === residentUnitId)?.amountCentavos,
      150_000,
    );
    assert.equal(
      created.value.find((charge) => charge.unitId === perSqm.id)?.amountCentavos,
      168_000,
    );
    assert.ok(
      created.value.every(
        (charge) =>
          charge.kind === "dues" &&
          charge.status === "unpaid" &&
          charge.description === "December 2026 dues" &&
          charge.amountCentavos ===
            monthlyDuesCentavos(
              seed.units.find((unit) => unit.id === charge.unitId)!,
            ),
      ),
    );

    const special = await repository.createSpecialAssessment(admin.id, {
      description: "Christmas lights",
      amountCentavos: 50_000,
      dueDate: "2026-12-20",
      unitIds: [lot5.id],
    });
    assert.equal(special.ok, true);

    const visible = await repository.listCharges(resident.id);
    assert.ok(visible.every((charge) => charge.unitId === residentUnitId));
    assert.equal(
      visible.filter((charge) => charge.description === "December 2026 dues").length,
      1,
    );
    assert.equal(
      visible.some((charge) => charge.description === "Christmas lights"),
      false,
    );

    const adminCharges = await repository.listCharges(admin.id);
    assert.equal(
      adminCharges.filter((charge) => charge.description === "Christmas lights").length,
      1,
    );
    assert.equal(
      adminCharges.find((charge) => charge.description === "Christmas lights")?.unitId,
      lot5.id,
    );

    const denied = await repository.createSpecialAssessment(resident.id, {
      description: "Should fail",
      amountCentavos: 100,
      dueDate: "2026-12-20",
      unitIds: [residentUnitId],
    });
    assert.equal(denied.ok, false);

    const duplicate = await repository.createMonthlyDues(admin.id, {
      period: "2026-12",
      dueDate: "2026-12-05",
      description: "",
    });
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) {
      assert.equal(duplicate.message, "Monthly dues for that period already exist.");
    }
  });

  it("rejects a special assessment with no units", () => {
    const form = new FormData();
    form.set("description", "Gate paint");
    form.set("amount", "500");
    form.set("dueDate", "2026-12-20");
    form.set("scope", "selected");
    const parsed = parseSpecialForm(form);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.message, "Choose at least one unit.");

    const monthly = new FormData();
    monthly.set("period", "2026-12");
    monthly.set("dueDate", "2026-12-05");
    const parsedMonthly = parseMonthlyForm(monthly);
    assert.equal(parsedMonthly.ok, true);
    if (parsedMonthly.ok) assert.equal(parsedMonthly.value.description, "");
  });
});
