import seedJson from "./seed.json";
import type { SeedData } from "../types";

/** Local JSON mock. Server and tests only — do not import from a client component. */
export const seed = seedJson as SeedData;
