"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveHowToPay } from "@/lib/hoa-actions";

export function HowToPayForm({
  howToPay,
  error,
}: {
  howToPay: string;
  error: string | null;
}) {
  const [value, setValue] = useState(howToPay);

  return (
    <form action={saveHowToPay} className="flex flex-col gap-3">
      <label htmlFor="howToPay" className="text-sm font-medium text-ink">
        How to pay
      </label>
      <textarea
        id="howToPay"
        name="howToPay"
        required
        maxLength={2000}
        rows={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-xl border border-border bg-white px-3 py-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {error ? (
        <p role="alert" className="text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm leading-6 text-ink/70">
          Residents see this on their home and upload screens. DuesKo does not
          process payments.
        </p>
      )}
      <Button type="submit" className="h-12 w-full text-base">
        Save how to pay
      </Button>
    </form>
  );
}
