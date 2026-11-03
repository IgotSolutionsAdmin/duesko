"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rejectProof } from "@/lib/payment-actions";

export function RejectProofDialog({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);
  const reasonId = `reason-${paymentId}`;

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
            action={rejectProof}
            className="flex w-full max-w-md flex-col gap-3 rounded-3xl bg-white p-5"
          >
            <h2 id={`reject-title-${paymentId}`} className="font-heading text-xl font-semibold">
              Reject this proof
            </h2>
            <p className="text-sm leading-6 text-ink/70">
              A reason is required. The resident will see it and can re-upload.
            </p>
            <input type="hidden" name="paymentId" value={paymentId} />
            <label htmlFor={reasonId} className="text-sm font-medium">
              Reason for rejection
            </label>
            <input
              id={reasonId}
              name="reason"
              required
              className="h-12 w-full rounded-2xl border border-border px-3 text-base"
            />
            <div className="flex flex-col gap-2">
              <Button type="submit" className="h-12 w-full text-base">
                Reject
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full bg-white text-base"
                onClick={() => setOpen(false)}
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
