import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LIST_COPY, listViewState } from "../lib/list-states";
import {
  canReupload,
  firstProofError,
  proofFieldErrors,
  STATUS_BADGE_COLORS,
  statusLabel,
} from "../lib/payments";
import type { Payment } from "../lib/types";

describe("day 6 status labels and list states", () => {
  it("uses Pending review, Approved, Rejected, and Sample labels", () => {
    assert.equal(statusLabel("pending"), "Pending review");
    assert.equal(statusLabel("approved"), "Approved");
    assert.equal(statusLabel("rejected"), "Rejected");
    assert.equal(statusLabel("sample"), "Sample");
    assert.equal(statusLabel("paid"), "Paid");
    assert.equal(STATUS_BADGE_COLORS.pending, "#FFB547");
    assert.equal(STATUS_BADGE_COLORS.approved, "#0E7C7B");
    assert.equal(STATUS_BADGE_COLORS.sampleBg, "#F4FBFA");
    assert.equal(STATUS_BADGE_COLORS.sampleFg, "#0F2A33");
  });

  it("shows inline field errors and keeps a selected file invalid until fixed", () => {
    const errors = proofFieldErrors({
      chargeId: "",
      amount: "",
      paidOn: "",
      method: "gcash",
      referenceNo: "",
      bytes: new Uint8Array(),
      fileName: "receipt.webp",
      mimeType: "image/webp",
    });
    assert.equal(errors.chargeId, "Choose one of your charges.");
    assert.equal(errors.amount, "Enter the amount in pesos, such as 1500.00.");
    assert.equal(errors.paidOn, "Choose the date you paid.");
    assert.equal(errors.referenceNo, "Reference number is required.");
    assert.equal(errors.proof, "Upload a JPG, PNG, or PDF file.");
    assert.ok(firstProofError(errors));
  });

  it("allows re-upload only after reject", () => {
    const rejected = { status: "rejected" } as Payment;
    const pending = { status: "pending" } as Payment;
    assert.equal(canReupload(rejected), true);
    assert.equal(canReupload(pending), false);
  });

  it("classifies empty, loading, and error list states", () => {
    assert.equal(listViewState({ loading: true, count: 0 }), "loading");
    assert.equal(listViewState({ error: LIST_COPY.loadError, count: 0 }), "error");
    assert.equal(listViewState({ count: 0 }), "empty");
    assert.equal(listViewState({ count: 2 }), "ready");
    assert.ok(LIST_COPY.unitsEmpty);
    assert.ok(LIST_COPY.proofsEmpty);
  });
});
