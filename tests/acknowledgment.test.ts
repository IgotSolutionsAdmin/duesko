import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACKNOWLEDGMENT_FOOTER,
  ACKNOWLEDGMENT_HEADER,
  acknowledgmentFields,
  acknowledgmentMethodLabel,
  forbiddenAcknowledgmentWords,
  renderAcknowledgmentText,
} from "../lib/acknowledgment-copy";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { seed } from "../lib/mock/seed";
import { loadAcknowledgment } from "../lib/acknowledgment-view";

const admin = seed.users.find((user) => user.role === "admin_treasurer");
const cash = seed.payments[0];
if (!admin || !cash) throw new Error("Seed is missing the demo officer payment");

describe("payment acknowledgment", () => {
  it("uses the Legal draft and never prints the forbidden tax words", () => {
    const fields = acknowledgmentFields({
      hoaName: "Villa Esperanza Homeowners Association, Inc.",
      residentName: "Maria Santos",
      unitLabel: "Blk 1 Lot 5",
      payment: cash,
      periodOrDescription: "November 2026 dues",
      officerName: "Ana Reyes",
      officerRole: "admin_treasurer",
    });
    const text = renderAcknowledgmentText(fields);
    assert.match(text, new RegExp(ACKNOWLEDGMENT_HEADER));
    assert.match(text, /Villa Esperanza Homeowners Association, Inc\./);
    assert.match(text, /PHP 1,500\.00/);
    assert.match(text, /Cash received by officer/);
    assert.match(text, /Ana Reyes, Admin treasurer/);
    assert.match(text, /DK-5555555555554555/);
    assert.match(text, new RegExp(ACKNOWLEDGMENT_FOOTER));
    assert.deepEqual(forbiddenAcknowledgmentWords(text), []);
  });

  it("names an uploaded proof as reviewed, not received", () => {
    assert.equal(
      acknowledgmentMethodLabel({ proofPath: "hoa/charge/file.png" }),
      "Online transfer, proof of payment reviewed",
    );
    assert.equal(acknowledgmentMethodLabel({ proofPath: null }), "Cash received by officer");
  });

  it("loads the seed cash payment for the officer", async () => {
    const repository = createMemoryRepository(structuredClone(seed));
    const loaded = await loadAcknowledgment(repository, admin.id, cash.id);
    assert.ok(loaded);
    assert.equal(loaded?.fields.method, "Cash received by officer");
    assert.deepEqual(forbiddenAcknowledgmentWords(renderAcknowledgmentText(loaded!.fields)), []);
  });
});
