---
name: serp-api
description: |
  SerpApi Google search flow for the One CLI. Run structured Google searches with
  organic results, local pack, knowledge graph, and location targeting.
triggers:
  - "google search"
  - "serp search"
  - "serpapi"
  - "search google"
  - "/serp-api"
---

# SerpApi Flows

Ready-to-run Google search via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add serp-api                   # Connect your SerpApi account
one --agent list                   # Find your connection key
```

## Flows

### Google Search

Runs a Google search and returns structured SERP results including organic results,
local pack, knowledge graph, and related searches. Supports location targeting,
language, pagination, and Google search operators.

```bash
one flow execute serp-api-google-search.flow.json \
  --input serpApiConnectionKey="<your-key>" \
  --input query="best coffee shops" \
  --input location="Austin, Texas, United States" \
  --input gl="us" \
  --input hl="en"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `serpApiConnectionKey` | Yes | Your SerpApi connection key |
| `query` | Yes | Search query (supports site:, inurl:, intitle: operators) |
| `location` | No | Location to search from (e.g., "Austin, Texas, United States") |
| `gl` | No | Country code (e.g., us, uk, fr) |
| `hl` | No | Language code (e.g., en, es, fr) |
| `num` | No | Results per page (default: 10) |
| `start` | No | Offset for pagination (0 = first page, 10 = second) |

**What it does under the hood:**

1. Builds search parameters with query, location, and language settings
2. Calls SerpApi Google engine (`GET /search.json?engine=google`)
3. Extracts organic results, local results, knowledge graph, and related searches
4. Returns clean, structured data ready for analysis or downstream use

**Search query examples:**

| Query | Meaning |
|-------|---------|
| `site:example.com ai tools` | Search within a specific site |
| `intitle:review "macbook pro"` | Title must contain "review" |
| `filetype:pdf machine learning` | Find PDF documents |
| `"exact phrase" -exclude` | Exact match, excluding a term |
