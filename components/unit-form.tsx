import { Button } from "@/components/ui/button";
import { saveUnit } from "@/lib/hoa-actions";
import { centavosToPesoInput } from "@/lib/money";
import type { Unit } from "@/lib/types";

const fieldClass =
  "h-12 w-full rounded-xl border border-border bg-white px-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function UnitForm({
  unit,
  submitLabel,
  error,
  idPrefix,
}: {
  unit?: Unit;
  submitLabel: string;
  error?: string | null;
  idPrefix: string;
}) {
  const rateType = unit?.rateType ?? "flat";
  const labelId = `${idPrefix}-label`;
  const amountId = `${idPrefix}-amount`;
  const areaId = `${idPrefix}-area`;
  const amountHintId = `${idPrefix}-amount-hint`;

  return (
    <form action={saveUnit} className="flex flex-col gap-4">
      {unit ? <input type="hidden" name="unitId" value={unit.id} /> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor={labelId} className="text-sm font-medium text-ink">
          Unit label
        </label>
        <input
          id={labelId}
          name="label"
          required
          maxLength={80}
          defaultValue={unit?.label ?? ""}
          autoComplete="off"
          className={fieldClass}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">How dues are set</legend>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-white px-3 text-base">
          <input
            type="radio"
            name="rateType"
            value="flat"
            defaultChecked={rateType === "flat"}
          />
          Flat monthly amount
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-white px-3 text-base">
          <input
            type="radio"
            name="rateType"
            value="per_sqm"
            defaultChecked={rateType === "per_sqm"}
          />
          Per square metre
        </label>
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor={amountId} className="text-sm font-medium text-ink">
          Amount
        </label>
        <div className="flex h-12 items-center rounded-xl border border-border bg-white px-3 focus-within:ring-3 focus-within:ring-ring/50">
          <span className="text-base font-medium text-teal-deep" aria-hidden>
            ₱
          </span>
          <input
            id={amountId}
            name="amount"
            required
            inputMode="decimal"
            autoComplete="off"
            defaultValue={unit ? centavosToPesoInput(unit.rateCentavos) : ""}
            aria-describedby={amountHintId}
            className="h-full w-full bg-transparent px-2 text-base text-ink outline-none"
          />
        </div>
        <p id={amountHintId} className="text-sm leading-6 text-ink/70">
          A flat monthly amount, or the rate for each square metre.
        </p>
      </div>
      <div className="unit-area gap-2">
        <label htmlFor={areaId} className="text-sm font-medium text-ink">
          Floor area (sqm)
        </label>
        <input
          id={areaId}
          name="areaSqm"
          inputMode="decimal"
          defaultValue={unit?.areaSqm ?? ""}
          className={fieldClass}
        />
        <p className="text-sm leading-6 text-ink/70">
          Required when dues are charged per square metre. Monthly dues are
          this area times the rate.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-12 w-full text-base">
        {submitLabel}
      </Button>
    </form>
  );
}
