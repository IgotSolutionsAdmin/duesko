import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { seed } from "../lib/mock/seed";
import { monthlyDuesCentavos } from "../lib/money";

const repository = createMemoryRepository(seed);
const resident = seed.users.find((user) => user.role === "resident");
const admin = seed.users.find((user) => user.role === "admin_treasurer");

if (!resident?.unitId || !admin) {
  throw new Error("Seed is missing the demo admin treasurer or resident");
}

describe("memory repository", () => {
  it("returns only the resident's own unit for the resident role", async () => {
    const units = await repository.listUnits(resident.id);

    assert.deepEqual(
      units.map((unit) => unit.id),
      [resident.unitId],
    );

    const otherUnitIds = seed.units
      .map((unit) => unit.id)
      .filter((id) => id !== resident.unitId);
    assert.ok(otherUnitIds.length > 0);
    for (const id of otherUnitIds) {
      assert.equal(
        units.some((unit) => unit.id === id),
        false,
      );
    }
  });

  it("returns every unit in the HOA for the admin treasurer", async () => {
    const units = await repository.listUnits(admin.id);
    const hoaUnitIds = seed.units
      .filter((unit) => unit.hoaId === admin.hoaId)
      .map((unit) => unit.id)
      .sort();

    assert.deepEqual(
      units.map((unit) => unit.id).sort(),
      hoaUnitIds,
    );
    assert.ok(hoaUnitIds.length > 1);
  });

  it("hides another unit's charges and payments from the resident", async () => {
    const charges = await repository.listCharges(resident.id);
    const payments = await repository.listPayments(resident.id);
    const links = await repository.listPaymentLinks(resident.id);
    const people = await repository.listUsers(resident.id);

    assert.ok(charges.length > 0);
    assert.ok(charges.every((charge) => charge.unitId === resident.unitId));
    assert.ok(payments.every((payment) => payment.unitId === resident.unitId));
    assert.ok(links.every((link) => link.unitId === resident.unitId));
    assert.deepEqual(
      people.map((person) => person.id),
      [resident.id],
    );

    const foreignPayment = seed.payments.find(
      (payment) => payment.unitId !== resident.unitId,
    );
    assert.ok(foreignPayment);
    assert.equal(
      payments.some((payment) => payment.id === foreignPayment.id),
      false,
    );
  });

  it("returns nothing for an unknown user id", async () => {
    const units = await repository.listUnits("not-a-demo-user");
    assert.deepEqual(units, []);
    assert.equal(await repository.getUser("not-a-demo-user"), null);
  });

  it("computes a per-sqm monthly amount in integer centavos", () => {
    const unit = seed.units.find((row) => row.rateType === "per_sqm");
    assert.ok(unit);
    assert.equal(unit.areaSqm, 48);
    assert.equal(unit.rateCentavos, 3500);
    assert.equal(monthlyDuesCentavos(unit), 168_000);
  });
});
