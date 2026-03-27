---
name: notion
description: |
  Notion integration flows for the One CLI. Create pages in databases or as
  sub-pages, and query databases with filters, sorts, and pagination.
triggers:
  - "notion"
  - "create page notion"
  - "query database notion"
  - "notion database"
  - "add to notion"
  - "/notion"
---

# Notion Flows

Ready-to-run workflows for Notion via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add notion                     # Connect your Notion workspace
one --agent list                   # Find your connection key
```

## Discovery

You need a `databaseId` or `parentId` (page ID) before using the flows. Find them with:

```bash
# Search for databases and pages by title
one --agent actions search notion "search"
one --agent actions execute notion <search-action-id> <your-connection-key> \
  --body '{"query":"My Database","filter":{"property":"object","value":"database"}}'

# Search for pages
one --agent actions execute notion <search-action-id> <your-connection-key> \
  --body '{"query":"My Page","filter":{"property":"object","value":"page"}}'
```

Database and page IDs are also visible in Notion URLs: `notion.so/Your-Page-<32-char-id>`.

## Flows

### Create Page

Create a new page in a Notion database (with properties) or as a child of another page.

```bash
# Create in a database
one flow execute notion-create-page.flow.json \
  --input notionConnectionKey="<your-key>" \
  --input parentType="database" \
  --input parentId="<database-id>" \
  --input title="Weekly Report" \
  --input content="Summary of this week's progress..."

# Create as a sub-page
one flow execute notion-create-page.flow.json \
  --input notionConnectionKey="<your-key>" \
  --input parentType="page" \
  --input parentId="<page-id>" \
  --input title="Meeting Notes"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `notionConnectionKey` | Yes | Notion connection key |
| `parentType` | Yes | 'database' or 'page' |
| `parentId` | Yes | Database ID or parent page ID |
| `title` | Yes | Page title |
| `properties` | No | Database properties object (for database parent) |
| `content` | No | Plain text content (added as a paragraph block) |
| `children` | No | Array of Notion block objects (overrides content) |

**What it does under the hood:**

1. Builds parent reference (database_id or page_id)
2. For database parents, maps the title into the Name/title property
3. Converts plain text content to a paragraph block
4. Creates the page via `POST /pages`

**Database properties example:**

```json
{
  "Status": {"select": {"name": "In Progress"}},
  "Priority": {"select": {"name": "High"}},
  "Due Date": {"date": {"start": "2024-03-20"}}
}
```

### Query Database

Query a Notion database with filters, sorts, and pagination.

```bash
one flow execute notion-query-database.flow.json \
  --input notionConnectionKey="<your-key>" \
  --input databaseId="<database-id>" \
  --input filter='{"property":"Status","select":{"equals":"In Progress"}}' \
  --input sorts='[{"property":"Created","direction":"descending"}]' \
  --input pageSize=10
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `notionConnectionKey` | Yes | Notion connection key |
| `databaseId` | Yes | Notion database ID |
| `filter` | No | Notion filter object |
| `sorts` | No | Array of sort objects |
| `pageSize` | No | Results per page (max 100, default 25) |
| `startCursor` | No | Pagination cursor |

**Filter examples:**

| Filter | Description |
|--------|-------------|
| `{"property": "Status", "select": {"equals": "Done"}}` | Status is Done |
| `{"property": "Name", "rich_text": {"contains": "report"}}` | Name contains "report" |
| `{"property": "Created", "date": {"after": "2024-01-01"}}` | Created after date |
| `{"and": [{...}, {...}]}` | Compound filter |

## Adapting These Flows

- **Task tracker**: Create pages in a tasks database from email or Slack triggers.
- **Meeting log**: Chain `calendly-list-events` into `notion-create-page` to log meetings.
- **Dashboard data**: Query a database and pipe results into Google Sheets.
- **Rich content**: Pass custom `children` blocks to create pages with headings, lists, toggles, and embedded content.
