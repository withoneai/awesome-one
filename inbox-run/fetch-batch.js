/**
 * Pull the next batch of conversations from Gmail into the local cache.
 *
 * Run it again and it picks up where it stopped, because the Gmail page cursor
 * is persisted. Each demo therefore runs on mail Jev has never seen.
 *
 *   node fetch-batch.js            # next BATCH_SIZE from .env (default 5000)
 *   node fetch-batch.js 1000       # next 1000
 *   node fetch-batch.js --reset    # start again from the top of the mailbox
 *   node fetch-batch.js 25000 --query "in:anywhere"
 *
 * On the query: with no query Gmail hands back roughly the inbox and stops —
 * on this mailbox that was 10,539 of 32,796 conversations. "in:anywhere" also
 * reaches archived mail, spam and trash. Each distinct query keeps its own page
 * cursor, and threads already in the cache are skipped, so passes can overlap
 * safely.
 *
 * Concurrency is deliberately 3. Gmail's own quota is the ceiling here, not
 * One: at 3 workers we measured 38 conversations/sec, at 6 it dropped to 25
 * with 39 quota rejections. More parallelism is slower.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, CACHE } from "./lib/env.js";
import { OneClient } from "./lib/one.js";

const WORKERS = 3;
const PAGE = 100;

const env = loadEnv();
const one = new OneClient(env.ONE_SECRET);
const GM = env.GMAIL_KEY;

mkdirSync(CACHE, { recursive: true });
const STATE = join(CACHE, "state.json");
const THREADS = join(CACHE, "threads.jsonl");

const args = process.argv.slice(2);
if (args.includes("--reset")) {
  writeFileSync(STATE, JSON.stringify({ cursor: null, fetched: 0, batches: 0 }, null, 2));
  writeFileSync(THREADS, "");
  console.log("Cache reset. Next run starts at the top of the mailbox.");
  process.exit(0);
}

const want = Number(args.find((a) => /^\d+$/.test(a)) || env.BATCH_SIZE || 5000);
const qi = args.indexOf("--query");
const QUERY = qi !== -1 ? args[qi + 1] : undefined;
const CURSOR_KEY = QUERY ? `cursor:${QUERY}` : "cursor";

/** Thread ids already on disk, so a second pass can overlap the first safely. */
const seenIds = new Set();
if (existsSync(THREADS)) {
  for (const line of readFileSync(THREADS, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { seenIds.add(JSON.parse(line).id); } catch {}
  }
}

function readState() {
  if (!existsSync(STATE)) return { cursor: null, fetched: 0, batches: 0 };
  return JSON.parse(readFileSync(STATE, "utf8"));
}
function writeState(s) {
  writeFileSync(STATE, JSON.stringify(s, null, 2));
}

const state = readState();

const profile = await one.getProfile(GM);
const TOTAL = profile.threadsTotal;
console.log(`Mailbox: ${profile.emailAddress}`);
console.log(`         ${profile.messagesTotal.toLocaleString()} messages · ${TOTAL.toLocaleString()} conversations`);
console.log(`Cache:   ${state.fetched.toLocaleString()} already pulled over ${state.batches} batch(es)`);
console.log(`Pulling: next ${want.toLocaleString()}\n`);

if (state.fetched >= TOTAL) {
  console.log("The whole mailbox is already cached. Use --reset to start over.");
  process.exit(0);
}

if (QUERY) console.log(`Query:   ${QUERY}  (${seenIds.size.toLocaleString()} ids already cached will be skipped)\n`);

const t0 = Date.now();
let got = 0;
let cursor = state[CURSOR_KEY] ?? null;
let exhausted = false;

/**
 * Gmail paging is inherently sequential — each page token comes from the page
 * before it. So we walk tokens sequentially but fetch WORKERS pages at a time
 * by running a small pipeline: collect the next N tokens, then fetch in parallel.
 */
async function collectTokens(n) {
  const tokens = [cursor];
  for (let i = 1; i < n; i++) {
    const res = await one.getThreads({ connectionKey: GM, pageToken: tokens[i - 1] ?? undefined, count: PAGE, query: QUERY });
    // We paid for this page, so keep it — but emit it exactly once, here.
    // (Emitting here AND re-fetching the same token below is what produced
    // 2,573 duplicate rows in the first cache.)
    emit(res.threads || []);
    if (!res.nextPageToken) {
      exhausted = true;
      break;
    }
    tokens.push(res.nextPageToken);
  }
  return tokens;
}

let skipped = 0;
let scanned = 0;
function progress() {
  const el = (Date.now() - t0) / 1000;
  const pct = Math.min(100, (got / want) * 100);
  process.stdout.write(
    `\r  ${got.toLocaleString()}/${want.toLocaleString()} (${pct.toFixed(1)}%) · ` +
      `${(got / el).toFixed(0)}/sec · ${el.toFixed(0)}s · ` +
      `${scanned.toLocaleString()} scanned, ${skipped.toLocaleString()} already cached   `
  );
}
function emit(threads) {
  if (!threads.length) return;
  scanned += threads.length;
  const fresh = threads.filter((t) => {
    if (seenIds.has(t.id)) { skipped++; return false; }
    seenIds.add(t.id);
    return true;
  });
  // A pass that overlaps an earlier one spends its first minutes skipping.
  // Report anyway — silence here reads as a hang.
  if (!fresh.length) { progress(); return; }
  const lines = fresh
    .map((t) => {
      const msgs = t.messages || [];
      const first = msgs[0] || {};
      // Gmail returns a thread's messages oldest-first, so the LAST one is the
      // most recent activity. Ordering by the first message would file a
      // thread started in July under July even if it was replied to today.
      const latest = msgs[msgs.length - 1] || first;
      return JSON.stringify({
        id: t.id,
        messageIds: msgs.map((x) => x.messageId).filter(Boolean),
        sender: String(first.sender || "").slice(0, 120),
        subject: String(first.subject || "").slice(0, 160),
        snippet: String(first.snippet || t.snippet || "").slice(0, 240),
        labelIds: latest.labelIds || first.labelIds || [],
        time: latest.time || first.time || null,
        started: first.time || null,
      });
    })
    .join("\n");
  appendFileSync(THREADS, lines + "\n");
  got += fresh.length;
  progress();
}

while (got < want && !exhausted) {
  const tokens = await collectTokens(WORKERS);
  if (exhausted) break;
  // collectTokens already read and emitted every token except the last one.
  const tail = tokens[tokens.length - 1];
  const res = await one
    .getThreads({ connectionKey: GM, pageToken: tail ?? undefined, count: PAGE, query: QUERY })
    .catch((e) => ({ threads: [], error: e.message }));
  if (res.error) {
    console.error(`\n  page failed, stopping cleanly: ${res.error}`);
    break;
  }
  emit(res.threads || []);
  if (!res.nextPageToken) {
    exhausted = true;
    break;
  }
  cursor = res.nextPageToken;
  writeState({ ...state, [CURSOR_KEY]: cursor, fetched: state.fetched + got, batches: state.batches, total: TOTAL });
}

const el = (Date.now() - t0) / 1000;
writeState({
  ...state,
  [CURSOR_KEY]: exhausted ? null : cursor,
  fetched: state.fetched + got,
  batches: state.batches + 1,
  total: TOTAL,
  lastBatch: { count: got, seconds: Math.round(el), at: new Date().toISOString() },
});

console.log(`\n\nDone. ${got.toLocaleString()} conversations in ${el.toFixed(0)}s (${(got / el).toFixed(0)}/sec).`);
console.log(`Cache now holds ${(state.fetched + got).toLocaleString()} of ${TOTAL.toLocaleString()}.`);
if (exhausted) console.log("Reached the end of the mailbox.");
else console.log("Run again to pull the next batch.");
