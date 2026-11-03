export type Role = "admin_treasurer" | "resident";

export type RateType = "flat" | "per_sqm";

export type ChargeKind = "dues" | "special";

export type ChargeStatus = "unpaid" | "paid";

export type PaymentMethod = "cash" | "gcash" | "bank_transfer" | "other";

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface Hoa {
  id: string;
  registeredName: string;
  howToPay: string;
}

export interface Unit {
  id: string;
  hoaId: string;
  label: string;
  areaSqm: number | null;
  rateType: RateType;
  /** Flat: centavos per month. Per sqm: centavos per square metre. */
  rateCentavos: number;
}

/** Fields an admin treasurer sends when adding or editing a unit. */
export interface UnitDraft {
  label: string;
  areaSqm: number | null;
  rateType: RateType;
  rateCentavos: number;
}

export interface AppUser {
  id: string;
  hoaId: string;
  unitId: string | null;
  email: string;
  fullName: string;
  role: Role;
}

export interface Charge {
  id: string;
  hoaId: string;
  unitId: string;
  kind: ChargeKind;
  description: string;
  period: string | null;
  amountCentavos: number;
  dueDate: string;
  status: ChargeStatus;
}

export interface Payment {
  id: string;
  hoaId: string;
  chargeId: string;
  unitId: string;
  method: PaymentMethod;
  amountCentavos: number;
  paidAt: string;
  /** Unused. Online checkout is out of scope. */
  providerPaymentId: string | null;
  referenceNo: string | null;
  hoaReferenceNo: string | null;
  proofPath: string | null;
  status: PaymentStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  note: string | null;
  recordedBy: string | null;
  dueskoReference: string | null;
}

export type BadgeStatus = PaymentStatus | "paid" | "unpaid" | "partial" | "sample";

export type ExportKind = "units" | "charges" | "payments";

export interface ExportAudit {
  id: string;
  hoaId: string;
  exportedBy: string;
  kind: ExportKind;
  month: string | null;
  status: string | null;
  createdAt: string;
}

export interface SeedData {
  hoas: Hoa[];
  units: Unit[];
  users: AppUser[];
  charges: Charge[];
  payments: Payment[];
}
