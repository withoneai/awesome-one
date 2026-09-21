/**
 * The demo server.
 *
 *   node server.js            → http://localhost:4300
 *
 * Holds the keys, serves the dashboard, and streams a live run over SSE.
 * Nothing is written to any account unless the run is started in "live" mode,
 * and even then only to a bounded slice you choose in the UI.
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, createReadStream } from "node:fs";
import { join, extname } from "node:path";
import { createInterface } from "node:readline";
import { loadEnv, ROOT, CACHE } from "./lib/env.js";
import { OneClient } from "./lib/one.js";
import { JevClient, toEmail, toVerdicts, assertReadable, parseEmail, BATCH, PRICE_PER_TOKEN, CATEGORY_KEYS, RULES } from "./lib/jev.js";

const PORT = Number(process.env.PORT || 4300);
// LOOPBACK ONLY, DELIBERATELY.
//
// There is no authentication in front of /api/run, and a run writes to real
// Gmail, Sheets, HubSpot and Slack accounts. listen(PORT) with no host binds
// every interface, so on shared wifi anyone who guessed the port could press
// Run against someone else's mailbox. Set HOST=0.0.0.0 to opt out, knowing
// that is what you are opting into.
const HOST = process.env.HOST || "127.0.0.1";
const JEV_WORKERS = 16; // measured sweet spot: 258 conv/sec, zero errors

const env = loadEnv();
const one = new OneClient(env.ONE_SECRET);
const jev = new JevClient(env.TYPESAFE_API_KEY);

const LABEL_PREFIX = "Jev";

/**
 * Gmail meters batchModify by the number of messages touched, not by call
 * count, so firing 1,000-id batches back to back trips "Units per minute"
 * mid-run. Smaller chunks with a gap between them stay under it; the client
 * still retries with backoff if we misjudge.
 */
const GMAIL_CHUNK = 250;
const GMAIL_GAP_MS = 350;
const pace = () => new Promise((r) => setTimeout(r, GMAIL_GAP_MS));

const URGENCY_WORDS = ["Can wait a month", "This week", "Today", "Right now"];

/** Turn the 0-3 rubric position back into the rung a reader can act on. */
function urgencyWord(score) {
  const i = Math.max(0, Math.min(3, Math.round(Number(score) || 0)));
  return URGENCY_WORDS[i];
}

/** Say what actually happened to this thread, in the row itself. */
function describeAction(v) {
  const bits = [];
  if (v.bulk > RULES.archiveAbove) bits.push("Archived (out of inbox)");
  else bits.push("Left in inbox");
  bits.push(`Labelled Jev/${v.category[0].toUpperCase()}${v.category.slice(1)}`);
  if (v.needsYou > RULES.needsYouAbove) bits.push("On your short list");
  if (v.category === "lead") bits.push("Added to HubSpot");
  return bits.join(" · ");
}

/** The legend tab. Every number in this file needs one. */
const LEGEND = [
  ["How to read this ledger"],
  [""],
  ["Each row is one Gmail conversation. Two systems produced it."],
  [""],
  ["JEV answered four questions about the email. It has no credentials and"],
  ["cannot touch an account — it only returns typed answers with probabilities."],
  ["ONE then acted on those answers across Gmail, Sheets, HubSpot and Slack."],
  ["The thresholds below live in code, not in the model."],
  [""],
  ["Column", "What it means", "Range", "What it triggers"],
  [
    "Jev: category",
    "Which one of nine kinds of email this is. Jev picks from a fixed list, so a tenth value is impossible.",
    "newsletter, invoice, customer, lead, recruiting, calendar, alert, personal, other",
    "The Gmail label applied to the thread.",
  ],
  [
    "Jev: how sure of that category",
    "Calibrated confidence in the category above. 0.99 means it is near-certain; 0.38 means the email was genuinely ambiguous.",
    "0 to 1",
    "Nothing on its own. Use it to spot rows worth a second look.",
  ],
  [
    "Jev: sent to a mailing list",
    "Probability this was blasted to many recipients rather than written to you. Deliberately separate from category: a recruiter blast and a real person about a job are both 'recruiting'.",
    "0 to 1",
    "Above 0.90 the thread is archived. This is the number that empties the inbox.",
  ],
  [
    "Jev: needs you personally",
    "Probability that a human has to do something about this that has not been done yet.",
    "0 to 1",
    "Above 0.85 it goes on the short list posted to Slack.",
  ],
  [
    "Jev: urgency",
    "Position on a four-rung rubric, returned as a float. 2.88 means 'between today and right now, closer to right now'.",
    "0 = can wait a month, 1 = this week, 2 = today, 3 = right now",
    "Orders the short list. The next column is the same value in words.",
  ],
  [
    "What One did about it",
    "The actions actually carried out for this row.",
    "",
    "",
  ],
  [""],
  ["Nothing here was deleted, marked read, replied to or forwarded."],
  ["Archiving only removes the INBOX label — the mail is still in All Mail,"],
  ["and `node undo.js` restores it using this ledger as the record."],
];

/** Gmail hands back RFC-2822 dates; Sheets sorts ISO properly, so normalise. */
function sheetDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? String(raw) : d.toISOString().slice(0, 16).replace("T", " ");
}
const SLICE = Number(process.env.SLICE || 2000); // one demo = one slice
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// ---------------------------------------------------------------- cache

function readState() {
  const p = join(CACHE, "state.json");
  if (!existsSync(p)) return { cursor: null, fetched: 0, batches: 0, total: null };
  return JSON.parse(readFileSync(p, "utf8"));
}

/**
 * The demo cursor is separate from the fetch cursor.
 * Fetching walks Gmail once; this walks the cache 2,000 at a time so each
 * demo runs on conversations the previous demo never touched.
 */
const DEMO = join(CACHE, "demo.json");
function readDemo() {
  if (!existsSync(DEMO)) return { offset: 0, runs: 0 };
  try { return JSON.parse(readFileSync(DEMO, "utf8")); } catch { return { offset: 0, runs: 0 }; }
}
function writeDemo(d) { writeFileSync(DEMO, JSON.stringify(d, null, 2)); }

async function loadThreads(limit, offset = 0) {
  const p = join(CACHE, "threads.jsonl");
  if (!existsSync(p)) return [];
  const out = [];
  let seen = 0;
  const rl = createInterface({ input: createReadStream(p), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (seen++ < offset) continue;
    try {
      out.push(JSON.parse(line));
    } catch {}
    if (limit && out.length >= limit) break;
  }
  return out;
}

async function countCached() {
  const p = join(CACHE, "threads.jsonl");
  if (!existsSync(p)) return 0;
  let n = 0;
  const rl = createInterface({ input: createReadStream(p), crlfDelay: Infinity });
  for await (const l of rl) if (l.trim()) n++;
  return n;
}

// ---------------------------------------------------------------- the run

async function runPipeline(send, { mode, limit, writeLimit, offset }) {
  const state = readState();
  const demo = readDemo();
  const cached = await countCached();
  const size = limit || SLICE;
  const start = offset != null ? offset : demo.offset;

  if (start >= cached && cached > 0) {
    send({
      type: "error",
      message: `Every cached conversation has been used across ${demo.runs} run(s). Reset the demo cursor to start again.`,
    });
    return;
  }

  const threads = await loadThreads(size, start);
  if (!threads.length) {
    send({ type: "error", message: "Cache is empty. Run: node fetch-batch.js 28000" });
    return;
  }

  try {
    assertReadable(threads);
  } catch (e) {
    send({ type: "error", message: e.message });
    return;
  }

  const sliceNo = Math.floor(start / SLICE) + 1;
  const sliceTotal = Math.max(1, Math.ceil(cached / SLICE));

  send({
    type: "start",
    total: threads.length,
    cached,
    mailbox: state.total,
    mode,
    offset: start,
    sliceNo,
    sliceTotal,
    at: Date.now(),
  });

  // --- phase 1: classify, live against Jev -----------------------------
  const batches = [];
  for (let i = 0; i < threads.length; i += BATCH) batches.push(threads.slice(i, i + BATCH));

  const verdicts = [];
  const wallRows = [];
  let tokens = 0;
  let failed = 0;
  const t0 = Date.now();
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= batches.length) return;
      const batch = batches[idx];
      const emails = batch.map((t, i) => toEmail(t, i + 1));
      try {
        const res = await jev.classify(emails);
        tokens += res.usage?.input_tokens ?? 0;
        const v = toVerdicts(batch, emails, res.answers);
        // WHERE THIS BATCH SITS IN THE SLICE.
        //
        // The cache is sorted newest-first, so position in the slice IS date
        // descending. But 16 workers finish batches out of order and each one
        // sends the moment it returns, so the stream arrived in COMPLETION
        // order — which is why a 1 Sept row could land above an 18 Sept one.
        // Stamping the absolute index lets both the wall and the ledger be put
        // back into date order without giving up concurrent classification.
        // Absolute position in the CACHE, not in this slice. Run 2 reads
        // offset 2,000 onward — older mail — so its rows must sort below
        // run 1's. A slice-relative index would restart at 0 and interleave.
        const base = start + idx * BATCH;
        v.forEach((x, j) => { x.i = base + j; });
        verdicts.push(...v);
        const shaped = v.map((x) => ({
            i: x.i,
            s: x.sender.replace(/\s*<.*>/, "").replace(/^"|"$/g, "").slice(0, 38),
            d: (x.sender.match(/@([\w.-]+)/) || [, ""])[1].slice(0, 30),
            t: x.subject,
            dt: x.received,
            c: x.category,
            cf: x.confidence,
            b: x.bulk,
            y: x.needsYou,
            u: x.urgency,
        }));
        wallRows.push(...shaped);
        wallRows.sort((a, b) => a.i - b.i);
        if (wallRows.length > WALL_ROWS) wallRows.length = WALL_ROWS;
        send({
          type: "verdicts",
          rows: shaped,
          done: verdicts.length,
          total: threads.length,
          tokens,
          elapsed: (Date.now() - t0) / 1000,
          cost: tokens * PRICE_PER_TOKEN,
        });
      } catch (e) {
        failed += batch.length;
        send({ type: "warn", message: `batch ${idx}: ${e.message}` });
      }
    }
  }

  await Promise.all(Array.from({ length: JEV_WORKERS }, worker));
  // Restore cache order (newest first) after concurrent classification, so the
  // Sheets ledger reads top-to-bottom newest-first like the wall does.
  verdicts.sort((a, b) => a.i - b.i);
  const classifySeconds = (Date.now() - t0) / 1000;

  send({
    type: "classified",
    count: verdicts.length,
    failed,
    seconds: classifySeconds,
    rate: verdicts.length / classifySeconds,
    tokens,
    cost: tokens * PRICE_PER_TOKEN,
  });

  // --- the buckets. Thresholds live here, in code, not in the model. ---
  const byCategory = {};
  for (const k of CATEGORY_KEYS) byCategory[k] = [];
  for (const v of verdicts) (byCategory[v.category] ||= []).push(v);

  const toArchive = verdicts.filter((v) => v.bulk > RULES.archiveAbove);
  const needsYou = verdicts
    .filter((v) => v.needsYou > RULES.needsYouAbove)
    .sort((a, b) => b.urgency - a.urgency);
  const leads = byCategory.lead || [];

  send({
    type: "plan",
    categories: Object.fromEntries(CATEGORY_KEYS.map((k) => [k, byCategory[k].length])),
    archive: toArchive.length,
    needsYou: needsYou.length,
    leads: leads.length,
    shortList: needsYou.slice(0, 15).map((v) => ({ t: v.subject, s: v.sender, c: v.category, y: v.needsYou, u: v.urgency })),
  });

  if (mode !== "live") {
    advance(start, threads.length, cached);
    const rec = recordRun({
      mode: "dry", offset: start, count: verdicts.length, failed,
      seconds: Number(classifySeconds.toFixed(2)), cost: tokens * PRICE_PER_TOKEN,
      categories: Object.fromEntries(CATEGORY_KEYS.map((k) => [k, byCategory[k].length])),
      archive: toArchive.length, needsYou: needsYou.length, leads: leads.length,
      labelled: 0, archived: 0, sheetRows: 0, contacts: 0, slack: false, sheetUrl: null,
    });
    snapshot(rec, { rows: wallRows, shortList: needsYou.slice(0, 14).map((v) => ({ t: v.subject, c: v.category, y: v.needsYou, u: v.urgency })) });
    send({ type: "done", mode: "dry", seconds: classifySeconds, run: rec, nextOffset: readDemo().offset });
    return;
  }

  // --- phase 2: act, for real, on a bounded slice ----------------------
  send({ type: "phase", name: "acting" });
  const cap = writeLimit || 2000;
  const did = { labelled: 0, archived: 0, sheetRows: 0, contacts: 0, contactsNew: 0, contactsExisting: 0, slack: false, sheetUrl: null, hubspotUrl: null };

  // Every write stage is timed and reported. The action phase is sequential
  // and Gmail has to be paced, so Slack — which summarises everything — lands
  // well after the ledger. Without these numbers that gap just looks broken.
  const stageTimes = {};
  const stage = async (name, fn) => {
    const t = Date.now();
    try { await fn(); } finally {
      stageTimes[name] = (Date.now() - t) / 1000;
      send({ type: "stage", name, seconds: stageTimes[name] });
    }
  };

  const gmailWork = (async () => {
  // 2a. labels
  await stage("labels", async () => {
  try {
    const existing = await one.listLabels(env.GMAIL_KEY);
    const byName = Object.fromEntries((existing.labels || []).map((l) => [l.name, l.id]));
    const labelIds = {};
    for (const k of CATEGORY_KEYS) {
      const name = `${LABEL_PREFIX}/${k[0].toUpperCase()}${k.slice(1)}`;
      if (byName[name]) {
        labelIds[k] = byName[name];
      } else {
        const made = await one.createLabel(env.GMAIL_KEY, name);
        labelIds[k] = made.id;
        send({ type: "action", key: "label", detail: `created ${name}` });
      }
    }

    let labelled = 0;
    for (const k of CATEGORY_KEYS) {
      const slice = byCategory[k].slice(0, cap);
      const ids = slice.flatMap((v) => v.messageIds).filter(Boolean);
      for (let i = 0; i < ids.length; i += GMAIL_CHUNK) {
        const chunk = ids.slice(i, i + GMAIL_CHUNK);
        await one.batchModify(env.GMAIL_KEY, chunk, [labelIds[k]], []);
        labelled += chunk.length;
        did.labelled = labelled;
        send({ type: "action", key: "label", count: labelled, detail: `${k}` });
        await pace();
      }
    }
  } catch (e) {
    send({ type: "warn", message: `labels: ${e.message}` });
  }
  });

  // 2b. archive — remove INBOX only. Nothing is deleted.
  await stage("archive", async () => {
  try {
    const ids = toArchive.slice(0, cap).flatMap((v) => v.messageIds).filter(Boolean);
    let archived = 0;
    for (let i = 0; i < ids.length; i += GMAIL_CHUNK) {
      const chunk = ids.slice(i, i + GMAIL_CHUNK);
      await one.batchModify(env.GMAIL_KEY, chunk, [], ["INBOX"]);
      archived += chunk.length;
      did.archived = archived;
      send({ type: "action", key: "arch", count: archived });
      await pace();
    }
  } catch (e) {
    send({ type: "warn", message: `archive: ${e.message}` });
  }
  });
  })();

  let sheetUrl = null;

  const ledgerWork = (async () => {
  // 2c. the ledger
  await stage("sheet", async () => {
  try {
    if (env.SHEETS_KEY) {
      const title = `Inbox Run · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
      const sheet = await one.createSheet(env.SHEETS_KEY, title);
      sheetUrl = sheet.spreadsheetUrl;
      did.sheetUrl = sheetUrl;
      const header = [[
        "Received",
        "Subject",
        "Sender",
        "Jev: category (1 of 9)",
        "Jev: how sure of that category (0-1)",
        "Jev: sent to a mailing list, not to you (0-1)",
        "Jev: needs you personally (0-1)",
        "Jev: urgency (0 = can wait a month, 3 = right now)",
        "Urgency in words",
        "What One did about it",
        "Gmail thread id",
      ]];
      await one.appendRows(env.SHEETS_KEY, sheet.spreadsheetId, "Classifications!A1", header);
      await one.appendRows(env.SHEETS_KEY, sheet.spreadsheetId, "How to read this!A1", LEGEND);
      let written = 0;
      const rows = verdicts.slice(0, cap).map((v) => [
        sheetDate(v.received),
        v.subject,
        v.sender,
        v.category,
        v.confidence,
        v.bulk,
        v.needsYou,
        v.urgency,
        urgencyWord(v.urgency),
        describeAction(v),
        v.threadId,
      ]);
      for (let i = 0; i < rows.length; i += 500) {
        await one.appendRows(env.SHEETS_KEY, sheet.spreadsheetId, "Classifications!A1", rows.slice(i, i + 500));
        written += Math.min(500, rows.length - i);
        did.sheetRows = written;
        send({ type: "action", key: "sheet", count: written, url: sheetUrl });
      }
    }
  } catch (e) {
    send({ type: "warn", message: `sheets: ${e.message}` });
  }
  });

  // 2d. leads into the CRM
  await stage("hubspot", async () => {
  try {
    if (env.HUBSPOT_KEY && leads.length) {
      let portal = null;
      try {
        portal = await one.hubspotPortal(env.HUBSPOT_KEY);
        did.hubspotUrl = `https://${portal.domain}/contacts/${portal.portalId}/objects/0-1/views/all/list`;
        send({ type: "action", key: "hub", url: did.hubspotUrl });
      } catch {
        /* linking is a convenience; never fail the run over it */
      }
      let made = 0;
      let skippedNoEmail = 0;
      let existed = 0;

      // A CONTACT IS AN ADDRESS, NOT A CONVERSATION.
      //
      // One sender can send many lead-shaped emails — in testing, a single
      // vendor's notification address accounted for six of eleven leads in one
      // 2,000 batch. Creating per conversation issued six calls for that one
      // address: the first made the contact and the other five came back 409.
      // Counting those 409s as successes is what put "11 contacts" on the tile
      // when HubSpot only ever held six rows.
      //
      // So collapse to distinct addresses first, and keep created and
      // already-present apart from each other afterwards.
      const byEmail = new Map();
      for (const v of leads) {
        const email = parseEmail(v.sender);
        if (!email) {
          skippedNoEmail++;
          continue;
        }
        if (!byEmail.has(email)) byEmail.set(email, v);
      }
      const unique = [...byEmail.entries()].slice(0, 25);
      const duplicates = leads.length - skippedNoEmail - byEmail.size;

      for (const [email, v] of unique) {
        const name = v.sender.replace(/\s*<.*>/, "").replace(/^"|"$/g, "").trim();
        try {
          await one.createContact(env.HUBSPOT_KEY, {
            email,
            firstname: name.split(" ")[0] || "",
            lastname: name.split(" ").slice(1).join(" ") || "",
          });
          made++;
        } catch (e) {
          // 409 means this address is already a contact — from an earlier run,
          // or because it is genuinely already in the CRM. It is still one row
          // in HubSpot, so it counts toward the total but NOT toward "created".
          if (e.status === 409 || /already exists/i.test(e.message)) {
            existed++;
          } else {
            send({ type: "warn", message: `hubspot ${email}: ${e.message.slice(0, 160)}` });
            continue;
          }
        }
        did.contacts = made + existed;
        did.contactsNew = made;
        did.contactsExisting = existed;
        send({
          type: "action", key: "hub", count: did.contacts,
          made, existing: existed, detail: email,
          url: did.hubspotUrl,
        });
      }

      if (duplicates > 0) {
        send({
          type: "warn",
          message: `hubspot: ${leads.length} lead emails came from ${byEmail.size} addresses — ` +
            `${duplicates} were repeat senders and became one contact each`,
        });
      }
      if (skippedNoEmail) send({ type: "warn", message: `hubspot: ${skippedNoEmail} lead(s) had no parseable address` });
    }
  } catch (e) {
    send({ type: "warn", message: `hubspot: ${e.message}` });
  }
  });
  })();

  // Gmail's quota pool is separate from Sheets' and HubSpot's, so these run
  // together rather than end to end. Slack waits for both because its message
  // reports what they did.
  const phaseStart = Date.now();
  await Promise.all([gmailWork, ledgerWork]);
  stageTimes.writes = (Date.now() - phaseStart) / 1000;
  send({ type: "stage", name: "writes", seconds: stageTimes.writes });

  // 2e. tell the room
  await stage("slack", async () => {
  try {
    if (env.SLACK_KEY) {
      const cost = (tokens * PRICE_PER_TOKEN).toFixed(2);
      const top = needsYou.slice(0, 5).map((v, i) => `${i + 1}. *${v.subject.slice(0, 90)}* — _${v.sender.replace(/\s*<.*>/, "")}_`).join("\n");
      const text =
        `*Inbox Run complete*\n` +
        `${verdicts.length.toLocaleString()} conversations · ${(verdicts.length * 4).toLocaleString()} typed decisions · ` +
        `${classifySeconds.toFixed(1)}s · $${cost}\n\n` +
        `Archived ${toArchive.length.toLocaleString()} · ${needsYou.length} need you personally · ` +
        `${did.contacts} lead contacts in HubSpot (from ${leads.length} lead emails)` +
        (sheetUrl ? `\n<${sheetUrl}|Open the full ledger>` : "") +
        (top ? `\n\n*Top of your list*\n${top}` : "");
      await one.slackPost(env.SLACK_KEY, env.SLACK_CHANNEL || "#general", text);
      did.slack = true;
      send({ type: "action", key: "slack", count: 1, detail: env.SLACK_CHANNEL || "#general" });
    }
  } catch (e) {
    send({ type: "warn", message: `slack: ${e.message}` });
  }
  });

  advance(start, threads.length, cached);
  const rec = recordRun({
    mode: "live", offset: start, count: verdicts.length, failed,
    seconds: Number(classifySeconds.toFixed(2)), cost: tokens * PRICE_PER_TOKEN,
    categories: Object.fromEntries(CATEGORY_KEYS.map((k) => [k, byCategory[k].length])),
    archive: toArchive.length, needsYou: needsYou.length, leads: leads.length,
    ...did,
    stageTimes,
  });
  snapshot(rec, { rows: wallRows, shortList: needsYou.slice(0, 14).map((v) => ({ t: v.subject, c: v.category, y: v.needsYou, u: v.urgency })) });
  send({ type: "done", mode: "live", seconds: classifySeconds, sheetUrl, run: rec, nextOffset: readDemo().offset });
}

const RUNS = join(CACHE, "runs.json");
const LAST = join(CACHE, "last-run.json");

/**
 * A snapshot of the finished screen, so a browser refresh restores what the
 * last run looked like instead of resetting everything to zero. Only the rows
 * the wall can actually show are kept — the full detail lives in the ledger.
 */
// The dashboard virtualises the stream, so it can hold everything a run
// produced. Persist a generous slice for refresh-restore without letting the
// snapshot file grow without bound.
const WALL_ROWS = 2000;
function writeLast(snap) { writeFileSync(LAST, JSON.stringify(snap)); }
function readLast() {
  if (!existsSync(LAST)) return null;
  try { return JSON.parse(readFileSync(LAST, "utf8")); } catch { return null; }
}
function readRuns() {
  if (!existsSync(RUNS)) return [];
  try { return JSON.parse(readFileSync(RUNS, "utf8")); } catch { return []; }
}
/** One record per completed run — this is what the dashboard's history reads. */
function recordRun(r) {
  const all = readRuns();
  all.unshift({ n: all.length + 1, at: new Date().toISOString(), ...r });
  writeFileSync(RUNS, JSON.stringify(all, null, 2));
  return all[0];
}

function snapshot(rec, extra) {
  writeLast({
    at: rec.at, mode: rec.mode, count: rec.count, seconds: rec.seconds,
    cost: rec.cost, decisions: rec.count * 4, categories: rec.categories,
    archive: rec.archive, needsYou: rec.needsYou, leads: rec.leads,
    labelled: rec.labelled, archived: rec.archived, sheetRows: rec.sheetRows,
    contacts: rec.contacts, slack: rec.slack, sheetUrl: rec.sheetUrl, hubspotUrl: rec.hubspotUrl,
    ...extra,
  });
}

/** Only move the cursor forward, and only past what we actually classified. */
function advance(start, used, cached) {
  const d = readDemo();
  const next = Math.min(cached, start + used);
  if (next > d.offset) writeDemo({ offset: next, runs: (d.runs || 0) + 1, lastRunAt: new Date().toISOString() });
}

// ---------------------------------------------------------------- http

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/status") {
    const state = readState();
    const demo = readDemo();
    const cached = await countCached();
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        ...state,
        cached,
        channel: env.SLACK_CHANNEL || "#general",
        slice: SLICE,
        offset: demo.offset,
        runs: demo.runs || 0,
        remaining: Math.max(0, cached - demo.offset),
        slicesLeft: Math.max(0, Math.ceil((cached - demo.offset) / SLICE)),
        slicesTotal: Math.max(1, Math.ceil(cached / SLICE)),
        sliceNo: Math.floor(demo.offset / SLICE) + 1,
      })
    );
    return;
  }

  if (url.pathname === "/api/last-run") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(readLast()));
    return;
  }

  if (url.pathname === "/api/runs") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(readRuns()));
    return;
  }

  if (url.pathname === "/api/demo-cursor" && req.method === "POST") {
    const to = Number(url.searchParams.get("offset") || 0);
    writeDemo({ offset: Math.max(0, to), runs: to === 0 ? 0 : readDemo().runs || 0 });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(readDemo()));
    return;
  }

  if (url.pathname === "/api/run") {
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
    const mode = url.searchParams.get("mode") === "live" ? "live" : "dry";
    const limit = Number(url.searchParams.get("limit") || 0) || undefined;
    const writeLimit = Number(url.searchParams.get("writeLimit") || 0) || undefined;
    const offsetParam = url.searchParams.get("offset");
    const offset = offsetParam == null ? undefined : Number(offsetParam);
    try {
      await runPipeline(send, { mode, limit, writeLimit, offset });
    } catch (e) {
      send({ type: "error", message: e.message });
    }
    res.end();
    return;
  }

  // static
  let p = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = join(ROOT, "public", p);
  if (!file.startsWith(join(ROOT, "public")) || !existsSync(file)) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  const s = readState();
  console.log(`\n  Inbox Run — http://localhost:${PORT}`);
  if (HOST !== "127.0.0.1" && HOST !== "localhost") {
    console.log(`  WARNING: bound to ${HOST} — anyone who can reach this port can`);
    console.log(`           start a live run against your accounts. No auth.`);
  }
  const d = readDemo();
  console.log(`  cache: ${s.fetched?.toLocaleString() ?? 0} conversations over ${s.batches ?? 0} batch(es)`);
  console.log(`  slice: ${SLICE.toLocaleString()} per run · next run starts at ${d.offset.toLocaleString()} · ${d.runs || 0} run(s) so far`);
  console.log(`  slack: ${env.SLACK_CHANNEL || "#general"}\n`);
});
