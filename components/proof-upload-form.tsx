"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { HowToPayCard } from "@/components/how-to-pay-card";
import { submitProof } from "@/lib/payment-actions";
import {
  firstProofError,
  proofFieldErrors,
  type ProofFieldErrors,
} from "@/lib/payments";
import { formatCentavos } from "@/lib/money";
import type { Charge } from "@/lib/types";

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-mist px-3 text-base outline-none";
const errorFieldClass = `${fieldClass} border-destructive`;
const labelClass = "text-sm font-medium text-ink";

export function ProofUploadForm({
  charges,
  defaultChargeId,
  defaultAmount,
  howToPay,
  pendingChargeIds,
  reupload,
  serverError,
}: {
  charges: Charge[];
  defaultChargeId?: string;
  defaultAmount?: string;
  howToPay: string;
  pendingChargeIds: string[];
  reupload?: boolean;
  serverError?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ProofFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => {
    if (!file || file.type === "application/pdf") return null;
    return URL.createObjectURL(file);
  }, [file]);
  const shown = submitted ? errors : {};

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selected = file ?? (data.get("proof") instanceof File ? (data.get("proof") as File) : null);
    if (selected && data.get("proof") instanceof File === false) {
      data.set("proof", selected);
    }
    const bytes = selected ? new Uint8Array(await selected.arrayBuffer()) : new Uint8Array();
    const next = proofFieldErrors({
      chargeId: String(data.get("chargeId") ?? ""),
      amount: String(data.get("amount") ?? ""),
      paidOn: String(data.get("paidOn") ?? ""),
      method: String(data.get("method") ?? ""),
      referenceNo: String(data.get("referenceNo") ?? ""),
      bytes,
      fileName: selected?.name,
      mimeType: selected?.type,
    });
    setSubmitted(true);
    if (firstProofError(next)) {
      setErrors(next);
      return;
    }
    setErrors({});
    await submitProof(data);
  }

  return (
    <div className="flex flex-col gap-4">
      <HowToPayCard howToPay={howToPay} />
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-3xl bg-white p-5"
        noValidate
      >
        {reupload ? (
          <p className="text-sm font-medium text-teal-deep" data-testid="reupload-banner">
            Re-upload a new proof for this rejected charge.
          </p>
        ) : null}
        <label htmlFor="chargeId" className={labelClass}>
          Charge
        </label>
        <select
          id="chargeId"
          name="chargeId"
          required
          defaultValue={defaultChargeId}
          aria-invalid={shown.chargeId ? true : undefined}
          className={shown.chargeId ? errorFieldClass : fieldClass}
        >
          <option value="">Choose a charge</option>
          {charges.map((charge) => {
            const pending = pendingChargeIds.includes(charge.id);
            return (
              <option key={charge.id} value={charge.id} disabled={pending}>
                {charge.description} · {formatCentavos(charge.amountCentavos)}
                {pending ? " (pending review)" : ""}
              </option>
            );
          })}
        </select>
        {shown.chargeId ? (
          <p role="alert" className="text-sm text-destructive">{shown.chargeId}</p>
        ) : null}

        <label htmlFor="amount" className={labelClass}>
          Amount
        </label>
        <div className={`flex h-12 items-center rounded-2xl border bg-mist px-3 ${shown.amount ? "border-destructive" : "border-border"}`}>
          <span className="font-medium text-teal-deep" aria-hidden>₱</span>
          <input
            id="amount"
            name="amount"
            required
            inputMode="decimal"
            defaultValue={defaultAmount}
            aria-invalid={shown.amount ? true : undefined}
            className="h-full w-full bg-transparent px-2 text-base outline-none"
          />
        </div>
        {shown.amount ? (
          <p role="alert" className="text-sm text-destructive">{shown.amount}</p>
        ) : null}

        <label htmlFor="paidOn" className={labelClass}>
          Payment date
        </label>
        <input
          id="paidOn"
          name="paidOn"
          type="date"
          required
          aria-invalid={shown.paidOn ? true : undefined}
          className={shown.paidOn ? errorFieldClass : fieldClass}
        />
        {shown.paidOn ? (
          <p role="alert" className="text-sm text-destructive">{shown.paidOn}</p>
        ) : null}

        <label htmlFor="method" className={labelClass}>
          Method
        </label>
        <select id="method" name="method" defaultValue="bank_transfer" className={fieldClass}>
          <option value="bank_transfer">Bank transfer</option>
          <option value="gcash">GCash (outside DuesKo)</option>
          <option value="other">Other</option>
        </select>

        <label htmlFor="referenceNo" className={labelClass}>
          Reference no.
        </label>
        <input
          id="referenceNo"
          name="referenceNo"
          required
          aria-invalid={shown.referenceNo ? true : undefined}
          className={shown.referenceNo ? errorFieldClass : fieldClass}
        />
        {shown.referenceNo ? (
          <p role="alert" className="text-sm text-destructive">{shown.referenceNo}</p>
        ) : null}

        <label htmlFor="proof" className={labelClass}>
          Proof of payment
        </label>
        <input
          ref={fileInput}
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
          aria-invalid={shown.proof ? true : undefined}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          onInput={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="inline-flex h-12 min-h-11 w-full items-center justify-center rounded-2xl border border-border bg-mist text-base font-medium text-ink"
        >
          Choose photo or PDF
        </button>
        {file ? (
          <div data-testid="proof-preview" className="flex flex-col gap-2">
            <p className="text-sm text-ink/70">{file.name}</p>
            {previewUrl && file.type !== "application/pdf" ? (
              // Local object URL; do not send through the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Selected proof preview"
                className="max-h-48 rounded-2xl object-contain bg-mist"
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-6 text-ink/60">JPG, PNG, or PDF. 5 MB maximum.</p>
        )}
        {shown.proof ? (
          <p role="alert" className="text-sm text-destructive">{shown.proof}</p>
        ) : null}
        {serverError ? (
          <p role="alert" className="text-sm text-destructive">{serverError}</p>
        ) : null}
        <Button type="submit" className="h-12 w-full text-base">
          {reupload ? "Re-upload proof of payment" : "Upload proof of payment"}
        </Button>
      </form>
    </div>
  );
}
