---
name: zendesk
description: |
  Zendesk ticket management flows for the One CLI. Create tickets, search tickets,
  and manage support workflows.
triggers:
  - "create ticket"
  - "zendesk ticket"
  - "search tickets"
  - "support ticket"
  - "/zendesk"
---

# Zendesk Flows

Ready-to-run support ticket management via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add zendesk                    # Connect your Zendesk account
one --agent list                   # Find your connection key
```

## Flows

### Create Ticket

Creates a new support ticket. Supports plain text and HTML bodies, priority,
type, and tags.

```bash
one flow execute zendesk-create-ticket.flow.json \
  --input zendeskConnectionKey="<your-key>" \
  --input subject="Cannot login to dashboard" \
  --input body="User reports 403 error when accessing /dashboard after password reset." \
  --input priority="high" \
  --input tags='["login", "auth"]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `zendeskConnectionKey` | Yes | Your Zendesk connection key |
| `subject` | No | Ticket subject |
| `body` | Yes* | Ticket body (plain text) |
| `htmlBody` | No* | HTML body (overrides body for rich formatting) |
| `priority` | No | Priority: low, normal, high, urgent |
| `type` | No | Type: problem, incident, question, task |
| `tags` | No | Array of tags |

*At least one of `body` or `htmlBody` is required.

### Search Tickets

Search for tickets with sorting and filtering options.

```bash
one flow execute zendesk-search-tickets.flow.json \
  --input zendeskConnectionKey="<your-key>" \
  --input sortOrder="desc"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `zendeskConnectionKey` | Yes | Your Zendesk connection key |
| `sortOrder` | No | Sort: asc or desc (default: desc) |
| `externalId` | No | Filter by external ID |

## Adapting These Flows

- **Auto-triage**: Pipe incoming emails into `create-ticket` with tags based on content
- **SLA monitor**: Search tickets and filter by priority/age to find SLA breaches
- **Escalation**: Chain search with an update-ticket action to bump priority
- **Dashboard**: Combine search results with a Slack digest flow
