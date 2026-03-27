---
name: github
description: |
  GitHub integration flows for the One CLI. Ready-to-run workflows that handle
  the orchestration complexity (list+detail patterns, PR review aggregation,
  search+inspect, webhook configuration) so you don't have to.
triggers:
  - "github"
  - "/github"
  - "create issue"
  - "list issues"
  - "create pull request"
  - "review pull requests"
  - "search repos"
  - "search repositories"
  - "setup webhook"
  - "commit history"
---

# GitHub Flows

Ready-to-run workflows for GitHub via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add github                     # Connect your GitHub account
one --agent list                   # Find your connection key
```

## Flows

### List Issues

Lists issues from a repository with optional comment fetching. Handles the
GitHub API quirk where the issues endpoint also returns pull requests (filters
them out automatically).

```bash
one flow execute github-list-issues.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input owner="withoneai" \
  --input repo="one" \
  --input state="open" \
  --input labels="bug" \
  --input maxResults=10 \
  --input includeComments=true
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `owner` | Yes | Repository owner (user or org) |
| `repo` | Yes | Repository name |
| `state` | No | Filter: `open`, `closed`, or `all` (default: `open`) |
| `labels` | No | Comma-separated label names to filter by |
| `assignee` | No | Filter by assignee. `*` for any, `none` for unassigned |
| `sort` | No | Sort by: `created`, `updated`, or `comments` |
| `maxResults` | No | Number of issues (1-100, default 10) |
| `includeComments` | No | Fetch comments per issue (default: false) |

**What it does under the hood:**

1. Builds query parameters from filters (state, labels, assignee, sort)
2. Lists issues via `GET /repos/{owner}/{repo}/issues`
3. Filters out pull requests (GitHub returns PRs in the issues endpoint)
4. Optionally fetches comments for each issue in parallel (5 concurrent)
5. Assembles clean response with labels, assignees, body preview, and comments

---

### Create Issue

Creates an issue with title, body, labels, assignees, and milestone.

```bash
one flow execute github-create-issue.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input owner="withoneai" \
  --input repo="one" \
  --input title="Bug: login page 500 error" \
  --input body="Steps to reproduce:\n1. Go to /login\n2. Click submit with empty fields" \
  --input labels='["bug", "priority:high"]' \
  --input assignees='["moebot"]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `owner` | Yes | Repository owner |
| `repo` | Yes | Repository name |
| `title` | Yes | Issue title |
| `body` | No | Issue body (GitHub-flavored markdown) |
| `labels` | No | Label names to apply (array) |
| `assignees` | No | GitHub usernames to assign (array) |
| `milestone` | No | Milestone number |

**What it does under the hood:**

1. Validates required fields and builds the payload
2. Creates the issue via `POST /repos/{owner}/{repo}/issues`
3. Returns issue number, URL, applied labels, and assignees

---

### Review Pull Requests

Lists PRs with full details including diff stats, mergeable status, and review
summaries. Handles the multi-step orchestration: list PRs, fetch full details
(which includes additions/deletions/changed files), and fetch reviews.

```bash
one flow execute github-pr-review.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input owner="withoneai" \
  --input repo="one" \
  --input state="open" \
  --input maxResults=5 \
  --input includeReviews=true
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `owner` | Yes | Repository owner |
| `repo` | Yes | Repository name |
| `state` | No | Filter: `open`, `closed`, or `all` (default: `open`) |
| `sort` | No | Sort by: `created`, `updated`, or `popularity` |
| `maxResults` | No | Number of PRs (1-30, default 5) |
| `includeReviews` | No | Fetch review status per PR (default: true) |

**What it does under the hood:**

1. Lists PRs via `GET /repos/{owner}/{repo}/pulls`
2. For each PR, fetches full details via `GET /repos/{owner}/{repo}/pulls/{number}` (this is the only way to get diff stats like additions/deletions)
3. Optionally fetches reviews via `GET /repos/{owner}/{repo}/pulls/{number}/reviews`
4. Computes review summary: approved count, changes-requested count, deduped by reviewer (only latest review per user counts)
5. Returns mergeable status, branch info, labels, and review breakdown

---

### Create Pull Request

Creates a PR with title, body, head/base branches, and draft mode.

```bash
one flow execute github-create-pr.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input owner="withoneai" \
  --input repo="one" \
  --input title="feat: add webhook support" \
  --input body="## Summary\n- Adds webhook creation endpoint\n- Handles signature verification" \
  --input head="feature/webhooks" \
  --input base="main" \
  --input draft=true
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `owner` | Yes | Repository owner |
| `repo` | Yes | Repository name |
| `title` | Yes | PR title |
| `body` | No | PR description (GitHub-flavored markdown) |
| `head` | Yes | Branch with your changes (e.g., `feature-branch` or `fork-owner:branch`) |
| `base` | No | Target branch (default: `main`) |
| `draft` | No | Create as draft PR (default: false) |

**What it does under the hood:**

1. Validates required fields (title, head branch)
2. Creates the PR via `POST /repos/{owner}/{repo}/pulls`
3. Returns PR number, URL, branch info, and draft status

---

### Search Repositories

Searches GitHub repositories with optional recent commit fetching. Uses the
search+inspect pattern: find repos matching a query, then optionally fetch
recent commits for each.

```bash
one flow execute github-repo-search.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input query="language:typescript stars:>1000 topic:cli" \
  --input sort="stars" \
  --input maxResults=10 \
  --input includeCommits=true
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `query` | Yes | GitHub search query (see syntax below) |
| `sort` | No | Sort: `stars`, `forks`, `help-wanted-issues`, `updated`, or `best-match` |
| `maxResults` | No | Number of repos (1-30, default 5) |
| `includeCommits` | No | Fetch 5 recent commits per repo (default: false) |

**Search query examples:**

| Query | Meaning |
|-------|---------|
| `language:typescript` | TypeScript repositories |
| `stars:>1000` | More than 1000 stars |
| `org:withoneai` | Repositories in an organization |
| `topic:cli` | Repos with the "cli" topic |
| `created:>2024-01-01` | Created after a date |
| `language:rust stars:>100 topic:wasm` | Combined filters |

**What it does under the hood:**

1. Builds search query with sort and pagination
2. Searches via `GET /search/repositories`
3. Optionally fetches recent commits for each repo in parallel (5 concurrent)
4. Returns stars, forks, language, topics, and optional commit history

---

### Setup Webhook

Creates a webhook on a repository with configurable events, content type, and
optional secret for signature verification.

```bash
one flow execute github-webhook-setup.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input owner="withoneai" \
  --input repo="one" \
  --input url="https://your-server.com/webhook" \
  --input events='["push", "pull_request", "issues"]' \
  --input secret="your-webhook-secret"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `owner` | Yes | Repository owner |
| `repo` | Yes | Repository name |
| `url` | Yes | Webhook payload URL (must be HTTPS) |
| `events` | No | Events to trigger on (default: `["push"]`). Use `["*"]` for all. |
| `secret` | No | Secret for signature verification (recommended) |
| `contentType` | No | `json` or `form` (default: `json`) |
| `active` | No | Whether webhook is active immediately (default: true) |

**Common event types:**

| Event | Triggers on |
|-------|-------------|
| `push` | Any push to a branch |
| `pull_request` | PR opened, closed, merged, etc. |
| `issues` | Issue opened, closed, labeled, etc. |
| `issue_comment` | Comment on an issue or PR |
| `release` | Release published |
| `*` | All events |

**What it does under the hood:**

1. Validates URL is HTTPS
2. Builds webhook config with content type and optional secret
3. Creates webhook via `POST /repos/{owner}/{repo}/hooks`
4. Returns webhook ID, events, and test/ping URLs

---

### Commit History

Fetches commit history with filtering by branch, author, path, and date range.

```bash
one flow execute github-commit-history.flow.json \
  --input githubConnectionKey="<your-key>" \
  --input owner="withoneai" \
  --input repo="one" \
  --input branch="main" \
  --input author="moebot" \
  --input since="2024-01-01T00:00:00Z" \
  --input maxResults=20
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `githubConnectionKey` | Yes | Your GitHub connection key |
| `owner` | Yes | Repository owner |
| `repo` | Yes | Repository name |
| `branch` | No | Branch name (defaults to repo's default branch) |
| `author` | No | Filter by author (username or email) |
| `path` | No | Filter by file path (commits touching this path) |
| `since` | No | After this date (ISO 8601) |
| `until` | No | Before this date (ISO 8601) |
| `maxResults` | No | Number of commits (1-100, default 20) |

**What it does under the hood:**

1. Builds query parameters from filters (branch, author, path, date range)
2. Lists commits via `GET /repos/{owner}/{repo}/commits`
3. Parses commit messages, author info, verification status
4. Computes summary stats: unique authors, date range

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Issue triage bot**: Chain `github-list-issues` with a labeling action to auto-categorize new issues.
- **PR dashboard**: Use `github-pr-review` to build a daily digest of PRs needing review, pipe into Slack.
- **Release notes**: Combine `github-commit-history` (filter by date range between tags) with an LLM to generate changelogs.
- **Repo monitoring**: Use `github-repo-search` with `org:your-org` to track all repos, chain with `github-webhook-setup` to register webhooks.
- **Auto-assign**: Chain `github-list-issues` (unassigned) with an update action to assign based on labels.

The orchestration knowledge is in each flow's `code` steps. Read them to understand the list+detail patterns, PR review deduplication, and search query construction -- then build your own variations.
