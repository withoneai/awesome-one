---
name: google-docs
description: |
  Google Docs integration flow for the One CLI. Create documents with titles
  and content. Handles the two-step create-then-update pattern for inserting
  body text.
triggers:
  - "google docs"
  - "create document"
  - "create doc"
  - "new document"
  - "/google-docs"
---

# Google Docs Flows

Ready-to-run workflows for Google Docs via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add google-docs                # Connect your Google account
one --agent list                   # Find your connection key
```

## Flows

### Create Document

Create a new Google Doc with a title and optional body content.

```bash
one flow execute google-docs-create-document.flow.json \
  --input googleDocsConnectionKey="<your-key>" \
  --input title="Meeting Notes - March 15" \
  --input content="Attendees: Alice, Bob\n\nAgenda:\n1. Q1 review\n2. Planning"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `googleDocsConnectionKey` | Yes | Google Docs connection key |
| `title` | Yes | Document title |
| `content` | No | Plain text content for the document body |

**What it does under the hood:**

1. Creates a blank document with the title via `POST /v1/documents`
2. If content is provided, inserts text at position 1 via `POST /v1/documents/{documentId}` (batch update)
3. Returns the document ID, title, and edit URL

**Note:** The Google Docs API requires a two-step pattern: create the document first, then batch-update to insert content. This flow handles that automatically.

## Adapting These Flows

- **Meeting notes**: Chain `calendly-list-events` or `google-calendar` into this flow to auto-generate meeting note documents.
- **Rich content**: Replace the text insert with structured batch update requests (headings, lists, tables) using the `children` block format.
- **Templates**: Create a doc, then use batch update to insert content at specific locations.
