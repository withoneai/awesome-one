/**
 * Re-order the cache newest-first.
 *
 * The cache is built by more than one pass (a plain pull, then an
 * `in:anywhere` pull for archived mail and spam), so the file is only roughly
 * chronological where the passes meet. A run walks the file top to bottom, so
 * "start from today" means the file itself has to be sorted.
 *
 *   node sort-cache.js --dry
 *   node sort-cache.js
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CACHE, clearRunState } from "./lib/env.js";

const DRY = process.argv.includes("--dry");
const FILE = join(CACHE, "threads.jsonl");
if (!existsSync(FILE)) {
  console.log("No cache to sort.");
  process.exit(0);
}

const rows = readFileSync(FILE, "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const at = (r) => {
  const t = Date.parse(r.time || r.started || 0);
  return Number.isNaN(t) ? 0 : t;
};

const before = rows.slice(0, 3).map((r) => (r.time || "").slice(0, 16));
rows.sort((a, b) => at(b) - at(a));
const after = rows.slice(0, 3).map((r) => (r.time || "").slice(0, 16));

const outOfOrder = rows.filter((r, i) => i && at(rows[i - 1]) < at(r)).length;

console.log(`rows:            ${rows.length.toLocaleString()}`);
console.log(`first 3 before:  ${before.join(" | ")}`);
console.log(`first 3 after:   ${after.join(" | ")}`);
console.log(`newest:          ${new Date(at(rows[0])).toISOString().slice(0, 16)}`);
console.log(`oldest:          ${new Date(at(rows[rows.length - 1])).toISOString().slice(0, 16)}`);
console.log(`out-of-order:    ${outOfOrder}`);

if (DRY) {
  console.log("\n--dry, nothing written.");
  process.exit(0);
}

writeFileSync(FILE, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
// Re-ordering the file invalidates any offset recorded against the old order,
// and any snapshot of a run taken from it.
const cleared = clearRunState(CACHE);
console.log(`\nSorted newest-first. Cleared: ${cleared.join(", ")}`);
console.log("The next run starts with today.");
