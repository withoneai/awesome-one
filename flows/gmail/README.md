---
name: gmail
description: |
  Gmail integration flows for the One CLI. Ready-to-run workflows that handle
  the orchestration complexity (MIME encoding, base64url, list+detail patterns)
  so you don't have to.
triggers:
  - "send email"
  - "draft email"
  - "create draft"
  - "search emails"
  - "get emails"
  - "read emails"
  - "list threads"
  - "gmail"
  - "/gmail"
---

# Gmail Flows

Ready-to-run workflows for Gmail via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add gmail                      # Connect your Gmail account
one --agent list                   # Find your connection key
```

## Flows

### Send Email

Composes and sends an email. Handles MIME encoding, base64url conversion, HTML
formatting, non-ASCII subject encoding, CC/BCC, and reply threading.

```bash
one flow execute gmail-send-email.flow.json \
  --input gmailConnectionKey="<your-key>" \
  --input to="recipient@example.com" \
  --input subject="Hello from One" \
  --input body="Your message here.\n\nLine breaks work.\nSo do emojis 🚀"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `gmailConnectionKey` | Yes | Your Gmail connection key |
| `to` | Yes | Recipient(s), comma-separated |
| `subject` | Yes | Subject line (emoji and unicode safe) |
| `body` | Yes | Email body (plain text auto-converted to HTML) |
| `isHtml` | No | Set `true` if body is already HTML |
| `from` | No | Custom sender address |
| `cc` | No | CC recipients, comma-separated |
| `bcc` | No | BCC recipients, comma-separated |
| `replyTo` | No | Reply-To address |
| `threadId` | No | Thread ID for replies |
| `inReplyTo` | No | Message-ID being replied to |
| `references` | No | Message-ID chain for threading |
| `labelIds` | No | Labels to apply (default: `["INBOX", "UNREAD"]`) |

**What it does under the hood:**

1. Builds a MIME message with proper headers (From, To, Subject, Content-Type, etc.)
2. Encodes non-ASCII subjects using RFC 2047 (`=?UTF-8?B?...?=`)
3. Converts plain text to HTML (escapes special chars, `\n` to `<br>`)
4. Base64url-encodes the entire MIME message
5. Sends via Gmail API `POST /users/{userId}/messages/send`

### Read Emails

Searches and retrieves emails with full content. Handles the two-step
list+detail pattern that Gmail requires (list returns IDs only, each message
needs a separate fetch to get content).

```bash
one flow execute gmail-read-emails.flow.json \
  --input gmailConnectionKey="<your-key>" \
  --input query="from:alice subject:invoice" \
  --input maxResults=5
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `gmailConnectionKey` | Yes | Your Gmail connection key |
| `query` | No | Gmail search query (same syntax as the Gmail search bar) |
| `label` | No | Label filter (e.g., `INBOX`, `SENT`, `STARRED`) |
| `maxResults` | No | Number of emails (1-100, default 10) |
| `pageToken` | No | Pagination token for next page |

**What it does under the hood:**

1. Builds search query combining label and query filters
2. Lists message IDs via `GET /users/me/messages` with query params
3. Fetches each message in parallel (5 concurrent) via `GET /users/me/messages/{id}` with `format=full`
4. Decodes base64url-encoded bodies (prefers text/plain, falls back to text/html, handles nested multipart)
5. Extracts headers (From, To, Subject, Date) and assembles clean response

**Search query examples:**

| Query | Meaning |
|-------|---------|
| `from:alice@example.com` | From a specific sender |
| `subject:invoice` | Subject contains "invoice" |
| `is:unread label:INBOX` | Unread inbox messages |
| `has:attachment` | Has attachments |
| `after:2024/01/01` | After a date |
| `newer_than:7d` | Within the last 7 days |

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Reply to an email**: Use `gmail-send-email` with `threadId`, `inReplyTo`, and `references` from a previous read.
- **Search and forward**: Chain `gmail-read-emails` into `gmail-send-email` using a multi-step flow.
- **Auto-label**: Add a step after `gmail-read-emails` to call the modify-labels action.
- **Email digest**: Pipe `gmail-read-emails` output into a Slack or Notion action.

The orchestration knowledge is in the flow's `code` steps. Read them to understand the MIME encoding, body decoding, and query construction patterns -- then build your own variations.
