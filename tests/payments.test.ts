import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { readProofToken, resetProofTokens } from "../lib/mock/proof-tokens";
import { seed } from "../lib/mock/seed";
import {
  hasPendingProof,
  parseProofSubmission,
  sniffProof,
  statusLabel,
} from "../lib/payments";

const resident = seed.users.find((user) => user.role === "resident");
const admin = seed.users.find((user) => user.role === "admin_treasurer");
if (!resident?.unitId || !admin) {
  throw new Error("Seed is missing the demo admin treasurer or resident");
}

const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

const ownCharge = seed.charges.find(
  (charge) => charge.unitId === resident.unitId && charge.status === "unpaid",
);
const otherCharge = seed.charges.find((charge) => charge.unitId !== resident.unitId);
if (!ownCharge || !otherCharge) throw new Error("Seed is missing charges");

function proof(chargeId: string) {
  const parsed = parseProofSubmission({
    chargeId,
    amount: "500.00",
    paidOn: "2026-11-03",
    method: "gcash",
    referenceNo: "GC-100",
    bytes: png,
  });
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.value;
}

describe("payment proofs", () => {
  it("recognises png, jpg, and pdf bytes and rejects other files", () => {
    assert.equal(sniffProof(png), "png");
    assert.equal(sniffProof(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), "jpg");
    assert.equal(sniffProof(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d])), "pdf");
    assert.equal(sniffProof(Uint8Array.from([1, 2, 3, 4])), null);
    assert.equal(
      sniffProof(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
      null,
    );
    const tooBig = parseProofSubmission({
      chargeId: ownCharge.id,
      amount: "1",
      paidOn: "2026-11-03",
      method: "gcash",
      referenceNo: "X",
      bytes: new Uint8Array(5 * 1024 * 1024 + 1),
    });
    assert.equal(tooBig.ok, false);
  });

  it("approves a resident proof and marks the charge paid when the amount is covered", async () => {
    resetProofTokens();
    const repository = createMemoryRepository(structuredClone(seed));
    const full = parseProofSubmission({
      chargeId: ownCharge.id,
      amount: "1500.00",
      paidOn: "2026-11-03",
      method: "gcash",
      referenceNo: "GC-1500",
      bytes: png,
    });
    if (!full.ok) throw new Error(full.message);
    const submitted = await repository.submitProof(resident.id, full.value);
    assert.equal(submitted.ok, true);
    if (!submitted.ok) return;
    assert.equal(submitted.value.status, "pending");

    const hidden = await repository.getProofUrl(admin.id, submitted.value.id);
    assert.equal(hidden.ok, true);
    if (hidden.ok) {
      const token = hidden.value.split("/").pop() ?? "";
      assert.equal(readProofToken(token)?.contentType, "image/png");
    }
    const residentDenied = await repository.getProofUrl(
      resident.id,
      seed.payments[0].id,
    );
    assert.equal(residentDenied.ok, false);

    const approved = await repository.approvePayment(admin.id, submitted.value.id);
    assert.equal(approved.ok, true);
    const charges = await repository.listCharges(resident.id);
    assert.equal(
      charges.find((charge) => charge.id === ownCharge.id)?.status,
      "paid",
    );
    const foreign = await repository.listPayments(resident.id);
    assert.ok(foreign.every((payment) => payment.unitId === resident.unitId));
    assert.equal(
      foreign.some((payment) => payment.id === seed.payments[0].id),
      false,
    );
  });

  it("rejects a proof with a reason and keeps the charge unpaid", async () => {
    const repository = createMemoryRepository(structuredClone(seed));
    const submitted = await repository.submitProof(resident.id, proof(ownCharge.id));
    assert.equal(submitted.ok, true);
    if (!submitted.ok) return;
    const missing = await repository.rejectPayment(admin.id, submitted.value.id, "  ");
    assert.equal(missing.ok, false);
    const rejected = await repository.rejectPayment(
      admin.id,
      submitted.value.id,
      "Reference number does not match",
    );
    assert.equal(rejected.ok, true);
    if (!rejected.ok) return;
    assert.equal(rejected.value.rejectionReason, "Reference number does not match");
    assert.ok(rejected.value.reviewedBy);
    assert.ok(rejected.value.reviewedAt);
    const charges = await repository.listCharges(resident.id);
    assert.equal(
      charges.find((charge) => charge.id === ownCharge.id)?.status,
      "unpaid",
    );
    const mine = await repository.listPayments(resident.id);
    assert.equal(mine.some((payment) => payment.rejectionReason?.includes("does not match")), true);
  });

  it("blocks a second upload while a proof is pending review", async () => {
    const repository = createMemoryRepository(structuredClone(seed));
    const first = await repository.submitProof(resident.id, proof(ownCharge.id));
    assert.equal(first.ok, true);
    const second = await repository.submitProof(resident.id, proof(ownCharge.id));
    assert.equal(second.ok, false);
    if (!second.ok) {
      assert.equal(second.message, "A proof for this charge is already pending review.");
    }
    const mine = await repository.listPayments(resident.id);
    assert.equal(hasPendingProof(mine, ownCharge.id), true);
  });

  it("records an officer cash payment immediately and blocks another unit's proof", async () => {
    const repository = createMemoryRepository(structuredClone(seed));
    const blocked = await repository.submitProof(resident.id, proof(otherCharge.id));
    assert.equal(blocked.ok, false);
    const cash = await repository.recordManualPayment(admin.id, {
      chargeId: otherCharge.id,
      amountCentavos: 168_000,
      paidAt: "2026-11-03T00:00:00.000Z",
      method: "cash",
      hoaReferenceNo: "CR-99",
      note: "Received at the gate",
    });
    assert.equal(cash.ok, true);
    if (!cash.ok) return;
    assert.equal(cash.value.status, "approved");
    assert.equal(cash.value.reviewedBy, admin.id);
    const residentPayments = await repository.listPayments(resident.id);
    assert.equal(
      residentPayments.some((payment) => payment.id === cash.value.id),
      false,
    );
    const residentCannotApprove = await repository.approvePayment(
      resident.id,
      cash.value.id,
    );
    assert.equal(residentCannotApprove.ok, false);
  });
});
