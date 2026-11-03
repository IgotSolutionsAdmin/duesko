"use client";

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-12 w-full rounded-2xl border border-border bg-white text-base font-medium text-teal-deep print:hidden"
    >
      {label}
    </button>
  );
}
