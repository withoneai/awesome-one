---
name: attio
description: |
  Attio CRM integration flows for the One CLI. Ready-to-run workflows for
  managing people, companies, notes, tasks, and lists in Attio -- handling
  upsert matching, filter/sort queries, and Attio's values-as-arrays data model.
triggers:
  - "attio"
  - "/attio"
  - "upsert person"
  - "upsert company"
  - "add to crm"
  - "crm search"
  - "search contacts"
  - "create task"
  - "add note"
  - "add to list"
---

# Attio Flows

Ready-to-run workflows for [Attio CRM](https://attio.com) via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add attio                      # Connect your Attio workspace
one --agent list                   # Find your connection key
```

## Discovery

Some flows require record IDs or list slugs. Find them with:

```bash
# Search for a person or company record (to get record IDs for notes/tasks/lists)
one flow execute attio-search-records.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input object="people" \
  --input limit=10

# List available lists (to get list slugs for add-to-list)
one --agent actions search attio "list lists"
one --agent actions execute attio <list-lists-action-id> <your-connection-key>
```

## Flows

### Upsert Person

Creates or updates a person record by matching on email. If a person with the
given email exists, the record is updated; otherwise a new one is created.

```bash
one flow execute attio-upsert-person.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input email="ada@example.com" \
  --input firstName="Ada" \
  --input lastName="Lovelace"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `attioConnectionKey` | Yes | Your Attio connection key |
| `email` | Yes | Email address (matching attribute) |
| `firstName` | No | First name |
| `lastName` | No | Last name |
| `phone` | No | Phone number |
| `description` | No | Bio or description |

**What it does under the hood:**

1. Builds a `data.values` payload with email, name, phone, and description attributes
2. Calls Attio's PUT `/objects/people/records?matching_attribute=email_addresses` (assert/upsert endpoint)
3. Returns the record ID, web URL, and creation timestamp

### Upsert Company

Creates or updates a company record by matching on domain.

```bash
one flow execute attio-upsert-company.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input domain="acme.com" \
  --input name="Acme Corp"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `attioConnectionKey` | Yes | Your Attio connection key |
| `domain` | Yes | Company domain (matching attribute) |
| `name` | No | Company name |
| `description` | No | Company description |

**What it does under the hood:**

1. Builds a `data.values` payload with domain, name, and description attributes
2. Calls Attio's PUT `/objects/companies/records?matching_attribute=domains` (assert/upsert endpoint)
3. Returns the record ID, web URL, and creation timestamp

### Search Records

Queries people, companies, or any custom object with optional filtering and sorting.

```bash
one flow execute attio-search-records.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input object="people" \
  --input limit=20
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `attioConnectionKey` | Yes | Your Attio connection key |
| `object` | Yes | Object slug (`people`, `companies`, or custom slug) |
| `filter` | No | Attio filter object (default: `{}` for all records) |
| `sorts` | No | Array of sort objects, e.g., `[{"direction":"asc","attribute":"name"}]` |
| `limit` | No | Max records to return (1-500, default 50) |
| `offset` | No | Pagination offset (default 0) |

**What it does under the hood:**

1. Builds a query body with filter, sorts, limit, and offset
2. Calls Attio's POST `/objects/{object}/records/query`
3. Extracts readable values (names, emails, domains) from Attio's values-as-arrays format
4. Returns a flat array of records with common fields extracted

### Add Note

Creates a note attached to any record (person, company, etc.).

```bash
one flow execute attio-add-note.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input parentObject="people" \
  --input parentRecordId="891dcbfc-9141-415d-9b2a-2238a6cc012d" \
  --input title="Call Notes" \
  --input content="Discussed pricing. Follow up next week."
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `attioConnectionKey` | Yes | Your Attio connection key |
| `parentObject` | Yes | Object slug (`people`, `companies`, etc.) |
| `parentRecordId` | Yes | UUID of the record to attach the note to |
| `title` | Yes | Note title (plaintext) |
| `content` | Yes | Note body |
| `format` | No | `plaintext` (default) or `markdown` |

**What it does under the hood:**

1. Sends the note payload to Attio's POST `/notes` endpoint
2. Supports both plaintext and markdown formatting
3. Returns the note ID and creation timestamp

### Create Task

Creates a task, optionally linked to a record and assigned to a team member.

```bash
one flow execute attio-create-task.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input content="Follow up with Ada about pricing proposal" \
  --input deadlineAt="2025-06-01T00:00:00.000Z" \
  --input assigneeEmail="teammate@company.com" \
  --input linkedObject="people" \
  --input linkedRecordId="891dcbfc-9141-415d-9b2a-2238a6cc012d"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `attioConnectionKey` | Yes | Your Attio connection key |
| `content` | Yes | Task description (plaintext, max 2000 chars) |
| `deadlineAt` | No | ISO 8601 deadline (e.g., `2025-06-01T00:00:00.000Z`) |
| `assigneeEmail` | No | Workspace member email to assign |
| `linkedObject` | No | Object slug of record to link (`people`, `companies`) |
| `linkedRecordId` | No | UUID of record to link |

**What it does under the hood:**

1. Builds a task payload with content, deadline, assignees, and linked records
2. Calls Attio's POST `/tasks` endpoint
3. Returns the task ID and creation timestamp

### Add to List

Adds a record to an Attio list (sales pipeline, onboarding, etc.).

```bash
one flow execute attio-add-to-list.flow.json \
  --input attioConnectionKey="<your-key>" \
  --input list="enterprise_sales" \
  --input parentObject="companies" \
  --input parentRecordId="bf071e1f-6035-429d-b874-d83ea64ea13b"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `attioConnectionKey` | Yes | Your Attio connection key |
| `list` | Yes | List slug or UUID |
| `parentObject` | Yes | Object slug (`people`, `companies`, etc.) |
| `parentRecordId` | Yes | UUID of the record to add |
| `entryValues` | No | Optional attribute values for the list entry |

**What it does under the hood:**

1. Sends the entry payload to Attio's POST `/lists/{list}/entries`
2. Returns the entry ID, list ID, and creation timestamp

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Enrich a person**: Chain `attio-search-records` (to find a record) with `attio-add-note` (to log context).
- **Sales pipeline**: Use `attio-upsert-company` then `attio-add-to-list` to add deals to a pipeline.
- **Meeting follow-up**: After a meeting, use `attio-create-task` to create follow-up tasks linked to the contact.
- **Sync from email**: Chain a Gmail read flow into `attio-upsert-person` to auto-create CRM records from inbound email.
- **Custom objects**: All record flows work with custom objects -- just pass the object slug instead of `people` or `companies`.

The orchestration knowledge is in the flow's `code` steps. Read them to understand Attio's values-as-arrays data model, upsert matching, and filter syntax -- then build your own variations.
