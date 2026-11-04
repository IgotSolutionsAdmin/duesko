import { cn } from "@/lib/utils";

export function DuesKoLogo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-heading font-semibold text-teal-deep", className)}>
      {/* Existing brand mark: deep-teal tile and mango disc, same as the in-app wordmark. */}
      <img src="/logo.svg" alt="" width={32} height={32} className={cn("size-8", markClassName)} />
      DuesKo
    </span>
  );
}
