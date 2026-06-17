---
name: calendly
description: |
  Calendly integration flows for the One CLI. List scheduled events, retrieve
  invitee details, and manage event types. Handles the user URI lookup pattern
  that Calendly requires.
triggers:
  - "calendly"
  - "list events calendly"
  - "invitees"
  - "event types calendly"
  - "scheduled events"
  - "/calendly"
---

# Calendly Flows

Ready-to-run workflows for Calendly via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add calendly                   # Connect your Calendly account
one --agent list                   # Find your connection key
```

## Flows

### List Scheduled Events

List your scheduled Calendly events with optional date range and status filtering. Automatically resolves the current user URI.

```bash
one flow execute calendly-list-events.flow.json \
  --input calendlyConnectionKey="<your-key>" \
  --input status="active" \
  --input minStartTime="2024-03-01T00:00:00Z"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `calendlyConnectionKey` | Yes | Calendly connection key |
| `status` | No | 'active' or 'canceled' |
| `minStartTime` | No | Minimum start time (ISO 8601) |
| `maxStartTime` | No | Maximum start time (ISO 8601) |
| `count` | No | Number of events (default 20) |

**What it does under the hood:**

1. Fetches current user via `GET /users/me` to get the user URI
2. Passes user URI as a required filter parameter
3. Lists events via `GET /scheduled_events` with filters

### Get Event Invitees

Retrieve invitees for a specific scheduled event.

```bash
one flow execute calendly-get-event-invitees.flow.json \
  --input calendlyConnectionKey="<your-key>" \
  --input eventUuid="abc123-def456"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `calendlyConnectionKey` | Yes | Calendly connection key |
| `eventUuid` | Yes | UUID of the scheduled event |
| `status` | No | Filter by 'active' or 'canceled' |

### List Event Types

List all your Calendly event types with scheduling links and configuration.

```bash
one flow execute calendly-list-event-types.flow.json \
  --input calendlyConnectionKey="<your-key>"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `calendlyConnectionKey` | Yes | Calendly connection key |
| `active` | No | Filter by active status (true/false) |

## Adapting These Flows

- **Meeting prep**: Chain `calendly-list-events` into `calendly-get-event-invitees` to get attendee details for upcoming meetings.
- **CRM sync**: Pipe invitee data into HubSpot or ActiveCampaign contact creation flows.
- **Daily digest**: Filter events by today's date and send a summary to Slack or email.
