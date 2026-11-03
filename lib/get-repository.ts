import "server-only";
import { createMemoryRepository } from "./mock/memory-repository";
import { seed } from "./mock/seed";
import type { DuesRepository, Failure } from "./repository";
import { isSupabaseConfigured } from "./supabase/env";
import { useMockRepository } from "./test-site";
import { createSupabaseRepository } from "./supabase/repository";
import { openDataClient } from "./supabase/session";
import { resetProofTokens } from "./mock/proof-tokens";
import type { SeedData } from "./types";

type Store = { repository: DuesRepository };

const globalStore = globalThis as typeof globalThis & {
  __dueskoStore?: Store;
};

const signedOut: Failure = { ok: false, message: "Sign in is required." };

function openStore(): Store {
  const data: SeedData = structuredClone(seed);
  return { repository: createMemoryRepository(data) };
}

/**
 * Test-site mode always uses the in-memory mock.
 * Otherwise Supabase is used when its public env vars are set.
 * A production build without either one has no data store.
 * The service role key is not read here.
 */
export function getRepository(): DuesRepository {
  if (useMockRepository()) {
    globalStore.__dueskoStore ??= openStore();
    return globalStore.__dueskoStore.repository;
  }
  if (isSupabaseConfigured()) return createRequestRepository();
  throw new Error(
    "DuesKo has no data store. Set the Supabase env vars, or NEXT_PUBLIC_DUESKO_TEST_SITE=true for the sample site.",
  );
}

function createRequestRepository(): DuesRepository {
  let ready: Promise<DuesRepository | null> | undefined;

  function live(): Promise<DuesRepository | null> {
    ready ??= openDataClient().then((session) =>
      session
        ? createSupabaseRepository(session.client, session.sessionUserId)
        : null,
    );
    return ready;
  }

  return {
    async getUser(userId) {
      const repository = await live();
      if (!repository) return null;
      return repository.getUser(userId);
    },
    async getHoa(userId) {
      const repository = await live();
      if (!repository) return null;
      return repository.getHoa(userId);
    },
    async listUnits(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listUnits(userId);
    },
    async updateRegisteredName(userId, registeredName) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.updateRegisteredName(userId, registeredName);
    },
    async updateHowToPay(userId, howToPay) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.updateHowToPay(userId, howToPay);
    },
    async createUnit(userId, draft) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.createUnit(userId, draft);
    },
    async updateUnit(userId, unitId, draft) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.updateUnit(userId, unitId, draft);
    },
    async createMonthlyDues(userId, input) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.createMonthlyDues(userId, input);
    },
    async createSpecialAssessment(userId, input) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.createSpecialAssessment(userId, input);
    },
    async listCharges(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listCharges(userId);
    },
    async submitProof(userId, input) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.submitProof(userId, input);
    },
    async approvePayment(userId, paymentId) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.approvePayment(userId, paymentId);
    },
    async rejectPayment(userId, paymentId, reason) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.rejectPayment(userId, paymentId, reason);
    },
    async recordManualPayment(userId, input) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.recordManualPayment(userId, input);
    },
    async getProofUrl(userId, paymentId) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.getProofUrl(userId, paymentId);
    },
    async listPayments(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listPayments(userId);
    },
    async listUsers(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listUsers(userId);
    },
    async recordExport(userId, input) {
      const repository = await live();
      if (!repository) return signedOut;
      return repository.recordExport(userId, input);
    },
  };
}

/** Restores the in-memory mock to the JSON seed. Dev and e2e only. */
export function resetRepository(): void {
  resetProofTokens();
  globalStore.__dueskoStore = openStore();
}
