---
name: trello
description: |
  Trello board management flow for the One CLI. Create cards, list cards, and
  browse boards with automatic list name resolution.
triggers:
  - "trello card"
  - "create card"
  - "trello board"
  - "list cards"
  - "/trello"
---

# Trello Flows

Ready-to-run Trello board management via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add trello                     # Connect your Trello account
one --agent list                   # Find your connection key
```

## Discovery

You need a `boardId` before using the flows. Find it with:

```bash
# List all your Trello boards
one --agent actions search trello "get boards"
one --agent actions execute trello <get-boards-action-id> <your-connection-key>
```

The flow automatically resolves list names to IDs, so you only need the board ID.

## Flows

### Manage Cards

Create a new card or list all cards on a board. Automatically fetches board lists
so you can reference lists by name instead of ID.

**Create a card:**

```bash
one flow execute trello-manage-cards.flow.json \
  --input trelloConnectionKey="<your-key>" \
  --input boardId="<board-id>" \
  --input action="create" \
  --input listName="To Do" \
  --input cardName="Review PR #42" \
  --input cardDesc="Check the API changes"
```

**List all cards on a board:**

```bash
one flow execute trello-manage-cards.flow.json \
  --input trelloConnectionKey="<your-key>" \
  --input boardId="<board-id>" \
  --input action="list"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `trelloConnectionKey` | Yes | Your Trello connection key |
| `boardId` | Yes | Board ID (24-character hex) |
| `action` | Yes | `create` to add a card, `list` to get all cards |
| `listName` | No | List name for card creation (case-insensitive match) |
| `listId` | No | Direct list ID (overrides listName) |
| `cardName` | No | Card title (required for create) |
| `cardDesc` | No | Card description (Markdown supported) |
| `due` | No | Due date in ISO format |
| `pos` | No | Position: top, bottom, or number |

**What it does under the hood:**

1. Fetches all open lists on the board (so you can use list names, not just IDs)
2. For `create`: resolves list by name, creates card via Trello API
3. For `list`: fetches all open cards and maps each to its list name
4. Returns structured results with card URLs and list context

## Adapting These Flows

- **Move cards**: Fork the flow and add an update-card step with a new `idList`
- **Daily standup**: Chain `list` action with a Slack flow to post board status
- **Sprint board**: Create cards in bulk by looping the create action
