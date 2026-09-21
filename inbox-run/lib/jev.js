/**
 * TypeSafe Jev client.
 *
 * The whole demo rests on one measured fact: Jev evaluates every question in a
 * request in parallel against one state, and bills input only. So fifty emails
 * and two hundred questions in ONE call costs about the same as fifty separate
 * calls would, and takes 2.2 seconds instead of 50 round trips.
 *
 * Measured on real mail: 258 conversations/sec at 16 workers, 0 errors,
 * ~411 input tokens per conversation.
 */

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-1.13.0"; // pinned on purpose; jev-latest moves without notice
export const PRICE_PER_TOKEN = 0.042 / 1e6;
export const BATCH = 50;

export const CATEGORIES = {
  newsletter: "Bulk marketing, a product announcement, a digest, or a content blast",
  invoice: "A bill, receipt, payment request, or a notice about money owed",
  customer: "An existing customer or user asking for help or reporting a problem",
  lead: "Inbound sales interest, a demo request, or a partnership enquiry",
  recruiting: "A job application, candidate outreach, or a recruiter message",
  calendar: "A meeting invite, a reschedule, or a calendar notification",
  alert: "An automated system, security, or monitoring notification",
  personal: "A genuine one-to-one message written by a real person",
  other: "None of the other options clearly fits",
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

const URGENCY = ["Can wait a month", "Should be handled this week", "Needs handling today", "Needs handling right now"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Build the four questions, per email, for one batch. */
function buildQuestions(emails) {
  const q = {};
  for (const e of emails) {
    const n = e.n;
    q[`c${n}`] = {
      type: "choice",
      instructions: `Look only at the email numbered ${n} in the list. Which single category best describes it?`,
      criteria: CATEGORIES,
    };
    q[`b${n}`] = {
      type: "noul",
      instructions: `The email numbered ${n} was sent automatically to a large mailing list rather than written personally to this one recipient.`,
    };
    q[`y${n}`] = {
      type: "noul",
      instructions: `The email numbered ${n} requires this recipient personally to do something that has not been done yet.`,
    };
    q[`u${n}`] = {
      type: "score",
      instructions: `Look only at the email numbered ${n}. How time-sensitive is it?`,
      criteria: URGENCY,
    };
  }
  return q;
}

export class JevClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Classify one batch of up to 50 conversations.
   * @param {Array<{n:number,from:string,subject:string,snippet:string}>} emails
   * @returns {Promise<{answers:object, usage:object, model:string}>}
   */
  async classify(emails, retries = 5) {
    const payload = {
      model: MODEL,
      state: { emails },
      questions: buildQuestions(emails),
    };
    let lastErr;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            "content-type": "application/json",
            "user-agent": "one-jev-demo/1.0",
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        if (!res.ok) {
          const err = new Error(`Jev ${res.status}: ${text.slice(0, 200)}`);
          err.status = res.status;
          // 429 rate limit, 529 overloaded
          if ((res.status !== 429 && res.status !== 529 && res.status < 500) || attempt === retries - 1) throw err;
          lastErr = err;
          await sleep(Math.min(6000, 2 ** attempt * 350) + Math.random() * 250);
          continue;
        }
        return JSON.parse(text);
      } catch (e) {
        lastErr = e;
        if (attempt === retries - 1) throw e;
        await sleep(Math.min(6000, 2 ** attempt * 350) + Math.random() * 250);
      }
    }
    throw lastErr;
  }
}

/**
 * Turn a thread into the compact shape Jev sees.
 *
 * Accepts both shapes: the nested one One returns live (`messages[0].sender`)
 * and the flattened one the cache stores. Getting this wrong is silent and
 * expensive — Jev happily classifies fifty blank emails and returns confident
 * nonsense — so the fields are asserted by the caller before a run starts.
 */
export function toEmail(thread, n) {
  const m = (thread.messages || [])[0] || {};
  return {
    n,
    from: clean(thread.sender ?? m.sender, 80),
    subject: clean(thread.subject ?? m.subject, 100),
    snippet: clean(thread.snippet ?? m.snippet, 180),
  };
}

/**
 * Jev rejects a whole request with "Request contains invalid Unicode text" if
 * any string in it is malformed, and a batch is fifty emails — so one bad
 * character used to cost fifty classifications. Real mail carries plenty:
 * emoji cut in half by a slice(), lone surrogates from bad encoders, C0
 * control bytes. Slice FIRST, then repair what the slice broke.
 */
function clean(value, max) {
  let out = String(value ?? "").slice(0, max);
  // Drop unpaired surrogates — including one left dangling by the slice above.
  out = out.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "");
  out = out.replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "$1");
  // Control characters other than tab and newline carry no meaning here.
  out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  return out.trim();
}

/** Every thread must carry something for Jev to read. */
export function assertReadable(threads) {
  const blank = threads.filter((t) => {
    const e = toEmail(t, 1);
    return !e.from && !e.subject && !e.snippet;
  }).length;
  if (blank > threads.length * 0.02) {
    throw new Error(
      `${blank} of ${threads.length} cached conversations have no sender, subject or snippet. ` +
        `The cache shape does not match what the classifier reads — re-pull with: node fetch-batch.js --reset`
    );
  }
  return blank;
}

/** Fold one Jev response back onto its batch, producing per-thread verdicts. */
export function toVerdicts(batch, emails, answers) {
  return batch.map((thread, i) => {
    const n = i + 1;
    const c = answers[`c${n}`];
    const b = answers[`b${n}`];
    const y = answers[`y${n}`];
    const u = answers[`u${n}`];
    const msgs = thread.messages || [];
    return {
      threadId: thread.id,
      messageIds: thread.messageIds ?? msgs.map((m) => m.messageId).filter(Boolean),
      received: thread.time ?? msgs[0]?.time ?? null,
      // emails[i].from is cut to 80 chars for Jev. Reusing that here silently
      // chopped the closing ">" off long senders, so the address parsed out of
      // it was garbage and every HubSpot create failed. Keep the full string.
      sender: thread.sender ?? msgs[0]?.sender ?? emails[i].from,
      subject: emails[i].subject,
      category: c?.choice ?? "other",
      confidence: round(c?.confidence ?? 0),
      bulk: round(b?.noul ?? 0),
      needsYou: round(y?.noul ?? 0),
      urgency: round(u?.score ?? 0),
    };
  });
}

const round = (v) => Math.round(v * 100) / 100;

/** Pull a real address out of "Name <a@b.c>" or a bare address, or null. */
export function parseEmail(sender) {
  if (!sender) return null;
  const angled = sender.match(/<([^<>\s]+@[^<>\s]+)>/);
  const candidate = angled ? angled[1] : sender.trim();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(candidate) ? candidate.toLowerCase() : null;
}

/** The thresholds. These live in code, not in the model. */
export const RULES = {
  archiveAbove: 0.9,   // bulk
  needsYouAbove: 0.85, // needsYou
  urgentAtOrAbove: 2.0, // urgency score, "needs handling today"
};
