import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { seed } from "../lib/mock/seed";
import { monthlyDuesCentavos } from "../lib/money";

const repository = createMemoryRepository(seed);
const resident = seed.users.find((user) => user.role === "resident");
const admin = seed.users.find((user) => user.role === "admin_treasurer");

if (!resident || !resident.unitId || !admin) {
  throw new Error("Seed is missing the demo admin treasurer or resident");
}

const residentUnitId = resident.unitId;

describe("memory repository", () => {
  it("returns only the resident's own unit for the resident role", async () => {
    const units = await repository.listUnits(resident.id);

    assert.deepEqual(
      units.map((unit) => unit.id),
      [residentUnitId],
    );

    const otherUnitIds = seed.units
      .map((unit) => unit.id)
      .filter((id) => id !== residentUnitId);
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
    const people = await repository.listUsers(resident.id);

    assert.ok(charges.length > 0);
    assert.ok(charges.every((charge) => charge.unitId === residentUnitId));
    assert.ok(payments.every((payment) => payment.unitId === residentUnitId));
    assert.deepEqual(
      people.map((person) => person.id),
      [resident.id],
    );

    const foreignPayment = seed.payments.find(
      (payment) => payment.unitId !== residentUnitId,
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

describe("hoa setup", () => {
  function freshRepository() {
    return createMemoryRepository(structuredClone(seed));
  }

  it("requires a registered name and blocks a resident from changing it", async () => {
    const hoaRepository = freshRepository();
    const blank = await hoaRepository.updateRegisteredName(admin.id, "   ");
    assert.equal(blank.ok, false);
    if (!blank.ok) {
      assert.equal(blank.message, "Registered name is required.");
    }

    const denied = await hoaRepository.updateRegisteredName(
      resident.id,
      "Other Name",
    );
    assert.equal(denied.ok, false);

    const unchanged = await hoaRepository.getHoa(admin.id);
    assert.equal(
      unchanged?.registeredName,
      "Villa Esperanza Homeowners Association, Inc.",
    );

    const saved = await hoaRepository.updateRegisteredName(
      admin.id,
      "Sampaguita Residences Homeowners Association, Inc.",
    );
    assert.equal(saved.ok, true);
    if (saved.ok) {
      assert.equal(
        saved.value.registeredName,
        "Sampaguita Residences Homeowners Association, Inc.",
      );
    }
  });

  it("still returns only the resident's own unit after the admin adds and edits units", async () => {
    const hoaRepository = freshRepository();
    const flat = await hoaRepository.createUnit(admin.id, {
      label: "Blk 9 Lot 9",
      rateType: "flat",
      rateCentavos: 250_000,
      areaSqm: null,
    });
    assert.equal(flat.ok, true);

    const perSqm = await hoaRepository.createUnit(admin.id, {
      label: "Blk 9 Lot 10",
      rateType: "per_sqm",
      rateCentavos: 4_000,
      areaSqm: 32.5,
    });
    assert.equal(perSqm.ok, true);
    if (perSqm.ok) {
      assert.equal(monthlyDuesCentavos(perSqm.value), 130_000);
    }

    const edited = await hoaRepository.updateUnit(admin.id, residentUnitId, {
      label: "Blk 1 Lot 4",
      rateType: "per_sqm",
      rateCentavos: 2_000,
      areaSqm: 30,
    });
    assert.equal(edited.ok, true);
    if (edited.ok) {
      assert.equal(monthlyDuesCentavos(edited.value), 60_000);
    }

    const residentDenied = await hoaRepository.createUnit(resident.id, {
      label: "Blk 9 Lot 11",
      rateType: "flat",
      rateCentavos: 100,
      areaSqm: null,
    });
    assert.equal(residentDenied.ok, false);

    const visible = await hoaRepository.listUnits(resident.id);
    assert.deepEqual(
      visible.map((unit) => unit.id),
      [residentUnitId],
    );
    assert.equal(visible[0]?.rateType, "per_sqm");
    assert.equal(
      visible.some(
        (unit) => unit.label === "Blk 9 Lot 9" || unit.label === "Blk 9 Lot 10",
      ),
      false,
    );

    const adminUnits = await hoaRepository.listUnits(admin.id);
    assert.equal(
      adminUnits.some((unit) => unit.label === "Blk 9 Lot 9"),
      true,
    );
    assert.equal(
      adminUnits.some((unit) => unit.label === "Blk 9 Lot 11"),
      false,
    );
  });
});
