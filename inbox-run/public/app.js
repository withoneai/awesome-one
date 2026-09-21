const CATS = ["newsletter", "alert", "calendar", "recruiting", "invoice", "lead", "customer", "personal", "other"];
const CAT_SHORT = { newsletter: "news", alert: "alert", calendar: "cal", recruiting: "recr",
  invoice: "inv", lead: "lead", customer: "cust", personal: "pers", other: "oth" };

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

let live = true;           // live by default; the dialog still gates it
let running = false;
let status = null;
let runs = [];
let es = null;

/**
 * The dashboard reports the SESSION, not the last run.
 *
 * The stream always accumulated while the counters reset, so a second run
 * showed "4,000 shown" above "2,000 conversations" — two true numbers that
 * together looked like a bug. Everything cumulative lives here; the per-run
 * figures live in the history table at the bottom.
 */
const session = { conversations: 0, decisions: 0, cost: 0, runs: 0, lastSeconds: 0, lastRate: 0 };

/* ---------------------------------------------------------------- dates */

/** "Mon, 21 Sep 2026 10:57:05 +0000" -> "21 Sep", or "21 Sep 25" if older. */
function shortDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.toLocaleString("en-GB", { month: "short" });
  return d.getFullYear() === new Date().getFullYear()
    ? `${d.getDate()} ${month}`
    : `${d.getDate()} ${month} ${String(d.getFullYear()).slice(2)}`;
}

/* --------------------------------------------------------------- chrome */

$("theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
});

const modeBtn = $("mode");
modeBtn.style.color = live ? "hsl(var(--warning-fg))" : "";
modeBtn.addEventListener("click", () => {
  if (running) return;
  live = !live;
  modeBtn.setAttribute("aria-pressed", String(live));
  modeBtn.textContent = live ? "Live · writes" : "Dry run";
  modeBtn.style.color = live ? "hsl(var(--warning-fg))" : "";
  $("pf-slack").textContent = live ? "notify" : "skipped";
  renderNote();
});

/* ------------------------------------------------------------ the tally */

const tallyEls = {};
CATS.forEach((c) => {
  const r = document.createElement("div");
  r.className = "trow";
  r.style.setProperty("--cat", `var(--c-${c})`);
  r.innerHTML = `<div class="tname">${c}</div><div class="tbar"><i></i></div><div class="tval">0</div>`;
  $("tally").appendChild(r);
  tallyEls[c] = { bar: r.querySelector("i"), val: r.querySelector(".tval"), n: 0 };
});

function renderTally() {
  const mx = Math.max(1, ...CATS.map((c) => tallyEls[c].n));
  let total = 0;
  CATS.forEach((c) => {
    const t = tallyEls[c];
    total += t.n;
    t.bar.style.width = (t.n / mx) * 100 + "%";
    t.val.textContent = fmt(t.n);
  });
  $("tally-total").textContent = fmt(total);
}

/* ----------------------------------------------------- virtualised wall */

const ROW_H = 38;          // .row is 32px tall; the rest is the gap
const OVERSCAN = 6;
let allRows = [];
let follow = true;         // keep the newest arrivals in view while a run streams

function rowEl(r) {
  const el = document.createElement("div");
  el.className = "row";
  el.style.setProperty("--cat", `var(--c-${r.c})`);
  const arch = r.b > 0.9, you = r.y > 0.85, urg = r.u >= 2.0;
  el.innerHTML =
    `<div class="chip">${r.c}</div>` +
    `<div class="when"></div>` +
    `<div class="subj"><b></b><span></span></div>` +
    `<div class="flags">` +
      (arch ? `<span class="flag arch">archive</span>` : ``) +
      (you ? `<span class="flag you">needs you</span>` : ``) +
      (urg && !you ? `<span class="flag urg">today</span>` : ``) +
      (!arch && !you && !urg ? `<span class="flag">keep</span>` : ``) +
    `</div>` +
    `<div class="cf"><div class="cfbar"><i style="width:${Math.round((r.cf || 0) * 100)}%"></i></div>` +
    `<span class="cfv">${(r.cf || 0).toFixed(2)}</span></div>`;
  el.querySelector(".subj b").textContent = r.t || "(no subject)";
  el.querySelector(".subj span").textContent = `${r.s} · ${r.d}`;
  el.querySelector(".when").textContent = shortDate(r.dt);
  return el;
}

function renderWall() {
  const wall = $("wall");
  const inner = $("wall-inner");
  inner.style.height = Math.max(0, allRows.length * ROW_H) + "px";

  const first = Math.max(0, Math.floor(wall.scrollTop / ROW_H) - OVERSCAN);
  const visible = Math.ceil(wall.clientHeight / ROW_H) + OVERSCAN * 2;
  const last = Math.min(allRows.length, first + visible);

  const frag = document.createDocumentFragment();
  for (let i = first; i < last; i++) {
    const el = rowEl(allRows[i]);
    el.style.top = i * ROW_H + "px";
    frag.appendChild(el);
  }
  inner.replaceChildren(frag);
  const classified = session.conversations || allRows.length;
  $("wall-count").textContent = !allRows.length
    ? ""
    : allRows.length < classified
      ? `${fmt(allRows.length)} of ${fmt(classified)} shown`   // only the last run's rows are persisted
      : `${fmt(allRows.length)} shown`;
}

/**
 * Keep the wall in date order, newest at the top.
 *
 * Arrival order is NOT date order. Sixteen workers classify batches
 * concurrently and each sends the moment it returns, so a batch of 1 Sept mail
 * could land ahead of one holding 18 Sept. Every row now carries `i`, its
 * absolute position in the cache — and because the cache is sorted
 * newest-first, sorting on `i` ascending is sorting by date descending, across
 * batches and across runs alike.
 *
 * The newest conversation therefore sits at the TOP, which is where the eye
 * starts, so following means staying pinned to the top rather than chasing the
 * bottom edge the way an append-only log would.
 */
function addRows(rows) {
  allRows.push(...rows);
  allRows.sort((a, b) => (a.i ?? 0) - (b.i ?? 0));
  if (follow) $("wall").scrollTop = 0;
  renderWall();
}

$("wall").addEventListener("scroll", () => {
  const w = $("wall");
  // Re-latch once the reader is back at the top, where the newest mail is.
  follow = w.scrollTop < ROW_H * 2;
  renderWall();
}, { passive: true });
window.addEventListener("resize", renderWall);

/* ---------------------------------------------------------- the metrics */

function renderMetrics() {
  $("m-read").textContent = fmt(session.conversations);
  $("m-dec").textContent = fmt(session.decisions);
  $("m-cost").textContent = "$" + session.cost.toFixed(4);
  $("m-read-n").textContent = session.runs
    ? `across ${session.runs} run${session.runs === 1 ? "" : "s"}`
    : "classified so far";
  if (session.lastRate) {
    $("m-time-n").textContent = `${fmt(Math.round(session.lastRate))} conv/sec · last run`;
  }
}

/* -------------------------------------------------------- the short list */

let shortCount = 0;

function addShort(r) {
  shortCount++;
  if (shortCount <= 20) {
    const el = document.createElement("div");
    el.className = "sitem";
    el.innerHTML = `<b></b><span><span class="mono">${r.c}</span> · needs you ${r.y.toFixed(2)} · urgency ${r.u.toFixed(2)}</span>`;
    el.querySelector("b").textContent = r.t || "(no subject)";
    $("short").prepend(el);
  }
  $("short-n").textContent = fmt(shortCount);
}

/* -------------------------------------------------------- action tiles */

/**
 * Tiles are SESSION totals, like the metrics above them.
 *
 * The server reports each run's own counts, so a second run used to overwrite
 * the first — 3,479 labelled became 2,634, which reads as work being undone.
 * `tileBase` holds the totals as they stood when the run started; the live
 * count is added to that.
 */
const tileTotals = { label: 0, arch: 0, sheet: 0, hub: 0, slack: 0 };
const tileBase = { label: 0, arch: 0, sheet: 0, hub: 0, slack: 0 };

function setTile(key, value) {
  tileTotals[key] = value;
  $("a-" + key).textContent = fmt(value);
  const card = document.querySelector(`.act[data-a="${key}"]`);
  if (card) card.classList.toggle("on", value > 0);
}

/** A count reported for the current run, folded into the session total. */
function setTileForRun(key, runValue) {
  setTile(key, tileBase[key] + runValue);
}

function snapshotTileBase() {
  for (const k of Object.keys(tileBase)) tileBase[k] = tileTotals[k];
}

function linkTile(key, url, label) {
  const id = { sheet: "aid-sheet", hub: "aid-hub" }[key];
  if (!id || !url) return;
  $(id).innerHTML = `<a href="${url}" target="_blank" rel="noopener" style="color:hsl(var(--success))">${label}</a>`;
}

/* ------------------------------------------------------- status and note */

async function loadStatus() {
  status = await (await fetch("/api/status")).json();
  if (!status.cached) {
    $("empty-txt").innerHTML = `No mail cached yet. Run <code>node fetch-batch.js</code> first.`;
    $("run").disabled = true;
  } else if (status.remaining === 0) {
    $("empty-txt").textContent = "Every cached conversation has been used. Reset to run again.";
  } else if (!allRows.length) {
    $("empty-txt").textContent = "Press Run.";
  }
  renderNote();
}

function renderNote() {
  if (!status) return;
  $("note-txt").innerHTML = live
    ? `<b>Live mode writes to your real accounts.</b> Labels are created and applied, bulk mail is archived by removing the <code>INBOX</code> label only, a ledger lands in Google Sheets and a summary posts to <code>${status.channel}</code>. Nothing is deleted, nothing is marked read, nothing is sent on your behalf.`
    : `<b>Dry run.</b> Every Jev call is real and billed. Nothing is written to Gmail, Sheets, HubSpot or Slack.`;
}

/* ------------------------------------------------------------ run history */

async function loadRuns() {
  try { runs = await (await fetch("/api/runs")).json(); } catch { return; }
  const panel = $("hist-panel");
  if (!runs.length) { panel.hidden = true; return; }
  panel.hidden = false;

  const t = runs.reduce((a, r) => ({
    count: a.count + (r.count || 0), cost: a.cost + (r.cost || 0),
    seconds: a.seconds + (r.seconds || 0), labelled: a.labelled + (r.labelled || 0),
    archived: a.archived + (r.archived || 0), leads: a.leads + (r.contacts || 0),
  }), { count: 0, cost: 0, seconds: 0, labelled: 0, archived: 0, leads: 0 });

  $("hist-total").textContent = `${runs.length} run${runs.length === 1 ? "" : "s"} · ${fmt(t.count)} conversations`;

  const head = `<tr><th class="idx">#</th><th>When</th><th>Mode</th><th class="n">Conv.</th>
    <th class="n">Time</th><th class="n">Cost</th><th>Categories</th>
    <th class="n">Labelled</th><th class="n">Archived</th><th class="n">Leads</th>
    <th>Ledger</th><th>Slack</th></tr>`;

  const rows = runs.map((r) => {
    const when = new Date(r.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const cats = Object.entries(r.categories || {})
      .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, v]) => `<i style="--cat:var(--c-${k})">${CAT_SHORT[k] || k} ${v}</i>`).join("");
    const isLive = r.mode === "live";
    const dash = '<span class="dash">—</span>';
    return `<tr>
      <td class="idx">${r.n}</td>
      <td>${when}</td>
      <td><span class="mtag ${isLive ? "live" : ""}">${isLive ? "live" : "dry"}</span></td>
      <td class="n">${fmt(r.count)}</td>
      <td class="n">${(r.seconds || 0).toFixed(1)}s</td>
      <td class="n">$${(r.cost || 0).toFixed(4)}</td>
      <td><div class="cats">${cats}</div></td>
      <td class="n">${isLive ? fmt(r.labelled) : dash}</td>
      <td class="n">${isLive ? fmt(r.archived) : dash}</td>
      <td class="n">${isLive ? fmt(r.contacts) : dash}</td>
      <td>${r.sheetUrl ? `<a href="${r.sheetUrl}" target="_blank" rel="noopener">open</a>` : dash}</td>
      <td>${r.slack ? `<span class="mtag live">posted</span>` : dash}</td>
    </tr>`;
  }).join("");

  const totals = `<tr class="totals">
    <td colspan="3">Total</td>
    <td class="n">${fmt(t.count)}</td>
    <td class="n">${t.seconds.toFixed(1)}s</td>
    <td class="n">$${t.cost.toFixed(4)}</td>
    <td></td>
    <td class="n">${fmt(t.labelled)}</td>
    <td class="n">${fmt(t.archived)}</td>
    <td class="n">${fmt(t.leads)}</td>
    <td colspan="2"></td>
  </tr>`;

  $("hist").innerHTML = head + rows + totals;
}

/* -------------------------------------------------- restore after refresh */

async function restoreLast() {
  let snap = null;
  try { snap = await (await fetch("/api/last-run")).json(); } catch { return; }
  if (!snap || !snap.count) return;

  // Rebuild the session from the recorded runs so a refresh shows the same
  // cumulative totals the screen had before it.
  const done = runs.length ? runs : [snap];
  session.runs = done.length;
  session.conversations = done.reduce((a, r) => a + (r.count || 0), 0);
  session.decisions = session.conversations * 4;
  session.cost = done.reduce((a, r) => a + (r.cost || 0), 0);
  session.lastSeconds = snap.seconds || 0;
  session.lastRate = snap.count / Math.max(0.01, snap.seconds || 1);

  $("m-time").innerHTML = session.lastSeconds.toFixed(2) + '<span style="font-size:18px">s</span>';
  renderMetrics();

  // Categories and the short list are session totals like everything else, so
  // sum them across every recorded run. Seeding from the last snapshot alone
  // was why a refresh showed "4,000 conversations" above a 2,000 tally.
  CATS.forEach((c) => {
    tallyEls[c].n = done.reduce((a, r) => a + ((r.categories || {})[c] || 0), 0);
  });
  renderTally();

  allRows = (snap.rows || []).slice().sort((a, b) => (a.i ?? 0) - (b.i ?? 0));
  if (allRows.length) { $("wall-empty").hidden = true; renderWall(); }

  // Only the last run's short-list entries are persisted, but the count is
  // the session total, so say so rather than silently showing a subset.
  $("short").innerHTML = "";
  shortCount = 0;
  (snap.shortList || []).forEach((r) => addShort(r));
  const needsYouTotal = done.reduce((a, r) => a + (r.needsYou || 0), 0);
  shortCount = needsYouTotal;
  $("short-n").textContent = fmt(needsYouTotal);

  // Totals across every recorded run, so a refresh matches what was on screen.
  const totals = runs.length
    ? runs.reduce((a, r) => ({
        label: a.label + (r.labelled || 0),
        arch: a.arch + (r.archived || 0),
        sheet: a.sheet + (r.sheetRows || 0),
        hub: a.hub + (r.contacts || 0),
        slack: a.slack + (r.slack ? 1 : 0),
      }), { label: 0, arch: 0, sheet: 0, hub: 0, slack: 0 })
    : { label: snap.labelled || 0, arch: snap.archived || 0, sheet: snap.sheetRows || 0,
        hub: snap.contacts || 0, slack: snap.slack ? 1 : 0 };
  const isLive = snap.mode === "live";
  if (!runs.some((r) => r.mode === "live")) {
    // Nothing has been written yet, so the tiles show what a live run WOULD
    // do — summed across every dry run, to match the counters above them.
    totals.label = done.reduce((a, r) => a + (r.count || 0), 0);
    totals.arch = done.reduce((a, r) => a + (r.archive || 0), 0);
    totals.sheet = totals.label;
    totals.hub = done.reduce((a, r) => a + (r.leads || 0), 0);
  }
  Object.entries(totals).forEach(([k, v]) => setTile(k, v));
  snapshotTileBase();

  // A dry run makes no ledger, no contacts and no Slack post — but the last
  // live run's artifacts still exist and are still worth reaching.
  const lastLive = runs.find((r) => r.mode === "live");
  const stale = !isLive && lastLive ? " (last live run)" : "";
  linkTile("sheet", snap.sheetUrl || lastLive?.sheetUrl, "Open the ledger" + stale);
  linkTile("hub", snap.hubspotUrl || lastLive?.hubspotUrl, "Open in HubSpot" + stale);
  if (!isLive && lastLive?.slack) {
    setTile("slack", 1);
    $("aid-slack").textContent = `posted to ${status?.channel || "#general"} on the last live run`;
  }

  $("phase").className = "phase-tag done";
  $("phase").textContent = isLive ? "Complete" : "Dry run complete";
  $("rate").textContent = `${fmt(Math.round(session.lastRate))} conv/sec`;
}

/* ------------------------------------------------------------- the dialog */

let dialogResolve = null;
const overlay = $("overlay");

function askConfirm() {
  $("dlg-channel").textContent = status?.channel || "#general";
  overlay.hidden = false;
  $("dlg-confirm").focus();
  return new Promise((resolve) => { dialogResolve = resolve; });
}
function closeDialog(answer) {
  overlay.hidden = true;
  const r = dialogResolve;
  dialogResolve = null;
  $("run").focus();
  if (r) r(answer);
}
$("dlg-cancel").addEventListener("click", () => closeDialog(false));
$("dlg-confirm").addEventListener("click", () => closeDialog(true));
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDialog(false); });
document.addEventListener("keydown", (e) => {
  if (overlay.hidden) return;
  if (e.key === "Escape") { e.preventDefault(); closeDialog(false); }
  if (e.key === "Tab") {
    const f = [$("dlg-cancel"), $("dlg-confirm")];
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
  }
});

/* ----------------------------------------------------------------- a run */

let clockTimer = null;

function startClock() {
  const t0 = performance.now();
  clockTimer = setInterval(() => {
    $("m-time").innerHTML = ((performance.now() - t0) / 1000).toFixed(2) + '<span style="font-size:18px">s</span>';
  }, 50);
}
function stopClock() { clearInterval(clockTimer); clockTimer = null; }

// Session totals as they stood before this run, so streaming deltas can be
// added to them rather than overwriting them.
let baseConversations = 0;
let baseCost = 0;

$("run").addEventListener("click", async () => {
  if (running) return;
  if (live && !(await askConfirm())) return;

  running = true;
  $("run").disabled = true;
  modeBtn.disabled = true;
  follow = true;
  $("wall-empty").hidden = true;
  $("phase").className = "phase-tag live";
  $("phase").textContent = "Classifying";
  baseConversations = session.conversations;
  baseCost = session.cost;
  snapshotTileBase();
  startClock();

  es = new EventSource(`/api/run?mode=${live ? "live" : "dry"}`);
  es.onmessage = (ev) => handle(JSON.parse(ev.data));
  es.onerror = () => finish();
});

function handle(m) {
  switch (m.type) {
    case "start":
      break;

    case "verdicts": {
      addRows(m.rows);
      for (const r of m.rows) {
        const t = tallyEls[r.c];
        if (t) t.n++;
        if (r.y > 0.85) addShort(r);
      }
      renderTally();

      session.conversations = baseConversations + m.done;
      session.decisions = session.conversations * 4;
      session.cost = baseCost + m.cost;
      renderMetrics();

      $("rate").textContent = `${fmt(Math.round(m.done / Math.max(0.001, m.elapsed)))} conv/sec`;
      break;
    }

    case "classified":
      session.lastSeconds = m.seconds;
      session.lastRate = m.rate;
      stopClock();
      $("m-time").innerHTML = m.seconds.toFixed(2) + '<span style="font-size:18px">s</span>';
      renderMetrics();
      if (m.failed) $("rate").textContent += ` · ${m.failed} failed`;
      break;

    case "plan":
      if (!live) {
        const classified = Object.values(m.categories).reduce((a, b) => a + b, 0);
        setTileForRun("label", classified);
        setTileForRun("arch", m.archive);
        setTileForRun("sheet", classified);
        setTileForRun("hub", m.leads);
      }
      break;

    case "phase":
      $("phase").textContent = "Acting";
      break;

    case "action":
      if (m.count != null) setTileForRun(m.key, m.count);
      // A contact that was ALREADY in the CRM still counts toward the total —
      // it is a row in HubSpot either way. But counting it silently is what
      // made the tile look wrong against a filtered contacts list, so say the
      // split out loud.
      if (m.key === "hub" && m.made != null) {
        $("d-hub").textContent = m.existing
          ? `${m.made} new · ${m.existing} already in the CRM`
          : "Buying intent becomes a contact";
      }
      if (m.url) linkTile(m.key, m.url, m.key === "sheet" ? "Open the ledger" : "Open in HubSpot");
      break;

    case "warn":
      console.warn(m.message);
      break;

    case "error":
      $("phase").className = "phase-tag";
      $("phase").textContent = "Error";
      $("note-txt").innerHTML = `<b>${m.message}</b>`;
      finish();
      break;

    case "done":
      session.runs += 1;
      renderMetrics();
      $("phase").className = "phase-tag done";
      $("phase").textContent = m.mode === "live" ? "Complete" : "Dry run complete";
      finish();
      loadStatus();
      loadRuns();
      break;
  }
}

function finish() {
  stopClock();
  if (es) { es.close(); es = null; }
  running = false;
  $("run").disabled = false;
  modeBtn.disabled = false;
}

/* ------------------------------------------------------------------ boot */

(async () => {
  await loadStatus();
  await loadRuns();     // restoreLast reads `runs`, so this has to land first
  await restoreLast();
})();
