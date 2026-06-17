---
name: meet-geek
description: |
  MeetGeek meeting transcript flow for the One CLI. Retrieves meeting transcripts
  with speaker labels and timestamps.
triggers:
  - "meeting transcript"
  - "meetgeek"
  - "meet-geek"
  - "/meet-geek"
---

# MeetGeek Flows

Ready-to-run meeting transcript retrieval via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add meet-geek                  # Connect your MeetGeek account
one --agent list                   # Find your connection key
```

## Discovery

You need a `meetingId` to retrieve a transcript. Find it with:

```bash
# List recent meetings
one --agent actions search meet-geek "list meetings"
one --agent actions execute meet-geek <list-meetings-action-id> <your-connection-key>
```

## Flows

### Get Meeting Transcript

Retrieves the full transcript for a meeting with speaker labels and timestamps.
Supports pagination for long meetings.

```bash
one flow execute meet-geek-get-transcript.flow.json \
  --input meetGeekConnectionKey="<your-key>" \
  --input meetingId="17c36737-1bf5-4626-8483-88285f6a33ee"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `meetGeekConnectionKey` | Yes | Your MeetGeek connection key |
| `meetingId` | Yes | The meeting ID to get the transcript for |
| `limit` | No | Sentences per page (default: 100) |

**What it does under the hood:**

1. Calls MeetGeek API (`GET /v1/meetings/{meetingId}/transcript`) with pagination params
2. Parses transcript sentences with speaker labels, timestamps, and text
3. Identifies unique speakers
4. Returns structured transcript with pagination cursors for continuation
