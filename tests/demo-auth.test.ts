import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isDemoAuthEnabled, shouldRenderDevRoleSwitch } from "../lib/demo-auth";
import nextConfig from "../next.config";

const originals = new Map<string, string | undefined>();

function stubEnv(name: string, value: string) {
  if (!originals.has(name)) originals.set(name, process.env[name]);
  Reflect.set(process.env, name, value);
}

afterEach(() => {
  for (const [name, value] of originals) {
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else Reflect.set(process.env, name, value);
  }
  originals.clear();
});

describe("demo auth production lock", () => {
  it("renders the DEV ONLY panel and allows the demo session only in development", () => {
    stubEnv("NODE_ENV", "development");
    assert.equal(isDemoAuthEnabled(), true);
    assert.equal(shouldRenderDevRoleSwitch(), true);
  });

  it("rejects the panel and demo session routes in production", async () => {
    stubEnv("NODE_ENV", "production");
    assert.equal(isDemoAuthEnabled(), false);
    assert.equal(shouldRenderDevRoleSwitch(), false);

    const { GET, POST } = await import("../app/dev/session/route");
    assert.equal((await GET()).status, 404);
    assert.equal((await POST()).status, 404);
  });

  it("turns off the Next.js dev indicator so production never shows it", () => {
    assert.equal(nextConfig.devIndicators, false);
  });
});
