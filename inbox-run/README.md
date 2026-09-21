# Inbox Run

**Jev reads the inbox. One does something about it.**

A working demo that puts [TypeSafe Jev](https://typesafe.ai) — a model that returns
typed decisions instead of text — in front of [One](https://withone.ai)'s action layer.

Jev answers four questions about every conversation in a Gmail mailbox. One then
labels the mail, archives what is bulk, writes a ledger to Google Sheets, creates a
HubSpot contact for every lead, and posts a summary to Slack.

**Built on [One](https://withone.ai)** — Gmail, Google Sheets, HubSpot and Slack all
reached through one API key and one passthrough endpoint. No per-integration glue code.

Zero npm dependencies. Node 20.19 or newer. Everything runs on your machine.

---

## Why these two, and not one or the other

Neither half can do this alone, and the split is the whole point.

**Jev has no credentials and cannot touch an account.** It receives text and returns
typed answers with calibrated probabilities. It does not generate prose, cannot call an
API, and has no side effects by construction.

**One has no opinion about any email.** It holds the credentials for Gmail, Sheets,
HubSpot and Slack, and turns one API key into calls against all four. It moves data in
and out of systems and judges nothing.

**The thresholds belong to neither.** "Archive above 0.90" is a line in `lib/jev.js`,
not something the model decided. Jev says how likely something is; your code decides
what that means. That separation is what makes the behaviour testable.

---

## Measured on a real 32,631-conversation mailbox

| | |
|---|---|
| Jev classification | **~580 conversations/sec** — 5,160 in 8.9s, zero failures |
| One demo slice | 2,000 conversations · 8,000 decisions · **~6s** · **$0.04** |
| Cost | about **$0.02 per thousand** conversations |
| Gmail read | **~38 conversations/sec**, and that is a hard ceiling |

The number worth understanding: **Jev is roughly fifteen times faster than Gmail can
feed it.** Reading a full mailbox takes about twenty minutes, and more parallelism makes
it *worse* — at six workers Gmail's quota rejected 39 requests and throughput fell from
38/sec to 25.

So the mail is cached once, up front, and each run classifies the next slice from that
cache. The slow part is Google's rate limit, not the model.

---

## Setup

### 1. What you need

- **Node 20.19 or newer** (`node --version`)
- **A One account** with Gmail connected. Slack, Google Sheets and HubSpot are
  optional — the run skips any that are missing.
- **A TypeSafe API key** from [console.typesafe.ai](https://console.typesafe.ai)

### 2. Clone and configure

```bash
git clone https://github.com/withoneai/awesome-one.git
cd awesome-one/inbox-run
cp .env.example .env
```

Fill in `.env`:

```
ONE_SECRET=sk_live_xxxxxxxx             # One dashboard -> API keys
TYPESAFE_API_KEY=apikey_xxxxxxxx        # console.typesafe.ai -> keys
GMAIL_KEY=live::gmail::default::...     # required
SHEETS_KEY=live::google-sheets::...     # optional
HUBSPOT_KEY=live::hubspot::default::... # optional
SLACK_KEY=live::slack::default::...     # optional
SLACK_CHANNEL=#general
BATCH_SIZE=5000
```

Connection keys come from `GET /v1/connections`, or from the One CLI:

```bash
one --agent list
```

### 3. Cache the mail

```bash
node fetch-batch.js 5000      # about two minutes
```

Run it again for the next 5,000 — it remembers where it stopped. To cache a whole
mailbox in one go, pass a larger number and add the query that reaches archived mail
and spam:

```bash
node fetch-batch.js 40000 --query "in:anywhere"
```

Without that query Gmail returns roughly the inbox and stops. On the mailbox this was
built against, that was 10,539 of 32,796 conversations.

`--query` takes any Gmail search string, and each distinct query keeps its own page
cursor. Threads already cached are skipped, so passes can overlap safely — which makes
topping the cache up with just the recent mail cheap:

```bash
# everything from the last 24 hours, on top of whatever is already cached
node fetch-batch.js 2000 --query "in:anywhere after:$(date -v-1d +%s)"
```

On Linux, `date -d '1 day ago' +%s`.

### 3b. Order it newest-first

A cache built from more than one pass is only roughly chronological where the passes
meet, and a run walks the file top to bottom. Sort it so run one starts with today:

```bash
node sort-cache.js --dry      # show what would change
node sort-cache.js            # sort, and reset the demo cursor to 0
```

Worth knowing why this is needed at all: Gmail returns a thread's messages
**oldest-first**, so `messages[0]` is when a thread *started*, not its latest activity.
A thread opened in July and replied to today would otherwise file under July. The
fetcher now records the last message's timestamp; `sort-cache.js` fixes a cache pulled
before that change.

### 4. Run it

```bash
node server.js                # http://localhost:4300
```

Press **Run**. It starts in **Live · writes** and asks for confirmation before it
touches anything. Flip the toggle to **Dry run** to have Jev classify for real — it is
still billed — while writing nothing to any account.

### 5. Undo, if you want your mailbox back

```bash
node undo.js --dry            # show exactly what would change
node undo.js                  # delete the labels, un-archive the mail
```

---

## How a run works, end to end

### Input to Jev

Jev never sees a whole email. Each conversation is reduced to three short fields, and
fifty of those go in one request:

```json
{
  "emails": [
    { "n": 1,
      "from": "Stripe <no-reply@stripe.com>",
      "subject": "An API key for your account was deleted",
      "snippet": "A key ending in 4f2a was deleted on 18 Sept." },
    { "n": 2, "from": "...", "subject": "...", "snippet": "..." }
  ]
}
```

Sender is capped at 80 characters, subject at 100, snippet at 180. Text is sanitised
first — unpaired surrogates and control characters make Jev reject the entire request,
and a request is fifty conversations.

### The four questions

Every question drives an action. None exists to be displayed.

| # | Question | Type | Returns | Drives |
|---|---|---|---|---|
| 1 | Which category is this? | **Choice**, 9 options | the chosen option, a probability for each, a confidence | the Gmail label |
| 2 | Was this sent to a list rather than to you? | **Noul** | one probability, 0 to 1 | archive, above 0.90 |
| 3 | Does this need you personally? | **Noul** | one probability, 0 to 1 | the short list, above 0.85 |
| 4 | How time-sensitive is it? | **Score**, 4 rungs | a float, plus the distribution | ordering, and the Slack cards |

The nine categories: `newsletter`, `invoice`, `customer`, `lead`, `recruiting`,
`calendar`, `alert`, `personal`, `other`.

Question 2 is the interesting one, and it is deliberately separate from the category.
Category says what a thing *is*; this says what to *do* with it. A recruiter blast and
a real person writing about a job are both `recruiting` — one should leave your inbox
and one should not. Category cannot split them.

### Output from Jev

Four questions x 50 emails = **200 questions in a single request**, all evaluated in
parallel against the same state. That is the property everything else rests on.

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "c1": { "type": "choice", "choice": "alert", "confidence": 0.94,
            "probabilities": { "alert": 0.94, "newsletter": 0.03, "other": 0.03 } },
    "b1": { "type": "noul", "noul": 0.12 },
    "y1": { "type": "noul", "noul": 0.88 },
    "u1": { "type": "score", "score": 2.31, "confidence": 0.71,
            "legend": { "0": "Can wait a month", "3": "Needs handling right now" } }
  },
  "usage": { "input_tokens": 19777, "output_tokens": 0 }
}
```

Three things to notice. `choice` can only ever be one of the nine options you
supplied — a tenth is not representable. Output tokens are **free**, so the fourth
question costs almost nothing. And the confidence numbers are calibrated, which is what
makes a threshold meaningful.

### From Jev's answers to One's actions

Your code applies the thresholds. This is ordinary JavaScript in `lib/jev.js` and
`server.js`, and it is deliberately not the model's job:

```js
export const RULES = {
  archiveAbove:    0.90,  // question 2
  needsYouAbove:   0.85,  // question 3
  urgentAtOrAbove: 2.00,  // question 4
};
```

That produces buckets — 1,092 newsletters, 361 to archive, 40 that need you, 4 leads —
and each bucket becomes One calls:

| Bucket | One action | Endpoint |
|---|---|---|
| Each category | Batch Modify a User's Gmail Messages | `POST /gmail/v1/users/me/messages/batchModify` |
| `bulk > 0.90` | the same action, removing `INBOX` | `POST .../batchModify` |
| Everything | Create Spreadsheet, then Append Values | `POST /spreadsheets`, `POST /v4/spreadsheets/{id}/values/{range}:append` |
| `lead` | Create a Contact | `POST /crm/v3/objects/contacts` |
| Summary | Send a Message to a Channel | `POST /chat.postMessage` |

Every one of those is a `POST /v1/passthrough{path}` carrying three headers:
`x-one-secret`, `x-one-connection-key`, `x-one-action-id`. Four products, one API key,
no SDKs.

### The order of events

```
  press Run
      |
      |-- read the demo cursor, take the next 2,000 from the cache
      |-- refuse to start if those conversations have no sender or subject
      |
      |-- JEV   40 requests x 50 emails x 4 questions, 16 at a time     ~6s
      |         answers stream to the screen as they land
      |
      |-- apply thresholds in code                                      instant
      |
      |-- ONE   Gmail:  create 9 labels, apply them, archive      --+
      |         Sheets: create + fill    HubSpot: leads           --+ together  ~10-25s
      |
      |-- ONE   Slack: post the summary                                 ~0.5s
      |
      +-- record the run, snapshot the screen, advance the cursor
```

Gmail and Sheets have separate quotas, so those tracks run together. Slack goes last
because its message reports what the others did.

---

## The two cursors

Keeping these separate is what makes repeat demos work.

**The fetch cursor** (`cache/state.json`) tracks Gmail pagination, per query. It exists
so pulling mail never re-reads the same pages.

**The demo cursor** (`cache/demo.json`) is a single number: how many cached
conversations have been used. Run one takes 1–2,000 and leaves it at 2,000; run two
takes 2,001–4,000. It only moves forward, and only past conversations that were
actually classified — a failed batch is not skipped. So nothing is ever processed
twice, and restarting the server does not lose your place.

`SLICE=1000 node server.js` halves the slice and doubles the number of runs.

---

## What live mode does and does not do

**Does:** creates nine `Jev/*` labels and applies them; archives bulk mail by removing
the `INBOX` label; creates a spreadsheet and writes one row per conversation; creates a
HubSpot contact per lead; posts one Slack summary.

The ledger and HubSpot tiles become links once a run finishes, so the spreadsheet and
the contact list are one click away. Both URLs are derived at runtime from **your**
connection — the spreadsheet id comes back from Google when the sheet is created, and
the HubSpot portal id and UI domain are read from `/account-info`. Nothing about any
other account is baked into this repo. A lead already in the CRM counts as a success,
not an error.

The classification stream is virtualised: every conversation a run produced stays
scrollable, and runs accumulate, so a second run leaves 4,000 rows on screen. Only the
rows in view are ever in the DOM, which is what keeps a 32,000-row list responsive.

**Does not:** delete anything, mark anything read, or send, reply or forward on your
behalf. Archiving is reversible — the mail stays in All Mail, and `undo.js` puts it
back, using the ledger as its record of what actually changed.

---

## Layout

```
fetch-batch.js     pull the next slice of mail into cache/
server.js          HTTP + SSE; classify, then act
undo.js            roll a run back
sort-cache.js      re-order the cache newest-first
lib/jev.js         the Jev client, the four questions, the thresholds
lib/one.js         the One passthrough client and the action ids
lib/env.js         .env reader
public/            the dashboard
package.json       no dependencies; it is here for "type": "module"
cache/             ALL state - gitignored, never commit
```

There are no dependencies to install. `package.json` exists so Node treats the
`.js` files as ES modules on every supported version rather than relying on
syntax detection, and to carry the `npm start` / `npm run fetch` shortcuts.

### What persists, and where

Plain JSON on disk. No database and no Docker: the state is small, and a file you can
open in an editor mid-demo beats a container you have to exec into.

| File | Holds |
|---|---|
| `threads.jsonl` | the cached mail, one conversation per line |
| `state.json` | the Gmail page cursor, per query |
| `demo.json` | the demo cursor |
| `runs.json` | every completed run — the history table |
| `last-run.json` | a snapshot of the finished screen, so a refresh restores it |

---

## Four things that will cost you an afternoon otherwise

**One sits behind Cloudflare and rejects default runtime user-agents** with
`error code: 1010` and no useful body. It reads exactly like an auth failure. Every
request in `lib/one.js` sets a real `user-agent`.

**Gmail meters `batchModify` by messages touched, not by call count.** Firing 1,000-id
batches back to back trips "units per minute" partway through a run. Chunks of 250 with
a gap between them stay under it.

**A HubSpot portal is not always on `app.hubspot.com`.** Accounts on another data
centre live at `app-na2.hubspot.com` and similar, and an `app.hubspot.com` link to such
a portal just shows nothing — which is exactly how a set of freshly created contacts
went missing. The dashboard reads `uiDomain` from `/account-info` and links to the
right host, rather than assuming.

**Malformed text fails the whole batch.** Jev rejects a request with
`Request contains invalid Unicode text` if any string in it is broken, and a request is
fifty conversations. Real mail is full of emoji cut in half by a naive `slice()` and
lone surrogates from bad encoders. `lib/jev.js` slices first, then repairs what the
slice broke.

---

## Security

`.env` and `cache/` are gitignored and must stay that way. `threads.jsonl` holds real
subjects and senders from a real mailbox — it is the one file here that would be
genuinely damaging to publish.

The connection keys in `.env` are not provider tokens. They are One's handles for a
connection; the Gmail OAuth token never reaches this code. That limits the blast radius
of a leak, but a One secret key still grants whatever access its scope allows, so
rotate keys when you are done demoing.

**The server binds to `127.0.0.1` only.** There is no authentication in front of
`/api/run`, and a run writes to real accounts, so a dashboard reachable from the
network is a dashboard a stranger on the same wifi can fire. If you genuinely need it
on another device, set `HOST=0.0.0.0` and understand that anyone who can reach the port
can start a live run against your mailbox. It prints a warning when you do.

---

## Contributing

Issues and pull requests are welcome in [awesome-one](https://github.com/withoneai/awesome-one).
Two things to know before you open one:

- **Never attach `cache/` contents, a `.env`, or a screenshot showing real
  subjects and senders.** Redact before you post — see Security above.
- The thresholds in `lib/jev.js` are deliberately ours and deliberately
  arguable. If you think a different line is better, say why with numbers from
  a run rather than changing them silently.

Run `node undo.js` before and after testing against a live mailbox, so you
hand the mailbox back the way you found it.

---

## Licence

MIT, with the rest of [Awesome One](https://github.com/withoneai/awesome-one).
