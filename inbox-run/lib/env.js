import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal .env reader — no dependency, ignores comments and blank lines. */
export function loadEnv() {
  const out = {};
  let raw = "";
  try {
    raw = readFileSync(join(ROOT, ".env"), "utf8");
  } catch {
    throw new Error("No .env found. Copy .env.example and fill in your keys.");
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  const required = ["ONE_SECRET", "TYPESAFE_API_KEY", "GMAIL_KEY"];
  const missing = required.filter((k) => !out[k]);
  if (missing.length) throw new Error(`.env is missing: ${missing.join(", ")}`);
  return out;
}

export const CACHE = join(ROOT, "cache");

/**
 * Clear every file that describes what has been RUN, leaving the cached mail
 * and the Gmail fetch cursor alone.
 *
 * These have to move together. undo.js used to reset the cursor and the run
 * history but not the screen snapshot, so after a rollback the dashboard
 * happily restored a finished run — "722 labelled, 77 archived" — describing
 * labels that no longer existed.
 */
export function clearRunState(cacheDir) {
  const files = ["demo.json", "runs.json", "last-run.json"];
  const cleared = [];
  for (const f of files) {
    const p = join(cacheDir, f);
    if (!existsSync(p)) continue;
    if (f === "demo.json") writeFileSync(p, JSON.stringify({ offset: 0, runs: 0 }, null, 2));
    else if (f === "runs.json") writeFileSync(p, "[]");
    else rmSync(p);
    cleared.push(f);
  }
  return cleared;
}
