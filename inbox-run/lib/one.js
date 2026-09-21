/**
 * One passthrough client.
 *
 * Two things here are load-bearing and were found the hard way:
 *  - A real User-Agent is required. One sits behind Cloudflare, which answers
 *    a default runtime UA with "error code: 1010" and no useful body.
 *  - Custom (medley) actions such as gmail/get-threads want `connectionKey`
 *    in the BODY as well as the header.
 */

const BASE = "https://api.withone.ai/v1";
const UA = "one-jev-demo/1.0";

export const ACTIONS = {
  gmailGetThreads: "conn_mod_def::GGSNlnppgZ0::qk3CudDWTVKPY7hpPVCqLQ",
  gmailProfile: "conn_mod_def::GJ3oa8bJZNA::ZS9kXmE_Rzi4utfESor_ng",
  gmailListLabels: "conn_mod_def::GJ3obtut_gA::L4R17Zu8QL-awsrk5_4b8w",
  gmailCreateLabel: "conn_mod_def::GJ3obSDbZXA::SU-y_lLPQwWPvwvrPRPbEg",
  gmailBatchModify: "conn_mod_def::GJ3ocX2edTU::mhLdczGoT2O9KVIUEjp8xw",
  slackPost: "conn_mod_def::GJ7H84zBlaI::BCfuA16aTaGVIax5magsLA",
  sheetsCreate: "conn_mod_def::GJ30jKslFX4::iXTcgIckSGixrOpCuwlv4A",
  sheetsAppend: "conn_mod_def::GJ30kKk8ogk::hCE5XVrgQ3m0ip3lGzJRfQ",
  hubspotCreateContact: "conn_mod_def::GJ3kRa59YdQ::k6o-IYauSoqishpRytOX-Q",
  hubspotAccountInfo: "conn_mod_def::GJ3jP9OdN-o::UIffeLOzR5iTWGn_zn0djw",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class OneClient {
  constructor(secret) {
    this.secret = secret;
  }

  /**
   * @param {object} o
   * @param {string} o.path   passthrough path, e.g. "/gmail/v1/users/me/profile"
   * @param {string} o.actionId
   * @param {string} o.connectionKey
   * @param {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} [o.method]
   * @param {object} [o.body]
   * @param {number} [o.retries]
   */
  async call({ path, actionId, connectionKey, method = "GET", body, retries = 6 }) {
    const url = `${BASE}/passthrough${path}`;
    let lastErr;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "x-one-secret": this.secret,
            "x-one-connection-key": connectionKey,
            "x-one-action-id": actionId,
            "content-type": "application/json",
            "user-agent": UA,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        if (!res.ok) {
          const err = new Error(`One ${res.status}: ${text.slice(0, 220)}`);
          err.status = res.status;
          // 429 and Gmail's own 403 quota errors are worth backing off on.
          const retryable = res.status === 429 || res.status === 403 || res.status >= 500;
          if (!retryable || attempt === retries - 1) throw err;
          lastErr = err;
          await sleep(Math.min(8000, 2 ** attempt * 400) + Math.random() * 300);
          continue;
        }
        return text ? JSON.parse(text) : {};
      } catch (e) {
        lastErr = e;
        if (attempt === retries - 1) throw e;
        await sleep(Math.min(8000, 2 ** attempt * 400) + Math.random() * 300);
      }
    }
    throw lastErr;
  }

  /** One page of whole conversations, sender/subject/snippet already extracted. */
  getThreads({ connectionKey, pageToken, count = 100, label, query }) {
    const body = { connectionKey, numberOfThreads: count, format: "metadata" };
    if (pageToken) body.pageToken = pageToken;
    if (label) body.label = label;
    // The action takes a Gmail search string ("in:anywhere after:<epoch>").
    // This used to be dropped here while fetch-batch.js was passing it, so
    // --query silently paged the whole mailbox instead of the slice asked for.
    if (query) body.query = query;
    return this.call({
      path: "/v1/gmail/get-threads",
      actionId: ACTIONS.gmailGetThreads,
      connectionKey,
      method: "POST",
      body,
    });
  }

  getProfile(connectionKey) {
    return this.call({
      path: "/gmail/v1/users/me/profile",
      actionId: ACTIONS.gmailProfile,
      connectionKey,
    });
  }

  listLabels(connectionKey) {
    return this.call({
      path: "/gmail/v1/users/me/labels",
      actionId: ACTIONS.gmailListLabels,
      connectionKey,
    });
  }

  createLabel(connectionKey, name) {
    return this.call({
      path: "/gmail/v1/users/me/labels",
      actionId: ACTIONS.gmailCreateLabel,
      connectionKey,
      method: "POST",
      body: { name, labelListVisibility: "labelShow", messageListVisibility: "show" },
    });
  }

  /** Up to 1000 message ids per call. */
  batchModify(connectionKey, ids, addLabelIds = [], removeLabelIds = []) {
    return this.call({
      path: "/gmail/v1/users/me/messages/batchModify",
      actionId: ACTIONS.gmailBatchModify,
      connectionKey,
      method: "POST",
      body: { ids, addLabelIds, removeLabelIds },
    });
  }

  slackPost(connectionKey, channel, text, blocks) {
    return this.call({
      path: "/chat.postMessage",
      actionId: ACTIONS.slackPost,
      connectionKey,
      method: "POST",
      body: blocks ? { channel, text, blocks } : { channel, text },
    });
  }

  /**
   * Create the ledger with two tabs and a frozen header row.
   *
   * The second tab matters: every number in this file is a probability or a
   * rubric position, and "0.34" in a column called "Sent to a list" tells a
   * reader nothing on its own. The legend travels with the data.
   */
  createSheet(connectionKey, title) {
    // Note: create is "/spreadsheets" while append is "/v4/spreadsheets/...".
    // The two Sheets actions genuinely differ — confirmed against /v1/knowledge.
    return this.call({
      path: "/spreadsheets",
      actionId: ACTIONS.sheetsCreate,
      connectionKey,
      method: "POST",
      body: {
        properties: { title },
        sheets: [
          { properties: { title: "Classifications", gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: "How to read this" } },
        ],
      },
    });
  }

  appendRows(connectionKey, spreadsheetId, range, values) {
    return this.call({
      path: `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      actionId: ACTIONS.sheetsAppend,
      connectionKey,
      method: "POST",
      body: { values },
    });
  }

  /**
   * Portal id and UI domain, so created contacts can be linked to.
   * The domain matters: a portal on a non-default data centre lives at
   * app-na2.hubspot.com (or similar), and an app.hubspot.com link to it
   * silently shows "not found" — which is exactly how these went missing.
   */
  async hubspotPortal(connectionKey) {
    const d = await this.call({
      path: "/account-info/2026-03/details",
      actionId: ACTIONS.hubspotAccountInfo,
      connectionKey,
    });
    return { portalId: d.portalId, domain: d.uiDomain || "app.hubspot.com" };
  }

  createContact(connectionKey, properties) {
    return this.call({
      path: "/crm/v3/objects/contacts",
      actionId: ACTIONS.hubspotCreateContact,
      connectionKey,
      method: "POST",
      body: { properties },
    });
  }
}
