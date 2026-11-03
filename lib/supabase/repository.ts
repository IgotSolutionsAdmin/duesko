import type { SupabaseClient } from "@supabase/supabase-js";
import {
  duesDescription,
  monthlyAmountCentavos,
  parseDueDate,
  parsePeriod,
} from "../charges";
import { proofObjectPath, storedChargeStatus } from "../payments";
import type { ManualDraft, ProofDraft } from "../payments";
import type { DuesRepository, Failure, Result } from "../repository";
import type {
  AppUser,
  Charge,
  ChargeKind,
  ChargeStatus,
  Payment,
  PaymentMethod,
  RateType,
  Role,
  Unit,
  UnitDraft,
} from "../types";

type UnitRow = {
  id: string;
  hoa_id: string;
  label: string;
  area_sqm: number | string | null;
  rate_type: RateType;
  rate_centavos: number;
};

type UserRow = {
  id: string;
  hoa_id: string;
  unit_id: string | null;
  email: string;
  full_name: string;
  role: Role;
};

type ChargeRow = {
  id: string;
  hoa_id: string;
  unit_id: string;
  kind: ChargeKind;
  description: string;
  period: string | null;
  amount_centavos: number;
  due_date: string;
  status: ChargeStatus;
};

function toUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    hoaId: row.hoa_id,
    label: row.label,
    areaSqm: row.area_sqm === null ? null : Number(row.area_sqm),
    rateType: row.rate_type,
    rateCentavos: row.rate_centavos,
  };
}

function toUser(row: UserRow): AppUser {
  return {
    id: row.id,
    hoaId: row.hoa_id,
    unitId: row.unit_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };
}

function toCharge(row: ChargeRow): Charge {
  return {
    id: row.id,
    hoaId: row.hoa_id,
    unitId: row.unit_id,
    kind: row.kind,
    description: row.description,
    period: row.period,
    amountCentavos: row.amount_centavos,
    dueDate: row.due_date,
    status: row.status,
  };
}

function denied(): Failure {
  return { ok: false, message: "Only the admin treasurer can change this." };
}

/**
 * DuesRepository over Supabase. The client must be the signed-in user's
 * session so row level security, not the service role, decides each row.
 * `sessionUserId` is auth.users.id and must equal public.users.id.
 */
export function createSupabaseRepository(
  client: SupabaseClient,
  sessionUserId: string,
): DuesRepository {
  let actorPromise: Promise<AppUser | null> | undefined;

  function actor(): Promise<AppUser | null> {
    actorPromise ??= loadActor();
    return actorPromise;
  }

  async function loadActor(): Promise<AppUser | null> {
    const { data, error } = await client
      .from("users")
      .select("id, hoa_id, unit_id, email, full_name, role")
      .eq("id", sessionUserId)
      .maybeSingle();
    if (error || !data) return null;
    return toUser(data as UserRow);
  }

  async function requireAdmin(): Promise<AppUser | Failure> {
    const user = await actor();
    if (!user) return { ok: false, message: "Sign in is required." };
    if (user.role !== "admin_treasurer") return denied();
    return user;
  }

  function isFailure(value: AppUser | Failure): value is Failure {
    return "ok" in value;
  }

  function sameUser(userId: string): boolean {
    return userId === sessionUserId;
  }

  async function listVisibleUnits(): Promise<Unit[]> {
    const { data, error } = await client
      .from("units")
      .select("id, hoa_id, label, area_sqm, rate_type, rate_centavos")
      .order("label");
    if (error || !data) return [];
    return (data as UnitRow[]).map(toUnit);
  }

  return {
    async getUser(userId) {
      if (!sameUser(userId)) {
        const admin = await actor();
        if (!admin || admin.role !== "admin_treasurer") return null;
      }
      const { data, error } = await client
        .from("users")
        .select("id, hoa_id, unit_id, email, full_name, role")
        .eq("id", userId)
        .maybeSingle();
      if (error || !data) return null;
      return toUser(data as UserRow);
    },

    async getHoa(userId) {
      if (!sameUser(userId)) return null;
      const { data, error } = await client
        .from("hoas")
        .select("id, registered_name")
        .maybeSingle();
      if (error || !data) return null;
      const row = data as { id: string; registered_name: string };
      return { id: row.id, registeredName: row.registered_name };
    },

    async listUnits(userId) {
      if (!sameUser(userId)) return [];
      return listVisibleUnits();
    },

    async updateRegisteredName(userId, registeredName) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const name = registeredName.trim();
      if (!name) return { ok: false, message: "Registered name is required." };
      if (name.length > 200) {
        return { ok: false, message: "Registered name is too long." };
      }
      const { data, error } = await client
        .from("hoas")
        .update({ registered_name: name })
        .eq("id", admin.hoaId)
        .select("id, registered_name")
        .maybeSingle();
      if (error || !data) {
        return { ok: false, message: "Could not save the association name." };
      }
      const row = data as { id: string; registered_name: string };
      return {
        ok: true,
        value: { id: row.id, registeredName: row.registered_name },
      };
    },

    async createUnit(userId, draft) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const normalized = normalizeDraft(draft);
      if (!normalized.ok) return normalized;
      const { data, error } = await client
        .from("units")
        .insert({
          hoa_id: admin.hoaId,
          label: normalized.value.label,
          area_sqm: normalized.value.areaSqm,
          rate_type: normalized.value.rateType,
          rate_centavos: normalized.value.rateCentavos,
        })
        .select("id, hoa_id, label, area_sqm, rate_type, rate_centavos")
        .single();
      if (error || !data) return writeError(error, "Could not add the unit.");
      return { ok: true, value: toUnit(data as UnitRow) };
    },

    async updateUnit(userId, unitId, draft) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const normalized = normalizeDraft(draft);
      if (!normalized.ok) return normalized;
      const { data, error } = await client
        .from("units")
        .update({
          label: normalized.value.label,
          area_sqm: normalized.value.areaSqm,
          rate_type: normalized.value.rateType,
          rate_centavos: normalized.value.rateCentavos,
        })
        .eq("id", unitId)
        .eq("hoa_id", admin.hoaId)
        .select("id, hoa_id, label, area_sqm, rate_type, rate_centavos")
        .maybeSingle();
      if (error) return writeError(error, "Could not save the unit.");
      if (!data) return { ok: false, message: "That unit was not found." };
      return { ok: true, value: toUnit(data as UnitRow) };
    },

    async createMonthlyDues(userId, input) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const period = parsePeriod(input.period);
      if (!period.ok) return period;
      const dueDate = parseDueDate(input.dueDate);
      if (!dueDate.ok) return dueDate;
      const typed = input.description.trim().replace(/\s+/g, " ");
      if (typed.length > 200) {
        return { ok: false, message: "Description is too long." };
      }
      const description = typed || duesDescription(period.value);
      const units = await listVisibleUnits();
      const { data: existing, error: existingError } = await client
        .from("charges")
        .select("unit_id")
        .eq("kind", "dues")
        .eq("period", period.value);
      if (existingError) {
        return { ok: false, message: "Could not save the charges." };
      }
      const already = new Set(
        ((existing ?? []) as { unit_id: string }[]).map((row) => row.unit_id),
      );
      const missing = units.filter((unit) => !already.has(unit.id));
      if (missing.length === 0) {
        return {
          ok: false,
          message: "Monthly dues for that period already exist.",
        };
      }
      return insertCharges(
        client,
        missing.map((unit) => ({
          hoa_id: admin.hoaId,
          unit_id: unit.id,
          kind: "dues",
          description,
          period: period.value,
          amount_centavos: monthlyAmountCentavos(unit),
          due_date: dueDate.value,
          status: "unpaid",
        })),
      );
    },

    async createSpecialAssessment(userId, input) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const description = input.description.trim().replace(/\s+/g, " ");
      if (!description) {
        return { ok: false, message: "Description is required." };
      }
      if (description.length > 200) {
        return { ok: false, message: "Description is too long." };
      }
      const dueDate = parseDueDate(input.dueDate);
      if (!dueDate.ok) return dueDate;
      if (!Number.isSafeInteger(input.amountCentavos) || input.amountCentavos <= 0) {
        return {
          ok: false,
          message: "Enter the amount in pesos, such as 500.00.",
        };
      }
      const units = await listVisibleUnits();
      const allowed = new Set(units.map((unit) => unit.id));
      const uniqueIds = [...new Set(input.unitIds)];
      if (uniqueIds.length === 0) {
        return { ok: false, message: "Choose at least one unit." };
      }
      if (uniqueIds.some((id) => !allowed.has(id))) {
        return { ok: false, message: "Choose a unit in this association." };
      }
      return insertCharges(
        client,
        uniqueIds.map((unitId) => ({
          hoa_id: admin.hoaId,
          unit_id: unitId,
          kind: "special",
          description,
          period: null,
          amount_centavos: input.amountCentavos,
          due_date: dueDate.value,
          status: "unpaid",
        })),
      );
    },

    async listCharges(userId) {
      if (!sameUser(userId)) return [];
      const { data, error } = await client
        .from("charges")
        .select(
          "id, hoa_id, unit_id, kind, description, period, amount_centavos, due_date, status",
        )
        .order("due_date");
      if (error || !data) return [];
      return (data as ChargeRow[]).map(toCharge);
    },

    async submitProof(userId, input: ProofDraft) {
      if (!sameUser(userId)) return denied();
      const user = await actor();
      if (!user || user.role !== "resident" || !user.unitId) {
        return { ok: false, message: "Only a resident can upload proof." };
      }
      const charges = await this.listCharges(userId);
      const payments = await this.listPayments(userId);
      const charge = charges.find((row) => row.id === input.chargeId);
      if (!charge || charge.unitId !== user.unitId) {
        return { ok: false, message: "Choose one of your charges." };
      }
      if (storedChargeStatus(charge, payments) === "paid") {
        return { ok: false, message: "That charge is already paid." };
      }
      const path = proofObjectPath(charge.hoaId, charge.id, input.extension);
      const uploaded = await client.storage
        .from("payment-proofs")
        .upload(path, input.bytes, { contentType: input.contentType, upsert: false });
      if (uploaded.error) {
        return { ok: false, message: "Could not store the photo." };
      }
      const inserted = await client
        .from("payments")
        .insert({
          hoa_id: charge.hoaId,
          charge_id: charge.id,
          unit_id: charge.unitId,
          method: input.method,
          amount_centavos: input.amountCentavos,
          paid_at: input.paidAt,
          reference_no: input.referenceNo,
          proof_path: path,
          status: "pending",
          recorded_by: user.id,
        })
        .select(PAYMENT_COLUMNS)
        .single();
      if (inserted.error || !inserted.data) {
        await client.storage.from("payment-proofs").remove([path]);
        return { ok: false, message: "Could not save the proof." };
      }
      return { ok: true, value: toPayment(inserted.data as PaymentRow) };
    },

    async approvePayment(userId, paymentId) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const reviewedAt = new Date().toISOString();
      const { data, error } = await client
        .from("payments")
        .update({
          status: "approved",
          reviewed_by: admin.id,
          reviewed_at: reviewedAt,
          rejection_reason: null,
        })
        .eq("id", paymentId)
        .eq("hoa_id", admin.hoaId)
        .eq("status", "pending")
        .select(PAYMENT_COLUMNS)
        .maybeSingle();
      if (error || !data) return { ok: false, message: "That proof is not pending." };
      const payment = toPayment(data as PaymentRow);
      await syncCharge(client, payment.chargeId);
      return { ok: true, value: payment };
    },

    async rejectPayment(userId, paymentId, reason) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const rejectionReason = reason.trim().replace(/\s+/g, " ");
      if (!rejectionReason) {
        return { ok: false, message: "A reason is required to reject a proof." };
      }
      const reviewedAt = new Date().toISOString();
      const { data, error } = await client
        .from("payments")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: admin.id,
          reviewed_at: reviewedAt,
        })
        .eq("id", paymentId)
        .eq("hoa_id", admin.hoaId)
        .eq("status", "pending")
        .select(PAYMENT_COLUMNS)
        .maybeSingle();
      if (error || !data) return { ok: false, message: "That proof is not pending." };
      const payment = toPayment(data as PaymentRow);
      await syncCharge(client, payment.chargeId);
      return { ok: true, value: payment };
    },

    async recordManualPayment(userId, input: ManualDraft) {
      if (!sameUser(userId)) return denied();
      const admin = await requireAdmin();
      if (isFailure(admin)) return admin;
      const charges = await this.listCharges(userId);
      const charge = charges.find((row) => row.id === input.chargeId);
      if (!charge) return { ok: false, message: "Choose a unit charge." };
      const reviewedAt = new Date().toISOString();
      const { data, error } = await client
        .from("payments")
        .insert({
          hoa_id: charge.hoaId,
          charge_id: charge.id,
          unit_id: charge.unitId,
          method: input.method,
          amount_centavos: input.amountCentavos,
          paid_at: input.paidAt,
          hoa_reference_no: input.hoaReferenceNo,
          note: input.note,
          status: "approved",
          reviewed_by: admin.id,
          reviewed_at: reviewedAt,
          recorded_by: admin.id,
        })
        .select(PAYMENT_COLUMNS)
        .single();
      if (error || !data) return { ok: false, message: "Could not record the payment." };
      const payment = toPayment(data as PaymentRow);
      await syncCharge(client, charge.id);
      return { ok: true, value: payment };
    },

    async getProofUrl(userId, paymentId) {
      if (!sameUser(userId)) return { ok: false, message: "Sign in is required." };
      const payments = await this.listPayments(userId);
      const payment = payments.find((row) => row.id === paymentId);
      if (!payment?.proofPath) {
        return { ok: false, message: "That proof is not available." };
      }
      const signed = await client.storage
        .from("payment-proofs")
        .createSignedUrl(payment.proofPath, 60);
      if (signed.error || !signed.data?.signedUrl) {
        return { ok: false, message: "That proof is not available." };
      }
      return { ok: true, value: signed.data.signedUrl };
    },

    async listPayments(userId) {
      if (!sameUser(userId)) return [];
      const { data, error } = await client.from("payments").select(PAYMENT_COLUMNS);
      if (error || !data) return [];
      return (data as PaymentRow[]).map(toPayment);
    },

    async listPaymentLinks(userId) {
      if (!sameUser(userId)) return [];
      const { data, error } = await client
        .from("payment_links")
        .select("id, hoa_id, charge_id, unit_id, token");
      if (error || !data) return [];
      return (
        data as {
          id: string;
          hoa_id: string;
          charge_id: string;
          unit_id: string;
          token: string;
        }[]
      ).map((row) => ({
        id: row.id,
        hoaId: row.hoa_id,
        chargeId: row.charge_id,
        unitId: row.unit_id,
        token: row.token,
      }));
    },

    async listUsers(userId) {
      if (!sameUser(userId)) return [];
      const user = await actor();
      if (!user) return [];
      if (user.role !== "admin_treasurer") return [user];
      const { data, error } = await client
        .from("users")
        .select("id, hoa_id, unit_id, email, full_name, role");
      if (error || !data) return [];
      return (data as UserRow[]).map(toUser);
    },
  };
}

const PAYMENT_COLUMNS =
  "id, hoa_id, charge_id, unit_id, method, amount_centavos, paid_at, provider_payment_id, reference_no, hoa_reference_no, proof_path, status, rejection_reason, reviewed_by, reviewed_at, note, recorded_by";

type PaymentRow = {
  id: string;
  hoa_id: string;
  charge_id: string;
  unit_id: string;
  method: PaymentMethod;
  amount_centavos: number;
  paid_at: string;
  provider_payment_id: string | null;
  reference_no: string | null;
  hoa_reference_no: string | null;
  proof_path: string | null;
  status: Payment["status"];
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  note: string | null;
  recorded_by: string | null;
};

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    hoaId: row.hoa_id,
    chargeId: row.charge_id,
    unitId: row.unit_id,
    method: row.method,
    amountCentavos: row.amount_centavos,
    paidAt: row.paid_at,
    providerPaymentId: row.provider_payment_id,
    referenceNo: row.reference_no,
    hoaReferenceNo: row.hoa_reference_no,
    proofPath: row.proof_path,
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    note: row.note,
    recordedBy: row.recorded_by,
  };
}

async function syncCharge(client: SupabaseClient, chargeId: string) {
  const charges = await client
    .from("charges")
    .select("id, hoa_id, unit_id, kind, description, period, amount_centavos, due_date, status")
    .eq("id", chargeId)
    .maybeSingle();
  if (charges.error || !charges.data) return;
  const charge = toCharge(charges.data as ChargeRow);
  const payments = await client
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .eq("charge_id", chargeId);
  if (payments.error || !payments.data) return;
  const status = storedChargeStatus(
    charge,
    (payments.data as PaymentRow[]).map(toPayment),
  );
  if (status !== charge.status) {
    await client.from("charges").update({ status }).eq("id", chargeId);
  }
}

function normalizeDraft(draft: UnitDraft): Result<UnitDraft> {
  const label = draft.label.trim();
  if (!label) return { ok: false, message: "Unit label is required." };
  if (label.length > 80) return { ok: false, message: "Unit label is too long." };
  if (draft.rateType !== "flat" && draft.rateType !== "per_sqm") {
    return { ok: false, message: "Choose a flat amount or a per-sqm rate." };
  }
  if (!Number.isSafeInteger(draft.rateCentavos) || draft.rateCentavos < 0) {
    return { ok: false, message: "Enter the amount in pesos, such as 1500.00." };
  }
  if (draft.rateType === "flat") {
    return {
      ok: true,
      value: { label, rateType: "flat", rateCentavos: draft.rateCentavos, areaSqm: null },
    };
  }
  if (draft.areaSqm === null || !Number.isFinite(draft.areaSqm) || draft.areaSqm <= 0) {
    return { ok: false, message: "Enter the floor area in square metres." };
  }
  return {
    ok: true,
    value: {
      label,
      rateType: "per_sqm",
      rateCentavos: draft.rateCentavos,
      areaSqm: draft.areaSqm,
    },
  };
}

function writeError(
  error: { code?: string; message: string } | null,
  fallback: string,
): Failure {
  if (error?.code === "23505") {
    return { ok: false, message: "A unit with that label already exists." };
  }
  return { ok: false, message: fallback };
}

async function insertCharges(
  client: SupabaseClient,
  rows: Record<string, unknown>[],
): Promise<Result<Charge[]>> {
  const { data, error } = await client
    .from("charges")
    .insert(rows)
    .select(
      "id, hoa_id, unit_id, kind, description, period, amount_centavos, due_date, status",
    );
  if (error || !data) return { ok: false, message: "Could not save the charges." };
  return { ok: true, value: (data as ChargeRow[]).map(toCharge) };
}
