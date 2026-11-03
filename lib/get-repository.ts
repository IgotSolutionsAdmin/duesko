import "server-only";
import { createMemoryRepository } from "./mock/memory-repository";
import { seed } from "./mock/seed";
import type { DuesRepository } from "./repository";
import type { SeedData } from "./types";

type Store = { repository: DuesRepository };

const globalStore = globalThis as typeof globalThis & {
  __dueskoStore?: Store;
};

function openStore(): Store {
  const data: SeedData = structuredClone(seed);
  return { repository: createMemoryRepository(data) };
}

/** The app's data access. Swap the body for a Supabase repository later. */
export function getRepository(): DuesRepository {
  globalStore.__dueskoStore ??= openStore();
  return globalStore.__dueskoStore.repository;
}

/** Restores the in-memory mock to the JSON seed. Dev and e2e only. */
export function resetRepository(): void {
  globalStore.__dueskoStore = openStore();
}
