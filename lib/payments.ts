import { parseDueDate } from "./charges";
import { parsePesoToCentavos } from "./money";
import type { Result } from "./repository";
import type { Charge, Payment, PaymentMethod, PaymentStatus } from "./types";

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

const RESIDENT_METHODS = ["gcash", "bank_transfer", "other"] as const;
const MANUAL_METHODS = ["cash", "gcash", "bank_transfer", "other"] as const;

export type ResidentMethod = (typeof RESIDENT_METHODS)[number];
export type ProofExtension = "png" | "jpg" | "pdf";

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

export function hasPendingProof(payments: Payment[], chargeId: string): boolean {
  return payments.some(
    (payment) => payment.chargeId === chargeId && payment.status === "pending",
  );
}

export function latestProof(
  payments: Payment[],
  chargeId?: string,
): Payment | undefined {
  return payments
    .filter((payment) => (chargeId ? payment.chargeId === chargeId : true))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
}

export function canReupload(payment: Payment): boolean {
  return payment.status === "rejected";
}

export function sniffProof(bytes: Uint8Array): ProofExtension | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "pdf";
  }
  return null;
}

/** @deprecated Use sniffProof. Kept for older tests that only checked images. */
export function sniffImage(bytes: Uint8Array): "png" | "jpg" | null {
  const kind = sniffProof(bytes);
  return kind === "pdf" ? null : kind;
}

export function proofContentType(ext: ProofExtension): string {
  if (ext === "png") return "image/png";
  if (ext === "jpg") return "image/jpeg";
  return "application/pdf";
}

export function proofObjectPath(hoaId: string, chargeId: string, ext: ProofExtension): string {
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
  extension: ProofExtension;
}

export interface ProofFieldErrors {
  chargeId?: string;
  amount?: string;
  paidOn?: string;
  method?: string;
  referenceNo?: string;
  proof?: string;
}

const PROOF_TYPE_MESSAGE = "Upload a JPG, PNG, or PDF file.";
const PROOF_SIZE_MESSAGE = "The file must be 5 MB or smaller.";

export function proofFileError(input: {
  byteLength: number;
  bytes?: Uint8Array;
  fileName?: string;
  mimeType?: string;
}): string | undefined {
  if (input.byteLength === 0) return PROOF_TYPE_MESSAGE;
  if (input.byteLength > PROOF_MAX_BYTES) return PROOF_SIZE_MESSAGE;
  if (input.bytes && input.bytes.byteLength > 0) {
    if (!sniffProof(input.bytes)) return PROOF_TYPE_MESSAGE;
    return undefined;
  }
  const name = (input.fileName ?? "").toLowerCase();
  const mime = (input.mimeType ?? "").toLowerCase();
  const allowedName = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".pdf");
  const allowedMime =
    mime === "image/jpeg" || mime === "image/png" || mime === "application/pdf";
  if (name || mime) {
    if (!allowedName && !allowedMime) return PROOF_TYPE_MESSAGE;
  }
  return undefined;
}

export function proofFieldErrors(input: {
  chargeId: string;
  amount: string;
  paidOn: string;
  method: string;
  referenceNo: string;
  bytes: Uint8Array;
  fileName?: string;
  mimeType?: string;
}): ProofFieldErrors {
  const errors: ProofFieldErrors = {};
  if (!input.chargeId.trim()) errors.chargeId = "Choose one of your charges.";
  const amountCentavos = parsePesoToCentavos(input.amount);
  if (amountCentavos === null || amountCentavos <= 0) {
    errors.amount = "Enter the amount in pesos, such as 1500.00.";
  }
  const paidOn = parseDueDate(input.paidOn);
  if (!paidOn.ok) errors.paidOn = "Choose the date you paid.";
  if (!RESIDENT_METHODS.includes(input.method as ResidentMethod)) {
    errors.method = "Choose GCash, bank transfer, or other.";
  }
  const referenceNo = input.referenceNo.trim().replace(/\s+/g, " ");
  if (!referenceNo) errors.referenceNo = "Reference number is required.";
  else if (referenceNo.length > 80) errors.referenceNo = "Reference number is too long.";
  const fileError = proofFileError({
    byteLength: input.bytes.byteLength,
    bytes: input.bytes,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });
  if (fileError) errors.proof = fileError;
  return errors;
}

export function firstProofError(errors: ProofFieldErrors): string | undefined {
  return (
    errors.chargeId ??
    errors.amount ??
    errors.paidOn ??
    errors.method ??
    errors.referenceNo ??
    errors.proof
  );
}

export function parseProofSubmission(input: {
  chargeId: string;
  amount: string;
  paidOn: string;
  method: string;
  referenceNo: string;
  bytes: Uint8Array;
  fileName?: string;
  mimeType?: string;
}): Result<ProofDraft> {
  const errors = proofFieldErrors(input);
  const message = firstProofError(errors);
  if (message) return { ok: false, message };
  const paidOn = parseDueDate(input.paidOn);
  if (!paidOn.ok) return paidOn;
  const extension = sniffProof(input.bytes);
  if (!extension) return { ok: false, message: PROOF_TYPE_MESSAGE };
  return {
    ok: true,
    value: {
      chargeId: input.chargeId.trim(),
      amountCentavos: parsePesoToCentavos(input.amount) ?? 0,
      paidAt: `${paidOn.value}T00:00:00.000Z`,
      method: input.method as ResidentMethod,
      referenceNo: input.referenceNo.trim().replace(/\s+/g, " "),
      bytes: input.bytes,
      contentType: proofContentType(extension),
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
  status: PaymentStatus | "paid" | "unpaid" | "partial" | "sample",
): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "approved":
      return "Paid";
    case "pending":
      return "Pending review";
    case "rejected":
      return "Rejected";
    case "partial":
      return "Partial";
    case "unpaid":
      return "Unpaid";
    case "sample":
      return "Sample";
  }
}

export const STATUS_BADGE_COLORS = {
  pending: "#FFB547",
  approved: "#0E7C7B",
  rejected: "#DC2626",
  unpaidBg: "transparent",
  unpaidFg: "#0F2A33",
  sampleBg: "#F4FBFA",
  sampleFg: "#0F2A33",
} as const;

export function rejectReasonError(reason: string): string | undefined {
  if (!reason.trim()) return "A reason is required.";
  return undefined;
}
