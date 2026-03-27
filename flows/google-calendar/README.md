---
name: google-calendar
description: |
  Google Calendar integration flow for the One CLI. Create calendar events
  with attendees, location, reminders, and all-day event support.
triggers:
  - "google calendar"
  - "create event"
  - "calendar event"
  - "schedule meeting"
  - "/google-calendar"
---

# Google Calendar Flows

Ready-to-run workflows for Google Calendar via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add google-calendar            # Connect your Google account
one --agent list                   # Find your connection key
```

## Discovery

The `calendarId` defaults to `'primary'` (your main calendar), which works for most cases. To use a different calendar:

```bash
# List all calendars on your account
one --agent actions search google-calendar "list calendars"
one --agent actions execute google-calendar <list-calendars-action-id> <your-connection-key>
```

## Flows

### Create Event

Create a new event on Google Calendar with full support for attendees, location, all-day events, and notification preferences.

```bash
one flow execute google-calendar-create-event.flow.json \
  --input googleCalendarConnectionKey="<your-key>" \
  --input summary="Team Standup" \
  --input startDateTime="2024-03-15T10:00:00-07:00" \
  --input endDateTime="2024-03-15T10:30:00-07:00" \
  --input attendees="alice@example.com,bob@example.com"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `googleCalendarConnectionKey` | Yes | Google Calendar connection key |
| `calendarId` | No | Calendar ID (default: 'primary') |
| `summary` | Yes | Event title |
| `description` | No | Event description (supports HTML) |
| `location` | No | Event location |
| `startDateTime` | Yes | Start (ISO 8601 datetime or YYYY-MM-DD for all-day) |
| `endDateTime` | Yes | End (ISO 8601 datetime or YYYY-MM-DD for all-day) |
| `timeZone` | No | Time zone (e.g., 'America/Los_Angeles') |
| `attendees` | No | Comma-separated attendee emails |
| `sendUpdates` | No | 'all', 'externalOnly', or 'none' (default) |

**What it does under the hood:**

1. Detects all-day events (date-only format) vs timed events
2. Builds event object with start/end, attendees, location
3. Creates event via `POST /v3/calendars/{calendarId}/events`

**All-day event example:**

```bash
one flow execute google-calendar-create-event.flow.json \
  --input googleCalendarConnectionKey="<your-key>" \
  --input summary="Company Offsite" \
  --input startDateTime="2024-03-15" \
  --input endDateTime="2024-03-17"
```

## Adapting These Flows

- **Meeting from email**: Chain `gmail-read-emails` into this flow to auto-schedule meetings from email content.
- **Recurring sync**: Use the list events action to detect conflicts before creating.
- **Calendar + CRM**: Create an event and log it as an activity in HubSpot or ActiveCampaign.
