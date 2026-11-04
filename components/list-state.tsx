import type { ReactNode } from "react";
import Link from "next/link";
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
          className="h-16 animate-pulse rounded-xl border border-border bg-white"
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
    <div
      data-testid="list-empty"
      className="rounded-xl border border-dashed border-border bg-white p-5 text-[13px] leading-6 text-ink/80"
    >
      {children}
    </div>
  );
}

export function ListError({
  message = LIST_COPY.loadError,
  retryHref,
}: {
  message?: string;
  retryHref?: string;
}) {
  return (
    <div
      role="alert"
      data-testid="list-error"
      className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 text-[13px] leading-6 text-destructive"
    >
      <p>{message}</p>
      {retryHref ? (
        <Link
          href={retryHref}
          className="inline-flex h-12 min-h-11 items-center justify-center rounded-2xl border border-border bg-mist text-base font-medium text-ink"
        >
          Retry
        </Link>
      ) : null}
    </div>
  );
}
