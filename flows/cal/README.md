---
name: cal
description: |
  Cal.com integration flows for the One CLI. Create bookings, list events,
  check availability, and manage event types on Cal.com.
triggers:
  - "cal.com"
  - "cal"
  - "create booking"
  - "list bookings"
  - "event types cal"
  - "availability"
  - "/cal"
---

# Cal.com Flows

Ready-to-run workflows for Cal.com via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add cal-com                    # Connect your Cal.com account
one --agent list                   # Find your connection key
```

## Discovery

Creating a booking requires an `eventTypeId`. Find yours using the manage event types flow:

```bash
# List all your event types (returns IDs, names, and durations)
one flow execute cal-manage-event-types.flow.json \
  --input calConnectionKey="<your-key>" \
  --input operation="list-event-types"
```

## Flows

### Create Booking

Book an event on Cal.com for an attendee.

```bash
one flow execute cal-create-booking.flow.json \
  --input calConnectionKey="<your-key>" \
  --input eventTypeId=12345 \
  --input start="2024-03-15T10:00:00Z" \
  --input attendeeName="Alice Smith" \
  --input attendeeEmail="alice@example.com"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `calConnectionKey` | Yes | Cal.com connection key |
| `eventTypeId` | Yes | Event type ID to book |
| `start` | Yes | Start time (ISO 8601) |
| `attendeeName` | Yes | Attendee's name |
| `attendeeEmail` | Yes | Attendee's email |
| `attendeeTimeZone` | No | Time zone (default: America/New_York) |
| `notes` | No | Booking notes |
| `metadata` | No | Custom metadata object |

### List Bookings

List bookings with optional status and date filtering.

```bash
one flow execute cal-list-bookings.flow.json \
  --input calConnectionKey="<your-key>" \
  --input status="upcoming"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `calConnectionKey` | Yes | Cal.com connection key |
| `status` | No | 'upcoming', 'past', 'cancelled', 'unconfirmed' |
| `afterStart` | No | Filter after this date (ISO 8601) |
| `beforeEnd` | No | Filter before this date (ISO 8601) |

### Manage Event Types

List event types or check available time slots.

```bash
# List event types
one flow execute cal-manage-event-types.flow.json \
  --input calConnectionKey="<your-key>" \
  --input operation="list-event-types"

# Check availability
one flow execute cal-manage-event-types.flow.json \
  --input calConnectionKey="<your-key>" \
  --input operation="get-slots" \
  --input eventTypeId="12345" \
  --input startTime="2024-03-15T00:00:00Z" \
  --input endTime="2024-03-22T00:00:00Z"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `calConnectionKey` | Yes | Cal.com connection key |
| `operation` | Yes | 'list-event-types' or 'get-slots' |
| `eventTypeId` | For get-slots | Event type ID |
| `startTime` | For get-slots | Availability window start (ISO 8601) |
| `endTime` | For get-slots | Availability window end (ISO 8601) |

## Adapting These Flows

- **Scheduling assistant**: Chain `cal-manage-event-types` (get-slots) into `cal-create-booking` to find and book the next available slot.
- **Booking digest**: Use `cal-list-bookings` and pipe results into a Slack or email notification.
- **Cancel/reschedule**: Use the cancel or reschedule actions with a booking UID from `cal-list-bookings`.
