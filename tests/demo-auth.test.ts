import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import nextConfig from "../next.config";

const originals = new Map<string, string | undefined>();

function stubEnv(name: string, value: string) {
  if (!originals.has(name)) originals.set(name, process.env[name]);
  Reflect.set(process.env, name, value);
}

function clearEnv(name: string) {
  if (!originals.has(name)) originals.set(name, process.env[name]);
  Reflect.deleteProperty(process.env, name);
}

afterEach(() => {
  for (const [name, value] of originals) {
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else Reflect.set(process.env, name, value);
  }
  originals.clear();
});

async function demoAuth() {
  return import("../lib/demo-auth");
}

describe("demo auth production lock", () => {
  it("turns off demo auth, dev reset, and dev routes when the test-site flag is unset", async () => {
    stubEnv("NODE_ENV", "development");
    clearEnv("NEXT_PUBLIC_DUESKO_TEST_SITE");
    clearEnv("DUESKO_E2E");
    clearEnv("NEXT_PUBLIC_SUPABASE_URL");
    clearEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const { allowDevReset, isDemoAuthEnabled, shouldRenderDevRoleSwitch } = await demoAuth();
    assert.equal(isDemoAuthEnabled(), false);
    assert.equal(shouldRenderDevRoleSwitch(), false);
    assert.equal(allowDevReset(), false);

    const { GET, POST } = await import("../app/dev/session/route");
    assert.equal((await GET()).status, 404);
    assert.equal((await POST()).status, 404);
  });

  it("allows demo sign-in and dev reset only on the test site without Supabase", async () => {
    stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "true");
    stubEnv("NODE_ENV", "development");
    clearEnv("NEXT_PUBLIC_SUPABASE_URL");
    clearEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    clearEnv("DUESKO_E2E");

    const { allowDevReset, isDemoAuthEnabled, shouldRenderDevRoleSwitch } = await demoAuth();
    assert.equal(isDemoAuthEnabled(), true);
    assert.equal(shouldRenderDevRoleSwitch(), true);
    assert.equal(allowDevReset(), true);
  });

  it("keeps demo auth off on a production test-site build unless Playwright sets DUESKO_E2E", async () => {
    stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "true");
    stubEnv("NODE_ENV", "production");
    clearEnv("DUESKO_E2E");
    clearEnv("NEXT_PUBLIC_SUPABASE_URL");
    clearEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const { allowDevReset, isDemoAuthEnabled, shouldRenderDevRoleSwitch } = await demoAuth();
    assert.equal(isDemoAuthEnabled(), false);
    assert.equal(shouldRenderDevRoleSwitch(), false);
    assert.equal(allowDevReset(), false);

    stubEnv("DUESKO_E2E", "1");
    const again = await demoAuth();
    assert.equal(again.isDemoAuthEnabled(), true);
    assert.equal(again.allowDevReset(), true);
  });

  it("turns demo auth off when Supabase is configured, even on the test site", async () => {
    stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "true");
    stubEnv("NODE_ENV", "development");
    stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const { isDemoAuthEnabled } = await demoAuth();
    assert.equal(isDemoAuthEnabled(), false);
  });

  it("turns off the Next.js dev indicator so production never shows it", () => {
    assert.equal(nextConfig.devIndicators, false);
  });
});
