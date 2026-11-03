import { SampleBadge } from "@/components/status-badge";
import {
  ACKNOWLEDGMENT_FOOTER,
  ACKNOWLEDGMENT_HEADER,
  withTerminalPeriod,
  type AcknowledgmentFields,
} from "@/lib/acknowledgment-copy";

export function PaymentAcknowledgment({
  fields,
  sample = false,
}: {
  fields: AcknowledgmentFields;
  sample?: boolean;
}) {
  return (
    <article className="acknowledgment mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 text-ink print:max-w-none print:rounded-none print:p-0">
      <h1 className="font-heading text-center text-2xl font-semibold tracking-tight">
        {ACKNOWLEDGMENT_HEADER}
      </h1>
      {sample ? (
        <p className="mt-3 flex justify-center">
          <SampleBadge />
        </p>
      ) : null}
      <p className="mt-5 text-base leading-7">
        This is a system-generated record that {fields.hoaName} has recorded the payment below from{" "}
        {fields.residentName}, {withTerminalPeriod(fields.unitLabel)}
      </p>
      <dl className="mt-5 space-y-3 border-y border-dashed border-border py-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Amount</dt>
          <dd className="font-medium">{fields.amount}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">For</dt>
          <dd className="font-medium">{fields.periodOrDescription}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Payment method</dt>
          <dd className="font-medium">{fields.method}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Recorded by</dt>
          <dd className="font-medium">
            {fields.officerLine} on {fields.dateTime}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Reference no.</dt>
          <dd className="font-medium">{fields.dueskoReference}</dd>
        </div>
      </dl>
      <p className="mt-5 text-base leading-7">
        This acknowledgment is issued by {withTerminalPeriod(fields.hoaName)} DuesKo only provides
        the recording software and does not receive or hold HOA funds. For questions about this
        payment, contact your HOA.
      </p>
      <p className="mt-6 text-center text-sm font-bold uppercase tracking-wide">
        {ACKNOWLEDGMENT_FOOTER}
      </p>
    </article>
  );
}
