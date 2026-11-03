import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isTestSite, useMockRepository } from "../lib/test-site";

const vi = {
  originals: new Map<string, string | undefined>(),
  stubEnv(name: string, value: string) {
    if (!this.originals.has(name)) {
      this.originals.set(name, process.env[name]);
    }
    Reflect.set(process.env, name, value);
  },
  unstubAllEnvs() {
    for (const [name, value] of this.originals) {
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else Reflect.set(process.env, name, value);
    }
    this.originals.clear();
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("test site flag", () => {
  it("keeps the mock off in production unless the flag is true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    delete process.env.NEXT_PUBLIC_DUESKO_TEST_SITE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isTestSite(), false);
    assert.equal(useMockRepository(), false);

    vi.stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "true");
    assert.equal(isTestSite(), true);
    assert.equal(useMockRepository(), true);
  });

  it("keeps the mock off in local dev when the test-site flag is unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    delete process.env.NEXT_PUBLIC_DUESKO_TEST_SITE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isTestSite(), false);
    assert.equal(useMockRepository(), false);
  });

  it("uses Supabase when it is configured, including on the test site", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    assert.equal(isTestSite(), true);
    assert.equal(useMockRepository(), false);
  });
});
