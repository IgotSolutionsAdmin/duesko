"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LANDING_WAITLIST } from "@/lib/landing-copy";
import { joinWaitlist, type WaitlistActionState } from "@/lib/waitlist-action";
import { WAITLIST_METHODS, WAITLIST_ROLES, WAITLIST_UNITS } from "@/lib/waitlist";

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-mist px-3 text-base text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "text-sm font-medium text-ink";

const initial: WaitlistActionState = { status: "idle" };

export function WaitlistForm({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  const success = state.status === 200 ? state : null;
  const error = state.status !== "idle" && state.status !== 200 ? state : null;
  const fieldErrors = error && "fields" in error ? error.fields : undefined;

  if (success) {
    return (
      <p
        role="status"
        data-testid="waitlist-success"
        className="rounded-3xl bg-white p-5 text-base leading-7 text-ink"
      >
        {success.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 rounded-3xl bg-white p-5" noValidate>
      {!open ? (
        <p data-testid="waitlist-closed-note" className="text-sm font-medium text-teal-deep">
          {LANDING_WAITLIST.closedNote}
        </p>
      ) : (
        <p className="text-sm text-ink/70">{LANDING_WAITLIST.microcopy}</p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      <label className={labelClass}>
        Full name
        <input
          name="fullName"
          required
          disabled={!open}
          placeholder="e.g. Maria Santos"
          autoComplete="name"
          className={`mt-1 ${fieldClass}`}
          aria-invalid={fieldErrors?.fullName ? true : undefined}
        />
      </label>
      <label className={labelClass}>
        Email
        <input
          name="email"
          type="email"
          required
          disabled={!open}
          autoComplete="email"
          className={`mt-1 ${fieldClass}`}
          aria-invalid={fieldErrors?.email ? true : undefined}
        />
      </label>
      <label className={labelClass}>
        Mobile number <span className="font-normal text-ink/60">(optional)</span>
        <input
          name="mobile"
          type="tel"
          disabled={!open}
          placeholder="09XX XXX XXXX"
          autoComplete="tel"
          className={`mt-1 ${fieldClass}`}
        />
      </label>
      <label className={labelClass}>
        HOA / condo name
        <input
          name="hoaName"
          required
          disabled={!open}
          placeholder="e.g. Greenfields Homeowners Association"
          className={`mt-1 ${fieldClass}`}
        />
      </label>
      <label className={labelClass}>
        City / municipality
        <input
          name="city"
          required
          disabled={!open}
          placeholder="e.g. Quezon City"
          autoComplete="address-level2"
          className={`mt-1 ${fieldClass}`}
        />
      </label>
      <label className={labelClass}>
        Number of units
        <select name="units" required disabled={!open} defaultValue="" className={`mt-1 ${fieldClass}`}>
          <option value="" disabled>
            Select a range
          </option>
          {WAITLIST_UNITS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Your role
        <select name="role" required disabled={!open} defaultValue="" className={`mt-1 ${fieldClass}`}>
          <option value="" disabled>
            Select your role
          </option>
          {WAITLIST_ROLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <fieldset disabled={!open} className="grid gap-2">
        <legend className={labelClass}>How do you collect dues today?</legend>
        {WAITLIST_METHODS.map((method) => (
          <label key={method} className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              name="collectMethods"
              value={method}
              className="size-5 accent-teal-deep"
            />
            {method}
          </label>
        ))}
      </fieldset>
      <label className={labelClass}>
        Anything else you'd like us to know?{" "}
        <span className="font-normal text-ink/60">(optional)</span>
        <textarea
          name="notes"
          disabled={!open}
          rows={4}
          placeholder="Your biggest headache with dues collection"
          className="mt-1 w-full rounded-2xl border border-border bg-mist px-3 py-3 text-base text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink">
        <input
          type="checkbox"
          name="consent"
          value="yes"
          required
          disabled={!open}
          className="mt-1 size-5 shrink-0 accent-teal-deep"
        />
        <span>
          I agree to DuesKo contacting me about the waitlist. See our{" "}
          <Link href="/privacy" className="font-semibold text-teal-deep underline-offset-2 hover:underline">
            Privacy Notice
          </Link>
          .
        </span>
      </label>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button
        type="submit"
        disabled={!open || pending}
        className="inline-flex h-12 items-center justify-center rounded-2xl bg-teal-deep px-5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {LANDING_WAITLIST.submit}
      </button>
    </form>
  );
}
