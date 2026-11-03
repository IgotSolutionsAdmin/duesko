import type {
  AppUser,
  Charge,
  Hoa,
  Payment,
  PaymentLink,
  Unit,
} from "./types";

/**
 * Data seam for DuesKo. Pages call this interface and pass the signed-in
 * user id. The implementation decides which rows that role may see.
 *
 * `getRepository()` currently returns the in-memory mock. A Supabase
 * implementation should satisfy this same interface and replace that factory.
 * Callers look up the user by id; they do not pass a role that the
 * implementation is expected to trust.
 */
export interface DuesRepository {
  getUser(userId: string): Promise<AppUser | null>;
  getHoa(userId: string): Promise<Hoa | null>;
  listUnits(userId: string): Promise<Unit[]>;
  listCharges(userId: string): Promise<Charge[]>;
  listPayments(userId: string): Promise<Payment[]>;
  listPaymentLinks(userId: string): Promise<PaymentLink[]>;
  listUsers(userId: string): Promise<AppUser[]>;
}
