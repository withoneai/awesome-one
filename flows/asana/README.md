---
name: asana
description: |
  Asana integration flows for the One CLI. Ready-to-run workflows that handle
  the orchestration complexity (multi-step task creation with section placement,
  two-step list+detail patterns, project scaffolding) so you don't have to.
triggers:
  - "create task"
  - "asana task"
  - "list tasks"
  - "project tasks"
  - "create project"
  - "search tasks"
  - "asana"
  - "/asana"
---

# Asana Flows

Ready-to-run workflows for Asana via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add asana                      # Connect your Asana account
one --agent list                   # Find your connection key
```

## Discovery

Most Asana flows require IDs that aren't obvious. Find them with:

```bash
# List your workspaces (to get workspaceGid)
one --agent actions search asana "get workspaces"
one --agent actions execute asana <get-workspaces-action-id> <your-connection-key>

# List projects in a workspace (to get projectGid)
one --agent actions search asana "get projects"
one --agent actions execute asana <get-projects-action-id> <your-connection-key> \
  --query-params '{"workspace":"<workspace-gid>"}'

# List sections in a project (to get sectionGid)
one --agent actions search asana "get sections"
one --agent actions execute asana <get-sections-action-id> <your-connection-key> \
  --path-vars '{"project_gid":"<project-gid>"}'
```

## Flows

### Create Task

Creates a task with optional project and section assignment. Handles the
multi-step pattern where you first create the task, then move it to a
specific section within the project.

```bash
one flow execute asana-create-task.flow.json \
  --input asanaConnectionKey="<your-key>" \
  --input workspaceGid="<workspace-gid>" \
  --input name="Ship v2 release notes" \
  --input projectGid="<project-gid>" \
  --input sectionGid="<section-gid>" \
  --input assignee="me" \
  --input dueOn="2026-04-01"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `asanaConnectionKey` | Yes | Your Asana connection key |
| `name` | Yes | Task name |
| `workspaceGid` | Yes | Workspace GID |
| `projectGid` | No | Project GID to add the task to |
| `sectionGid` | No | Section GID to place the task in (requires projectGid) |
| `assignee` | No | Assignee GID or email address |
| `notes` | No | Task description (plain text) |
| `htmlNotes` | No | Task description (HTML, overrides notes) |
| `dueOn` | No | Due date (YYYY-MM-DD) |
| `tags` | No | Array of tag GIDs |
| `priority` | No | Priority level |

**What it does under the hood:**

1. Builds the task payload with workspace, project, assignee, and dates
2. Creates the task via `POST /tasks`
3. If `sectionGid` is provided, moves the task into that section via `POST /sections/{sectionGid}/addTask`

### List Project Tasks

Lists all tasks in a project with full details including assignee, due date,
completion status, section, and tags.

```bash
one flow execute asana-list-project-tasks.flow.json \
  --input asanaConnectionKey="<your-key>" \
  --input projectGid="<project-gid>" \
  --input completedSince="now"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `asanaConnectionKey` | Yes | Your Asana connection key |
| `projectGid` | Yes | Project GID to list tasks from |
| `completedSince` | No | Filter completed tasks (ISO 8601 date, or `"now"` to exclude completed) |
| `limit` | No | Max tasks to return (1-100, default 50) |

**What it does under the hood:**

1. Builds query params with opt_fields for full detail in a single request
2. Lists tasks via `GET /projects/{projectGid}/tasks` with expanded fields
3. Formats results with open/completed counts and section grouping

### Create Project with Sections

Creates a new project and sets up sections (columns for board view, groups
for list view). Handles the multi-step orchestration of creating the project
first, then adding each section sequentially.

```bash
one flow execute asana-create-project-with-sections.flow.json \
  --input asanaConnectionKey="<your-key>" \
  --input workspaceGid="<workspace-gid>" \
  --input name="Q2 Sprint Board" \
  --input layout="board" \
  --input sections='["Backlog", "Ready", "In Progress", "Review", "Done"]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `asanaConnectionKey` | Yes | Your Asana connection key |
| `name` | Yes | Project name |
| `workspaceGid` | Yes | Workspace GID |
| `teamGid` | No | Team GID (required for organization workspaces) |
| `layout` | No | `"board"` (kanban) or `"list"` (default: board) |
| `sections` | No | Array of section names (default: To Do, In Progress, Done) |
| `notes` | No | Project description |
| `color` | No | Project color (e.g., `"dark-green"`, `"dark-blue"`) |

**What it does under the hood:**

1. Creates the project via `POST /projects` with layout and metadata
2. Loops through section names sequentially (order matters)
3. Creates each section via `POST /projects/{projectGid}/sections`
4. Returns the project GID, permalink, and all created section GIDs

### Search Tasks

Searches for tasks across a workspace with filters for assignee, project,
completion status, due dates, and text.

```bash
one flow execute asana-search-tasks.flow.json \
  --input asanaConnectionKey="<your-key>" \
  --input workspaceGid="<workspace-gid>" \
  --input text="release notes" \
  --input completed=false \
  --input assignee="me"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `asanaConnectionKey` | Yes | Your Asana connection key |
| `workspaceGid` | Yes | Workspace GID to search within |
| `text` | No | Text to search in task names and descriptions |
| `assignee` | No | Assignee GID or `"me"` |
| `projectGid` | No | Scope search to a specific project |
| `completed` | No | `true` for completed, `false` for open, omit for both |
| `dueOnBefore` | No | Tasks due on or before this date (YYYY-MM-DD) |
| `dueOnAfter` | No | Tasks due on or after this date (YYYY-MM-DD) |
| `isBlocked` | No | Filter tasks blocked by dependencies |
| `sortBy` | No | Sort: `due_date`, `created_at`, `completed_at`, `likes`, `modified_at` (default) |
| `sortAscending` | No | Sort direction (default: false/descending) |

**What it does under the hood:**

1. Builds search query parameters from all provided filters
2. Searches via `GET /workspaces/{workspaceGid}/tasks/search` with opt_fields
3. Formats results with assignee names, sections, tags, and open/completed counts

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Sprint standup report**: Chain `asana-list-project-tasks` with a Slack message action to post a daily summary.
- **Bulk task creation**: Wrap `asana-create-task` in an outer loop to create multiple tasks from a CSV or spreadsheet.
- **Project templating**: Extend `asana-create-project-with-sections` to also create starter tasks in each section.
- **Overdue alerts**: Use `asana-search-tasks` with `dueOnBefore` set to today and `completed=false`, then pipe to Slack or email.
- **Cross-project dashboard**: Run `asana-list-project-tasks` across multiple projects and merge the results.

The orchestration knowledge is in the flow's `code` steps. Read them to understand the payload construction, section placement, and search parameter patterns -- then build your own variations.
