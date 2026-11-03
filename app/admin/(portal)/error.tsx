"use client";

import { ListError } from "@/components/list-state";

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
      <ListError message={error.message || "This list could not be loaded."} />
    </div>
  );
}
