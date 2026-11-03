import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCentavos,
  monthlyDuesCentavos,
  parsePesoToCentavos,
} from "../lib/money";
import { parseRegisteredName } from "../lib/registered-name";
import { parseUnitForm } from "../lib/unit-form";

describe("monthly dues", () => {
  it("returns a flat monthly amount in centavos", () => {
    assert.equal(
      monthlyDuesCentavos({
        rateType: "flat",
        rateCentavos: 150_000,
        areaSqm: 48,
      }),
      150_000,
    );
  });

  it("multiplies a per-sqm rate by floor area and rounds to the nearest centavo", () => {
    assert.equal(
      monthlyDuesCentavos({
        rateType: "per_sqm",
        rateCentavos: 3_500,
        areaSqm: 48,
      }),
      168_000,
    );
    assert.equal(
      monthlyDuesCentavos({
        rateType: "per_sqm",
        rateCentavos: 1_001,
        areaSqm: 10.5,
      }),
      10_511,
    );
  });

  it("treats a missing per-sqm area as zero centavos", () => {
    assert.equal(
      monthlyDuesCentavos({
        rateType: "per_sqm",
        rateCentavos: 3_500,
        areaSqm: null,
      }),
      0,
    );
  });

  it("shows centavos as Philippine pesos", () => {
    assert.equal(formatCentavos(150_000), "₱1,500.00");
    assert.equal(formatCentavos(275_050), "₱2,750.50");
  });
});

describe("peso and form parsing", () => {
  it("parses peso text into integer centavos", () => {
    assert.equal(parsePesoToCentavos("1500"), 150_000);
    assert.equal(parsePesoToCentavos("1,500.50"), 150_050);
    assert.equal(parsePesoToCentavos("₱35.00"), 3_500);
    assert.equal(parsePesoToCentavos(" 40 "), 4_000);
    assert.equal(parsePesoToCentavos(""), null);
    assert.equal(parsePesoToCentavos("12.345"), null);
    assert.equal(parsePesoToCentavos("-5"), null);
  });

  it("requires a registered name", () => {
    const blank = parseRegisteredName("   ");
    assert.equal(blank.ok, false);
    if (!blank.ok) {
      assert.equal(blank.message, "Registered name is required.");
    }

    const named = parseRegisteredName("  Sampaguita   Residences  ");
    assert.equal(named.ok, true);
    if (named.ok) assert.equal(named.value, "Sampaguita Residences");
  });

  it("builds a flat unit or a per-sqm unit from the form", () => {
    const flat = new FormData();
    flat.set("label", " Blk 3 Lot 2 ");
    flat.set("rateType", "flat");
    flat.set("amount", "2,500");
    flat.set("areaSqm", "40");
    const flatUnit = parseUnitForm(flat);
    assert.equal(flatUnit.ok, true);
    if (flatUnit.ok) {
      assert.deepEqual(flatUnit.value, {
        label: "Blk 3 Lot 2",
        rateType: "flat",
        rateCentavos: 250_000,
        areaSqm: null,
      });
    }

    const missingArea = new FormData();
    missingArea.set("label", "Blk 3 Lot 3");
    missingArea.set("rateType", "per_sqm");
    missingArea.set("amount", "40");
    const rejected = parseUnitForm(missingArea);
    assert.equal(rejected.ok, false);
    if (!rejected.ok) {
      assert.equal(rejected.message, "Enter the floor area in square metres.");
    }

    const perSqm = new FormData();
    perSqm.set("label", "Blk 3 Lot 3");
    perSqm.set("rateType", "per_sqm");
    perSqm.set("amount", "40");
    perSqm.set("areaSqm", "32.5");
    const parsed = parseUnitForm(perSqm);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.rateCentavos, 4_000);
      assert.equal(parsed.value.areaSqm, 32.5);
      assert.equal(
        monthlyDuesCentavos({
          rateType: parsed.value.rateType,
          rateCentavos: parsed.value.rateCentavos,
          areaSqm: parsed.value.areaSqm,
        }),
        130_000,
      );
    }
  });
});
