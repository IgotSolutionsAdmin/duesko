"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { rejectProof } from "@/lib/payment-actions";
import { rejectReasonError } from "@/lib/payments";

export function RejectProofDialog({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const reasonId = `reason-${paymentId}`;
  const errorId = `reason-error-${paymentId}`;
  const disabled = !reason.trim();

  function close() {
    setOpen(false);
    setReason("");
    setError(undefined);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = rejectReasonError(reason);
    if (message) {
      setError(message);
      return;
    }
    setError(undefined);
    const data = new FormData(event.currentTarget);
    await rejectProof(data);
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full bg-white text-base"
        onClick={() => setOpen(true)}
      >
        Reject
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`reject-title-${paymentId}`}
          data-testid="reject-dialog"
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
        >
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex w-full max-w-md flex-col gap-3 rounded-3xl bg-white p-5"
          >
            <h2 id={`reject-title-${paymentId}`} className="font-heading text-xl font-semibold">
              Reject this proof
            </h2>
            <p className="text-sm leading-6 text-ink/70">
              A reason is required. The resident will see it and can re-upload.
            </p>
            <input type="hidden" name="paymentId" value={paymentId} suppressHydrationWarning />
            <label htmlFor={reasonId} className="text-sm font-medium">
              Reason for rejection
            </label>
            <textarea
              id={reasonId}
              name="reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(rejectReasonError(event.target.value));
              }}
              onBlur={() => setError(rejectReasonError(reason))}
              placeholder="e.g. Reference number does not match"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`min-h-24 w-full rounded-2xl border px-3 py-3 text-base ${
                error ? "border-destructive" : "border-border"
              }`}
            />
            {error ? (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#DC2626] text-base font-medium text-white disabled:pointer-events-none disabled:opacity-50"
              >
                Reject
              </button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full bg-white text-base"
                onClick={close}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
