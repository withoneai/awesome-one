/**
 * Undo a run.
 *
 *   node undo.js --dry     # show exactly what would change, touch nothing
 *   node undo.js           # do it
 *
 * Two things get reversed, in this order and for a reason:
 *
 *  1. Archived mail goes back to the inbox. The set is read from the ledger
 *     sheets, not from a Gmail search, because "has a Jev label and is not in
 *     the inbox" would also match mail that was ALREADY archived before any of
 *     this ran — restoring those would push mail back into the inbox that was
 *     deliberately filed away. The ledger records what this tool actually did.
 *
 *  2. The Jev/* labels are deleted. Deleting a label detaches it from every
 *     message, so there is no need to walk messages a second time.
 *
 * The ledger spreadsheets, the HubSpot contacts and the Slack posts are left
 * alone — they are additive and safe to delete by hand. The script names them.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, CACHE, clearRunState } from "./lib/env.js";
import { OneClient, ACTIONS } from "./lib/one.js";

const DRY = process.argv.includes("--dry");
const env = loadEnv();
const one = new OneClient(env.ONE_SECRET);

const SHEETS_GET = "conn_mod_def::GJ30kKk8ogk::hCE5XVrgQ3m0ip3lGzJRfQ";
const CHUNK = 250;
const GAP = 350;
const pace = () => new Promise((r) => setTimeout(r, GAP));

function readRuns() {
  const p = join(CACHE, "runs.json");
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return [];
  }
}

/** Pull a ledger back out of Sheets and return the threads this tool archived. */
async function archivedFrom(spreadsheetId) {
  const res = await one.call({
    path: `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Classifications!A1:M10000")}`,
    actionId: SHEETS_GET,
    connectionKey: env.SHEETS_KEY,
  });
  const rows = res.values || [];
  if (!rows.length) return [];
  // Column order changed between runs (a Received column was added), so look
  // the columns up by header rather than by position.
  const head = rows[0].map((h) => String(h).toLowerCase());
  // Headers were rewritten to be self-explanatory ("Jev: sent to a mailing
  // list, not to you (0-1)", "Gmail thread id"), so match on a substring that
  // survives both generations rather than on an exact string.
  const iBulk = head.findIndex((h) => h.includes("sent to a list") || h.includes("sent to a mailing list"));
  const iThread = head.findIndex((h) => h === "thread" || h.includes("thread id"));
  if (iBulk === -1 || iThread === -1) return [];
  return rows
    .slice(1)
    .filter((r) => Number(r[iBulk]) > 0.9 && r[iThread])
    .map((r) => String(r[iThread]));
}

const runs = readRuns();
const sheetIds = [
  ...new Set(
    runs
      .map((r) => r.sheetUrl)
      .filter(Boolean)
      .map((u) => (u.match(/\/d\/([^/]+)/) || [])[1])
      .filter(Boolean)
  ),
];

// Runs recorded before the history file existed still need undoing.
const extra = process.argv.filter((a) => a.startsWith("sheet:")).map((a) => a.slice(6));
for (const id of extra) if (!sheetIds.includes(id)) sheetIds.push(id);

if (!sheetIds.length) {
  console.log("No ledger sheets known, so nothing can be un-archived safely.");
  console.log("Pass them explicitly:  node undo.js sheet:<spreadsheetId> sheet:<spreadsheetId>");
}

console.log(`Ledgers to read: ${sheetIds.length}`);
const threadIds = new Set();
for (const id of sheetIds) {
  try {
    const t = await archivedFrom(id);
    t.forEach((x) => threadIds.add(x));
    console.log(`  ${id.slice(0, 14)}…  ${t.length} archived threads`);
  } catch (e) {
    console.log(`  ${id.slice(0, 14)}…  could not read: ${e.message.slice(0, 80)}`);
  }
}

// The ledger stores thread ids, but Gmail has no batch endpoint for threads —
// only messages/batchModify. The cache already holds the message ids for every
// thread it pulled, so resolve through that rather than making 394 single calls.
const byThread = new Map();
const cachePath = join(CACHE, "threads.jsonl");
if (existsSync(cachePath)) {
  for (const line of readFileSync(cachePath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const t = JSON.parse(line);
      if (threadIds.has(t.id)) byThread.set(t.id, t.messageIds || []);
    } catch {}
  }
}
const ids = [...byThread.values()].flat().filter(Boolean);
const unresolved = [...threadIds].filter((t) => !byThread.has(t));
console.log(`\nWill restore INBOX on ${ids.length} messages across ${byThread.size} threads`);
if (unresolved.length) console.log(`  ${unresolved.length} threads not in the cache — will fall back to one call each`);

const labels = await one.listLabels(env.GMAIL_KEY);
const jev = (labels.labels || []).filter((l) => l.type === "user" && l.name.startsWith("Jev/"));
console.log(`Will delete ${jev.length} labels: ${jev.map((l) => l.name).join(", ")}`);

if (DRY) {
  console.log("\n--dry, nothing changed.");
  process.exit(0);
}

// 1. back to the inbox
let restored = 0;
for (let i = 0; i < ids.length; i += CHUNK) {
  const chunk = ids.slice(i, i + CHUNK);
  try {
    await one.batchModify(env.GMAIL_KEY, chunk, ["INBOX"], []);
    restored += chunk.length;
    process.stdout.write(`\r  restored ${restored}/${ids.length}   `);
  } catch (e) {
    console.log(`\n  chunk failed: ${e.message.slice(0, 120)}`);
  }
  await pace();
}
console.log();

// Anything the cache could not resolve gets the single-thread endpoint.
for (const t of unresolved) {
  try {
    await one.call({
      path: `/gmail/v1/users/me/threads/${t}/modify`,
      actionId: "conn_mod_def::GJ3olIfJ9E0::xBAV1bF_RXG94_j4bmye2A",
      connectionKey: env.GMAIL_KEY,
      method: "POST",
      body: { addLabelIds: ["INBOX"], removeLabelIds: [] },
    });
  } catch (e) {
    console.log(`  thread ${t} failed: ${e.message.slice(0, 90)}`);
  }
  await pace();
}

// 2. remove the labels everywhere by deleting them
for (const l of jev) {
  try {
    await one.call({
      path: `/gmail/v1/users/me/labels/${l.id}`,
      actionId: "conn_mod_def::GJ3obewI1xs::RsgLyhF9Tr6nNRDbhTHO1Q",
      connectionKey: env.GMAIL_KEY,
      method: "DELETE",
    });
    console.log(`  deleted ${l.name}`);
  } catch (e) {
    console.log(`  ${l.name} failed: ${e.message.slice(0, 100)}`);
  }
  await pace();
}

// 3. rewind everything that describes a run
const cleared = clearRunState(CACHE);
console.log(`\nCleared: ${cleared.join(", ")}`);
console.log("Demo cursor rewound to 0. Next run starts at the top of the cache.");
console.log("\nLeft in place (delete by hand if you want them gone):");
sheetIds.forEach((id) => console.log(`  sheet  https://docs.google.com/spreadsheets/d/${id}`));
console.log(`  hubspot contacts created by earlier runs`);
console.log(`  slack posts in ${env.SLACK_CHANNEL || "#general"}`);
