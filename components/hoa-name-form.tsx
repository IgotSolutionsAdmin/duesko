import { Button } from "@/components/ui/button";
import { saveRegisteredName } from "@/lib/hoa-actions";

export function HoaNameForm({
  registeredName,
  error,
}: {
  registeredName: string;
  error: string | null;
}) {
  return (
    <form action={saveRegisteredName} className="flex flex-col gap-3">
      <label htmlFor="registeredName" className="text-sm font-medium text-ink">
        Registered name
      </label>
      <input
        id="registeredName"
        name="registeredName"
        required
        maxLength={200}
        autoComplete="organization"
        defaultValue={registeredName}
        aria-invalid={error ? true : undefined}
        className="h-12 w-full rounded-xl border border-border bg-white px-3 text-base text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {error ? (
        <p role="alert" className="text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm leading-6 text-ink/70">
          The association&apos;s registered name is required.
        </p>
      )}
      <Button type="submit" className="h-12 w-full text-base">
        Save name
      </Button>
    </form>
  );
}
