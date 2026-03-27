---
name: jira
description: |
  Jira Cloud integration flows for the One CLI. Ready-to-run workflows that
  handle orchestration complexity (Atlassian Document Format encoding, JQL
  search, two-step transition lookups) so you don't have to.
triggers:
  - "create issue"
  - "create ticket"
  - "search issues"
  - "jql search"
  - "transition issue"
  - "move issue"
  - "add comment"
  - "get issue"
  - "jira"
  - "/jira"
---

# Jira Flows

Ready-to-run workflows for Jira Cloud via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add jira                       # Connect your Jira Cloud account
one --agent list                   # Find your connection key
```

## Discovery

Jira flows require a Cloud ID and project/issue type IDs. Find them with:

```bash
# Get your Jira Cloud ID (a UUID identifying your Jira site)
one --agent actions search jira "get sites"
one --agent actions execute jira <get-sites-action-id> <your-connection-key>

# List projects (to find projectKey like "ENG")
one --agent actions search jira "get projects"
one --agent actions execute jira <get-projects-action-id> <your-connection-key> \
  --path-vars '{"cloudId":"<your-cloud-id>"}'

# List issue types (to find issueTypeId like "10001" for Task)
one --agent actions search jira "get issue types"
one --agent actions execute jira <get-issue-types-action-id> <your-connection-key> \
  --path-vars '{"cloudId":"<your-cloud-id>"}'
```

## Flows

### Create Issue

Creates a Jira issue with proper Atlassian Document Format (ADF) for the
description. Handles project lookup by key, ADF encoding, labels, priority,
and optional subtask creation.

```bash
one flow execute jira-create-issue.flow.json \
  --input jiraConnectionKey="<your-key>" \
  --input jiraCloudId="<your-cloud-id>" \
  --input projectKey="ENG" \
  --input issueTypeId="10001" \
  --input summary="API rate limiting not enforced" \
  --input description="The /api/v2/users endpoint has no rate limiting.\nThis allows abuse." \
  --input priority="High" \
  --input labels='["backend","security"]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `jiraConnectionKey` | Yes | Your Jira connection key |
| `jiraCloudId` | Yes | Jira Cloud site ID (UUID) |
| `projectKey` | Yes | Project key (e.g., `ENG`) |
| `issueTypeId` | Yes | Issue type ID (e.g., `10001` for Task) |
| `summary` | Yes | Issue title |
| `description` | No | Plain text, auto-converted to ADF |
| `priority` | No | Priority name (`High`, `Medium`, `Low`) |
| `labels` | No | Array of label strings |
| `assigneeAccountId` | No | Atlassian account ID of the assignee |
| `parentKey` | No | Parent issue key for subtask creation |

**What it does under the hood:**

1. Converts plain text description to Atlassian Document Format (ADF)
2. Builds the `fields` payload with project key, issue type, priority, labels, and assignee
3. Creates the issue via `POST /rest/api/3/issue`
4. Returns the new issue key and ID

---

### Search Issues (JQL)

Searches for Jira issues using JQL. Returns structured results with key
fields extracted (summary, status, assignee, priority).

```bash
one flow execute jira-search-issues.flow.json \
  --input jiraConnectionKey="<your-key>" \
  --input jiraCloudId="<your-cloud-id>" \
  --input jql="project = ENG AND status = 'In Progress' ORDER BY updated DESC" \
  --input maxResults=10
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `jiraConnectionKey` | Yes | Your Jira connection key |
| `jiraCloudId` | Yes | Jira Cloud site ID (UUID) |
| `jql` | Yes | JQL query (must be bounded) |
| `maxResults` | No | Max issues to return (1-100, default 20) |
| `fields` | No | Comma-separated field list (default: summary, status, assignee, priority, created, updated) |
| `nextPageToken` | No | Pagination token from a previous response |

**JQL examples:**

| Query | Meaning |
|-------|---------|
| `project = ENG AND status = "To Do"` | Open issues in ENG project |
| `assignee = currentUser() ORDER BY updated DESC` | Your issues, recently updated first |
| `priority = High AND statusCategory != Done` | High priority, not yet done |
| `labels = bug AND created >= -7d` | Bugs created in the last 7 days |
| `text ~ "rate limit"` | Full-text search |

---

### Get Issue

Retrieves full details for a Jira issue. Extracts and structures key fields
including description (ADF decoded to plain text), recent comments, status,
and assignee.

```bash
one flow execute jira-get-issue.flow.json \
  --input jiraConnectionKey="<your-key>" \
  --input jiraCloudId="<your-cloud-id>" \
  --input issueIdOrKey="ENG-42"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `jiraConnectionKey` | Yes | Your Jira connection key |
| `jiraCloudId` | Yes | Jira Cloud site ID (UUID) |
| `issueIdOrKey` | Yes | Issue ID or key (e.g., `ENG-42`) |
| `fields` | No | Comma-separated field list (default: `*navigable`) |
| `expand` | No | Expand options: `renderedFields`, `transitions`, `changelog`, `editmeta` |

**What it does under the hood:**

1. Fetches the issue via `GET /rest/api/3/issue/{issueIdOrKey}`
2. Decodes ADF description to plain text
3. Extracts last 5 comments with author and timestamp
4. Returns structured response with key fields

---

### Transition Issue

Moves a Jira issue through its workflow. Automatically looks up available
transitions and matches by status name, so you don't need to know transition
IDs.

```bash
one flow execute jira-transition-issue.flow.json \
  --input jiraConnectionKey="<your-key>" \
  --input jiraCloudId="<your-cloud-id>" \
  --input issueIdOrKey="ENG-42" \
  --input targetStatus="Done" \
  --input comment="Fixed in PR #187" \
  --input resolution="Fixed"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `jiraConnectionKey` | Yes | Your Jira connection key |
| `jiraCloudId` | Yes | Jira Cloud site ID (UUID) |
| `issueIdOrKey` | Yes | Issue ID or key |
| `targetStatus` | Yes | Target status name (case-insensitive match) |
| `comment` | No | Comment to add during transition |
| `resolution` | No | Resolution name (e.g., `Fixed`, `Won't Do`) |

**What it does under the hood:**

1. Fetches available transitions via `GET /rest/api/3/issue/{id}/transitions`
2. Matches `targetStatus` against transition names and destination statuses (case-insensitive)
3. Builds the transition payload with optional comment (ADF) and resolution
4. Executes the transition via `POST /rest/api/3/issue/{id}/transitions`
5. Throws a descriptive error listing available transitions if no match is found

---

### Add Comment

Adds a comment to a Jira issue. Converts plain text to Atlassian Document
Format automatically. Supports visibility restrictions.

```bash
one flow execute jira-add-comment.flow.json \
  --input jiraConnectionKey="<your-key>" \
  --input jiraCloudId="<your-cloud-id>" \
  --input issueIdOrKey="ENG-42" \
  --input comment="Investigated the root cause. See attached logs."
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `jiraConnectionKey` | Yes | Your Jira connection key |
| `jiraCloudId` | Yes | Jira Cloud site ID (UUID) |
| `issueIdOrKey` | Yes | Issue ID or key |
| `comment` | Yes | Comment text (plain text, auto-converted to ADF) |
| `visibilityType` | No | `group` or `role` |
| `visibilityValue` | No | Group name or role name to restrict visibility |

**What it does under the hood:**

1. Converts plain text to ADF with paragraph breaks preserved
2. Optionally attaches visibility restrictions (group or role)
3. Posts the comment via `POST /rest/api/3/issue/{id}/comment`

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Bug triage pipeline**: Chain `jira-search-issues` to find open bugs, then `jira-transition-issue` to move them to "In Review".
- **Sprint standup report**: Use `jira-search-issues` with `assignee = currentUser() AND sprint in openSprints()` and pipe to Slack.
- **Auto-create from alerts**: Use `jira-create-issue` as a step in a multi-platform flow triggered by PagerDuty or Datadog.
- **Close with comment**: Chain `jira-add-comment` and `jira-transition-issue` to close issues with a summary.
- **Issue detail lookup**: Use `jira-get-issue` with `expand=transitions` to discover available workflow transitions before building automation.

## Key Concepts

**Atlassian Document Format (ADF):** Jira's rich text format. These flows handle the conversion from plain text to ADF automatically. If you need richer formatting (tables, code blocks, mentions), modify the `textToAdf` function in the code steps.

**JQL (Jira Query Language):** Jira's query language for searching issues. Queries must be "bounded" (include a search restriction like `project = X`). The enhanced search endpoint used here supports up to 5000 results per query.

**Transitions:** Jira issues move through workflow states via transitions. The transition ID (not the status name) is what the API requires. The `jira-transition-issue` flow handles this lookup automatically.

The orchestration knowledge is in the flow's `code` steps. Read them to understand the ADF encoding, JQL parameter construction, and transition matching patterns, then build your own variations.
