import type { ReactNode } from "react";
import { LIST_COPY } from "@/lib/list-states";

export function ListSkeleton({
  rows = 3,
  label = "Loading",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="list-skeleton"
      className="flex flex-col gap-3"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-2xl bg-white"
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ListEmpty({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p
      data-testid="list-empty"
      className="rounded-3xl border border-dashed border-teal/40 bg-white p-5 text-sm leading-6 text-ink/80"
    >
      {children}
    </p>
  );
}

export function ListError({
  message = LIST_COPY.loadError,
}: {
  message?: string;
}) {
  return (
    <p
      role="alert"
      data-testid="list-error"
      className="rounded-3xl bg-white p-5 text-sm leading-6 text-destructive"
    >
      {message}
    </p>
  );
}
