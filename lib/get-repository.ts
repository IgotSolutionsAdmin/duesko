import "server-only";
import { createMemoryRepository } from "./mock/memory-repository";
import { seed } from "./mock/seed";
import type { DuesRepository, Failure } from "./repository";
import { isSupabaseConfigured } from "./supabase/env";
import { createSupabaseRepository } from "./supabase/repository";
import { openDataClient } from "./supabase/session";
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
 * Supabase when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set. Otherwise the in-memory mock. The service role key is not read here.
 */
export function getRepository(): DuesRepository {
  if (isSupabaseConfigured()) return createRequestRepository();
  globalStore.__dueskoStore ??= openStore();
  return globalStore.__dueskoStore.repository;
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
    async listPayments(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listPayments(userId);
    },
    async listPaymentLinks(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listPaymentLinks(userId);
    },
    async listUsers(userId) {
      const repository = await live();
      if (!repository) return [];
      return repository.listUsers(userId);
    },
  };
}

/** Restores the in-memory mock to the JSON seed. Dev and e2e only. */
export function resetRepository(): void {
  globalStore.__dueskoStore = openStore();
}
