import { DEFAULT_HOW_TO_PAY, howToPayOrDefault } from "@/lib/how-to-pay";

export function HowToPayCard({
  howToPay,
}: {
  howToPay?: string | null;
}) {
  return (
    <section
      aria-labelledby="how-to-pay-title"
      className="rounded-xl border border-border bg-white p-5"
      data-testid="how-to-pay"
    >
      <h2 id="how-to-pay-title" className="font-heading text-lg font-semibold">
        How to pay
      </h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        {howToPayOrDefault(howToPay) || DEFAULT_HOW_TO_PAY}
      </p>
    </section>
  );
}
