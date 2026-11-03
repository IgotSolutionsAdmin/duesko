import type {
  AppUser,
  Charge,
  ExportAudit,
  ExportKind,
  Hoa,
  Payment,
  Unit,
  UnitDraft,
} from "./types";
import type { ManualDraft, ProofDraft } from "./payments";

export interface MonthlyDuesInput {
  period: string;
  dueDate: string;
  description: string;
}

export interface SpecialAssessmentInput {
  description: string;
  amountCentavos: number;
  dueDate: string;
  unitIds: string[];
}

export type Failure = { ok: false; message: string };

export type Success<T> = { ok: true; value: T };

export type Result<T> = Success<T> | Failure;

/**
 * Data seam for DuesKo. Pages call this interface and pass the signed-in
 * user id. The implementation decides which rows that role may see.
 *
 * `getRepository()` returns Supabase when the public env vars are set, and
 * the in-memory mock otherwise. A Supabase implementation satisfies this
 * same interface.
 * Callers look up the user by id; they do not pass a role that the
 * implementation is expected to trust.
 */
export interface DuesRepository {
  getUser(userId: string): Promise<AppUser | null>;
  getHoa(userId: string): Promise<Hoa | null>;
  listUnits(userId: string): Promise<Unit[]>;
  updateRegisteredName(userId: string, registeredName: string): Promise<Result<Hoa>>;
  updateHowToPay(userId: string, howToPay: string): Promise<Result<Hoa>>;
  createUnit(userId: string, draft: UnitDraft): Promise<Result<Unit>>;
  updateUnit(
    userId: string,
    unitId: string,
    draft: UnitDraft,
  ): Promise<Result<Unit>>;
  createMonthlyDues(
    userId: string,
    input: MonthlyDuesInput,
  ): Promise<Result<Charge[]>>;
  createSpecialAssessment(
    userId: string,
    input: SpecialAssessmentInput,
  ): Promise<Result<Charge[]>>;
  listCharges(userId: string): Promise<Charge[]>;
  submitProof(userId: string, input: ProofDraft): Promise<Result<Payment>>;
  approvePayment(userId: string, paymentId: string): Promise<Result<Payment>>;
  rejectPayment(
    userId: string,
    paymentId: string,
    reason: string,
  ): Promise<Result<Payment>>;
  recordManualPayment(userId: string, input: ManualDraft): Promise<Result<Payment>>;
  /** Short-lived URL. Callers must already be allowed to see the payment. */
  getProofUrl(userId: string, paymentId: string): Promise<Result<string>>;
  listPayments(userId: string): Promise<Payment[]>;
  listUsers(userId: string): Promise<AppUser[]>;
  recordExport(
    userId: string,
    input: { kind: ExportKind; month: string | null; status: string | null },
  ): Promise<Result<ExportAudit>>;
}
