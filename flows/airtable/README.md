---
name: airtable
description: |
  Airtable integration flow for the One CLI. Create records in any Airtable
  base with field mapping and batch support.
triggers:
  - "airtable"
  - "create record airtable"
  - "add row airtable"
  - "/airtable"
---

# Airtable Flows

Ready-to-run workflows for Airtable via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add airtable                   # Connect your Airtable account
one --agent list                   # Find your connection key
```

## Discovery

You need a `baseId` and table name before using the flows. Find them with:

```bash
# List all bases in your Airtable account
one --agent actions search airtable "list bases"
one --agent actions execute airtable <list-bases-action-id> <your-connection-key>

# List tables in a specific base
one --agent actions search airtable "list tables"
one --agent actions execute airtable <list-tables-action-id> <your-connection-key> \
  --path-vars '{"baseId":"appXXXXXXXXXX"}'
```

## Flows

### Create Records

Create one or more records in an Airtable base table (max 10 per request).

```bash
one flow execute airtable-create-records.flow.json \
  --input airtableConnectionKey="<your-key>" \
  --input baseId="appXXXXXXXXXX" \
  --input tableIdOrName="Contacts" \
  --input records='[{"fields":{"Name":"Alice","Email":"alice@example.com"}}]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `airtableConnectionKey` | Yes | Airtable connection key |
| `baseId` | Yes | Base ID (starts with 'app') |
| `tableIdOrName` | Yes | Table ID or name |
| `records` | Yes | Array of record objects with `fields` |

**What it does under the hood:**

1. Validates records array (max 10 per Airtable API limit)
2. Normalizes record format (wraps in `{fields: ...}` if needed)
3. Creates records via `POST /{baseId}/{tableIdOrName}`

**Note:** Airtable limits batch creates to 10 records. For larger batches, split your array and call the flow multiple times.

## Adapting These Flows

- **Update records**: Swap the create action for the update record action with a record ID.
- **Log to Airtable**: Pipe output from any other flow into this one to create audit log rows.
- **Form submissions**: Combine with a webhook trigger to create Airtable records from form data.
