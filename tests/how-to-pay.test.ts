import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryRepository } from "../lib/mock/memory-repository";
import { seed } from "../lib/mock/seed";
import { DEFAULT_HOW_TO_PAY, parseHowToPay } from "../lib/how-to-pay";

const resident = seed.users.find((user) => user.role === "resident");
const admin = seed.users.find((user) => user.role === "admin_treasurer");
if (!resident || !admin) throw new Error("Seed is missing demo users");

describe("how to pay", () => {
  it("requires text and stores officer edits for residents to read", async () => {
    assert.equal(parseHowToPay("   ").ok, false);
    assert.equal(parseHowToPay("x".repeat(2001)).ok, false);
    const parsed = parseHowToPay(`  ${DEFAULT_HOW_TO_PAY}  `);
    assert.equal(parsed.ok, true);

    const repository = createMemoryRepository(structuredClone(seed));
    const denied = await repository.updateHowToPay(resident.id, "Bank deposit at BPI.");
    assert.equal(denied.ok, false);

    const saved = await repository.updateHowToPay(
      admin.id,
      "Bank deposit at BPI. Then upload your proof in DuesKo.",
    );
    assert.equal(saved.ok, true);
    const hoa = await repository.getHoa(resident.id);
    assert.equal(hoa?.howToPay, "Bank deposit at BPI. Then upload your proof in DuesKo.");
    assert.equal(seed.hoas[0]?.howToPay, DEFAULT_HOW_TO_PAY);
  });
});
