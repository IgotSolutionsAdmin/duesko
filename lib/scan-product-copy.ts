import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { forbiddenOnlinePayPhrases } from "./forbidden-online-pay";

const ROOT = join(import.meta.dirname, "..");

const SCAN_DIRS = ["app", "components", "lib", "docs", "e2e", "tests"] as const;

const SCAN_FILES = ["README.md", "DEPLOY.md"] as const;

const SKIP_PATH_PARTS = [
  `${join("lib", "forbidden-online-pay.ts")}`,
  `${join("lib", "scan-product-copy.ts")}`,
  `${join("tests", "forbidden-online-pay.test.ts")}`,
  `${join("supabase", "migrations")}`,
  "node_modules",
  ".next",
];

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mdx"]);

function shouldScan(relativePath: string): boolean {
  if (SKIP_PATH_PARTS.some((part) => relativePath.includes(part))) return false;
  if (relativePath.endsWith(".test.ts") && relativePath.includes("forbidden-online-pay")) {
    return false;
  }
  return TEXT_EXTENSIONS.has(relativePath.slice(relativePath.lastIndexOf(".")));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (!shouldScan(rel)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (stat.isFile()) out.push(full);
  }
  return out;
}

export type CopyViolation = { file: string; phrase: string };

/** Scans UI, lib, docs, and tests for banned online-payment product wording. */
export function scanProductCopyForOnlinePay(): CopyViolation[] {
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    const full = join(ROOT, dir);
    try {
      walk(full, files);
    } catch {
      /* missing dir */
    }
  }
  for (const name of SCAN_FILES) {
    const full = join(ROOT, name);
    try {
      if (shouldScan(name)) files.push(full);
    } catch {
      /* missing */
    }
  }

  const violations: CopyViolation[] = [];
  for (const file of files) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      if (
        line.includes("FORBIDDEN_ONLINE_PAY_PHRASES") ||
        line.includes("onlinePayForbiddenRegex") ||
        (line.includes("\\b") && /payment|gateway|paymongo|checkout/i.test(line))
      ) {
        continue;
      }
      for (const phrase of forbiddenOnlinePayPhrases(line)) {
        violations.push({ file: rel, phrase });
      }
    }
  }
  return violations;
}
