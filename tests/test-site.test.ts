import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isTestSite, useMockRepository } from "../lib/test-site";

const keys = [
  "NODE_ENV",
  "NEXT_PUBLIC_DUESKO_TEST_SITE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

describe("test site flag", () => {
  it("keeps the mock off in production unless the flag is true", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_DUESKO_TEST_SITE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isTestSite(), false);
    assert.equal(useMockRepository(), false);

    process.env.NEXT_PUBLIC_DUESKO_TEST_SITE = "true";
    assert.equal(isTestSite(), true);
    assert.equal(useMockRepository(), true);
  });

  it("uses the mock in local dev when Supabase is unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_DUESKO_TEST_SITE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(useMockRepository(), true);
  });
});
