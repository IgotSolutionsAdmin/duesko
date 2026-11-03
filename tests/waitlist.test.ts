import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { landingPublicText } from "../lib/landing-copy";
import { forbiddenMarketingWords } from "../lib/forbidden-words";
import { PRIVACY_NOTICE } from "../lib/privacy-notice";
import {
  isWaitlistOpen,
  parseWaitlistFields,
  resetMockWaitlist,
  resetWaitlistRateLimit,
  submitWaitlist,
  waitlistSuccessMessage,
} from "../lib/waitlist";

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
  resetWaitlistRateLimit();
  resetMockWaitlist();
});

const valid = {
  fullName: "Maria Santos",
  email: "maria.santos@example.com",
  mobile: "0917 123 4567",
  hoaName: "Greenfields Homeowners Association",
  city: "Quezon City",
  units: "51-150",
  role: "Treasurer",
  collectMethods: ["GCash", "Spreadsheet tracking"],
  notes: "",
  consent: true,
  website: "",
};

describe("waitlist validation and flag", () => {
  it("stays closed unless NEXT_PUBLIC_DUESKO_WAITLIST_OPEN is the string true", () => {
    clearEnv("NEXT_PUBLIC_DUESKO_WAITLIST_OPEN");
    assert.equal(isWaitlistOpen(), false);
    stubEnv("NEXT_PUBLIC_DUESKO_WAITLIST_OPEN", "false");
    assert.equal(isWaitlistOpen(), false);
    stubEnv("NEXT_PUBLIC_DUESKO_WAITLIST_OPEN", "true");
    assert.equal(isWaitlistOpen(), true);
  });

  it("rejects incomplete fields and missing consent", () => {
    const missing = parseWaitlistFields({
      fullName: "",
      email: "not-an-email",
      hoaName: "",
      city: "",
      units: "",
      role: "",
      collectMethods: [],
      consent: false,
    });
    assert.equal(missing.ok, false);
    if (missing.ok) throw new Error("expected validation to fail");
    assert.ok(missing.fields.fullName);
    assert.ok(missing.fields.email);
    assert.ok(missing.fields.consent);
    assert.ok(missing.fields.collectMethods);
  });

  it("accepts a complete signup", () => {
    const parsed = parseWaitlistFields(valid);
    assert.equal(parsed.ok, true);
  });

  it("returns 403 when the waitlist flag is off", async () => {
    clearEnv("NEXT_PUBLIC_DUESKO_WAITLIST_OPEN");
    const result = await submitWaitlist(valid, { ip: "10.0.0.1", userAgent: "test" });
    assert.equal(result.status, 403);
  });

  it("saves on the mock path when the waitlist is open", async () => {
    stubEnv("NEXT_PUBLIC_DUESKO_WAITLIST_OPEN", "true");
    stubEnv("NEXT_PUBLIC_DUESKO_TEST_SITE", "true");
    clearEnv("NEXT_PUBLIC_SUPABASE_URL");
    clearEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const result = await submitWaitlist(valid, { ip: "10.0.0.2", userAgent: "test" });
    assert.equal(result.status, 200);
    if (result.status !== 200) throw new Error("expected success");
    assert.equal(result.firstName, "Maria");
    assert.equal(
      result.message,
      waitlistSuccessMessage(
        "Maria",
        "Greenfields Homeowners Association",
        "maria.santos@example.com",
      ),
    );
  });

  it("does not print banned payment or tax words on the landing or privacy copy", () => {
    const text = `${landingPublicText()}\n${PRIVACY_NOTICE.title}\n${PRIVACY_NOTICE.body}`;
    assert.deepEqual(forbiddenMarketingWords(text), []);
  });
});
