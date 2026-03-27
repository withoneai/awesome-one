---
name: postmark
description: |
  Postmark transactional email flow for the One CLI. Send emails with HTML/text
  bodies, tracking, CC/BCC, and custom headers.
triggers:
  - "send email postmark"
  - "postmark email"
  - "transactional email"
  - "/postmark"
---

# Postmark Flows

Ready-to-run transactional email sending via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add postmark                   # Connect your Postmark account
one --agent list                   # Find your connection key
```

## Flows

### Send Email

Sends a single transactional email through Postmark. Supports HTML and plain text,
CC/BCC, open/click tracking, tags, and reply-to overrides.

```bash
one flow execute postmark-send-email.flow.json \
  --input postmarkConnectionKey="<your-key>" \
  --input from="sender@example.com" \
  --input to="recipient@example.com" \
  --input subject="Hello from Postmark" \
  --input textBody="Plain text message body"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `postmarkConnectionKey` | Yes | Your Postmark connection key |
| `from` | Yes | Sender email (must have confirmed Sender Signature) |
| `to` | Yes | Recipients, comma-separated (max 50) |
| `subject` | Yes | Email subject |
| `textBody` | No* | Plain text body |
| `htmlBody` | No* | HTML body |
| `cc` | No | CC recipients, comma-separated (max 50) |
| `bcc` | No | BCC recipients, comma-separated (max 50) |
| `replyTo` | No | Reply-To address override |
| `tag` | No | Tag for Postmark analytics |
| `trackOpens` | No | Enable open tracking |
| `trackLinks` | No | Click tracking: None, HtmlAndText, HtmlOnly, TextOnly |

*At least one of `textBody` or `htmlBody` is required.

**What it does under the hood:**

1. Builds the Postmark email payload with proper field casing (From, To, Subject, etc.)
2. Sends via Postmark API (`POST /email`)
3. Returns message ID, submission timestamp, and delivery status
