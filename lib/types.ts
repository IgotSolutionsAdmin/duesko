export type Role = "admin_treasurer" | "resident";

export type RateType = "flat" | "per_sqm";

export type ChargeKind = "dues" | "special";

export type ChargeStatus = "unpaid" | "paid";

export type PaymentMethod = "paymongo" | "cash";

export interface Hoa {
  id: string;
  registeredName: string;
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
  providerPaymentId: string | null;
  hoaReferenceNo: string | null;
  recordedBy: string | null;
}

export interface PaymentLink {
  id: string;
  hoaId: string;
  chargeId: string;
  unitId: string;
  token: string;
}

export interface SeedData {
  hoas: Hoa[];
  units: Unit[];
  users: AppUser[];
  charges: Charge[];
  payments: Payment[];
  paymentLinks: PaymentLink[];
}
