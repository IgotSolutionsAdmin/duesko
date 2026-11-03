import { isTestSite } from "@/lib/test-site";

export function TestSiteBanner() {
  if (!isTestSite()) return null;
  return (
    <p
      role="status"
      className="shrink-0 bg-mango px-4 py-2 text-center text-sm font-semibold text-ink"
      title="Sample data lives in this server's memory and resets on a cold start. Nothing is saved for real payments."
    >
      TEST SITE - sample data only, not for real payments
    </p>
  );
}
