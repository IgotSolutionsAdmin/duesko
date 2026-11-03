import "server-only";
import { createMemoryRepository } from "./mock/memory-repository";
import { seed } from "./mock/seed";
import type { DuesRepository } from "./repository";

let repository: DuesRepository | undefined;

/** The app's data access. Swap the body for a Supabase repository later. */
export function getRepository(): DuesRepository {
  repository ??= createMemoryRepository(seed);
  return repository;
}
