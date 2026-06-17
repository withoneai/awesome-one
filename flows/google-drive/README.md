---
name: google-drive
description: |
  Google Drive integration flow for the One CLI. List/search files and create
  new files or folders in Google Drive.
triggers:
  - "google drive"
  - "list files"
  - "create folder"
  - "search drive"
  - "/google-drive"
---

# Google Drive Flows

Ready-to-run workflows for Google Drive via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add google-drive               # Connect your Google account
one --agent list                   # Find your connection key
```

## Flows

### Manage Files

List/search files or create a new file/folder in Google Drive. A single flow with two operations.

```bash
# Search for files
one flow execute google-drive-manage-files.flow.json \
  --input googleDriveConnectionKey="<your-key>" \
  --input operation="list" \
  --input query="name contains 'report'"

# Create a folder
one flow execute google-drive-manage-files.flow.json \
  --input googleDriveConnectionKey="<your-key>" \
  --input operation="create" \
  --input name="Project Assets" \
  --input mimeType="application/vnd.google-apps.folder"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `googleDriveConnectionKey` | Yes | Google Drive connection key |
| `operation` | Yes | 'list' or 'create' |
| `query` | No | Drive search query (list operation) |
| `name` | No | File/folder name (create operation) |
| `mimeType` | No | MIME type. Use `application/vnd.google-apps.folder` for folders |
| `parents` | No | Parent folder IDs array (create operation) |
| `pageSize` | No | Results per page (default 20, max 1000) |

**Drive search query examples:**

| Query | Meaning |
|-------|---------|
| `name contains 'report'` | Files with "report" in the name |
| `mimeType='application/vnd.google-apps.folder'` | Only folders |
| `modifiedTime > '2024-01-01'` | Modified after a date |
| `'folderId' in parents` | Files in a specific folder |
| `trashed = false` | Non-trashed files only |

## Adapting These Flows

- **Organize uploads**: Create a folder, then move or copy files into it.
- **Backup pipeline**: List files from one folder and copy them to another.
- **Drive + Sheets**: Create a Google Sheets file (mimeType: `application/vnd.google-apps.spreadsheet`) and then use the Sheets flow to populate it.
