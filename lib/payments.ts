import { parseDueDate } from "./charges";
import { parsePesoToCentavos } from "./money";
import type { Result } from "./repository";
import type { Charge, Payment, PaymentMethod, PaymentStatus } from "./types";

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

const RESIDENT_METHODS = ["gcash", "bank_transfer", "other"] as const;
const MANUAL_METHODS = ["cash", "gcash", "bank_transfer", "other"] as const;

export type ResidentMethod = (typeof RESIDENT_METHODS)[number];

export function methodLabel(method: PaymentMethod): string {
  switch (method) {
    case "cash":
      return "Cash";
    case "gcash":
      return "GCash";
    case "bank_transfer":
      return "Bank transfer";
    case "other":
      return "Other";
  }
}

export function approvedCentavos(payments: Payment[], chargeId: string): number {
  return payments
    .filter((payment) => payment.chargeId === chargeId && payment.status === "approved")
    .reduce((sum, payment) => sum + payment.amountCentavos, 0);
}

export function chargeBalanceStatus(
  charge: Charge,
  payments: Payment[],
): "paid" | "unpaid" | "partial" {
  const covered = approvedCentavos(payments, charge.id);
  if (covered >= charge.amountCentavos) return "paid";
  if (covered > 0) return "partial";
  return "unpaid";
}

export function storedChargeStatus(
  charge: Charge,
  payments: Payment[],
): "paid" | "unpaid" {
  return approvedCentavos(payments, charge.id) >= charge.amountCentavos
    ? "paid"
    : "unpaid";
}

export function sniffImage(bytes: Uint8Array): "png" | "jpg" | "webp" | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function imageContentType(ext: "png" | "jpg" | "webp"): string {
  if (ext === "png") return "image/png";
  if (ext === "jpg") return "image/jpeg";
  return "image/webp";
}

export function proofObjectPath(hoaId: string, chargeId: string, ext: "png" | "jpg" | "webp"): string {
  return `${hoaId}/${chargeId}/${crypto.randomUUID()}.${ext}`;
}

export interface ProofDraft {
  chargeId: string;
  amountCentavos: number;
  paidAt: string;
  method: ResidentMethod;
  referenceNo: string;
  bytes: Uint8Array;
  contentType: string;
  extension: "png" | "jpg" | "webp";
}

export function parseProofSubmission(input: {
  chargeId: string;
  amount: string;
  paidOn: string;
  method: string;
  referenceNo: string;
  bytes: Uint8Array;
}): Result<ProofDraft> {
  const chargeId = input.chargeId.trim();
  if (!chargeId) return { ok: false, message: "Choose one of your charges." };
  const amountCentavos = parsePesoToCentavos(input.amount);
  if (amountCentavos === null || amountCentavos <= 0) {
    return { ok: false, message: "Enter the amount in pesos, such as 1500.00." };
  }
  const paidOn = parseDueDate(input.paidOn);
  if (!paidOn.ok) return { ok: false, message: "Choose the date you paid." };
  if (!RESIDENT_METHODS.includes(input.method as ResidentMethod)) {
    return { ok: false, message: "Choose GCash, bank transfer, or other." };
  }
  const referenceNo = input.referenceNo.trim().replace(/\s+/g, " ");
  if (!referenceNo) return { ok: false, message: "Reference number is required." };
  if (referenceNo.length > 80) {
    return { ok: false, message: "Reference number is too long." };
  }
  if (input.bytes.byteLength === 0) {
    return { ok: false, message: "Upload a photo of the payment." };
  }
  if (input.bytes.byteLength > PROOF_MAX_BYTES) {
    return { ok: false, message: "The photo must be 5 MB or smaller." };
  }
  const extension = sniffImage(input.bytes);
  if (!extension) {
    return { ok: false, message: "Upload a PNG, JPG, or WebP photo." };
  }
  return {
    ok: true,
    value: {
      chargeId,
      amountCentavos,
      paidAt: `${paidOn.value}T00:00:00.000Z`,
      method: input.method as ResidentMethod,
      referenceNo,
      bytes: input.bytes,
      contentType: imageContentType(extension),
      extension,
    },
  };
}

export interface ManualDraft {
  chargeId: string;
  amountCentavos: number;
  paidAt: string;
  method: PaymentMethod;
  hoaReferenceNo: string | null;
  note: string | null;
}

export function parseManualPayment(input: {
  chargeId: string;
  amount: string;
  paidOn: string;
  method: string;
  hoaReferenceNo: string;
  note: string;
}): Result<ManualDraft> {
  const chargeId = input.chargeId.trim();
  if (!chargeId) return { ok: false, message: "Choose a unit charge." };
  const amountCentavos = parsePesoToCentavos(input.amount);
  if (amountCentavos === null || amountCentavos <= 0) {
    return { ok: false, message: "Enter the amount in pesos, such as 750.00." };
  }
  const paidOn = parseDueDate(input.paidOn);
  if (!paidOn.ok) return { ok: false, message: "Choose the date received." };
  if (!MANUAL_METHODS.includes(input.method as PaymentMethod)) {
    return { ok: false, message: "Choose how the payment was received." };
  }
  const hoaReferenceNo = input.hoaReferenceNo.trim().replace(/\s+/g, " ");
  if (hoaReferenceNo.length > 80) {
    return { ok: false, message: "HOA reference number is too long." };
  }
  const note = input.note.trim().replace(/\s+/g, " ");
  if (note.length > 200) return { ok: false, message: "Note is too long." };
  return {
    ok: true,
    value: {
      chargeId,
      amountCentavos,
      paidAt: `${paidOn.value}T00:00:00.000Z`,
      method: input.method as PaymentMethod,
      hoaReferenceNo: hoaReferenceNo || null,
      note: note || null,
    },
  };
}

export function statusLabel(
  status: PaymentStatus | "paid" | "unpaid" | "partial",
): string {
  switch (status) {
    case "paid":
    case "approved":
      return "Paid";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
    case "partial":
      return "Partial";
    case "unpaid":
      return "Unpaid";
  }
}
