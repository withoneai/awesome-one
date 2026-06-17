---
name: google-sheets
description: |
  Google Sheets integration flow for the One CLI. Append rows of data to a
  spreadsheet with automatic value formatting and insert-after-last-row
  semantics.
triggers:
  - "google sheets"
  - "append rows"
  - "add to spreadsheet"
  - "spreadsheet"
  - "/google-sheets"
---

# Google Sheets Flows

Ready-to-run workflows for Google Sheets via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add google-sheets              # Connect your Google account
one --agent list                   # Find your connection key
```

## Discovery

You need a `spreadsheetId` to use these flows. Find it from:

- **URL**: Open the spreadsheet in your browser. The ID is in the URL: `docs.google.com/spreadsheets/d/<spreadsheetId>/edit`
- **Google Drive search**: Use the [Google Drive skill](../google-drive) to search for spreadsheets:
  ```bash
  one flow execute google-drive-manage-files.flow.json \
    --input googleDriveConnectionKey="<your-key>" \
    --input operation="list" \
    --input query="mimeType='application/vnd.google-apps.spreadsheet'"
  ```

## Flows

### Append Rows

Append one or more rows to a Google Sheets spreadsheet. Data is inserted after the last row containing data.

```bash
one flow execute google-sheets-append-rows.flow.json \
  --input googleSheetsConnectionKey="<your-key>" \
  --input spreadsheetId="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" \
  --input range="Sheet1" \
  --input values='[["Name","Email","Date"],["Alice","alice@example.com","2024-03-15"]]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `googleSheetsConnectionKey` | Yes | Google Sheets connection key |
| `spreadsheetId` | Yes | Spreadsheet ID (from URL) |
| `range` | No | Sheet name or A1 range (default: 'Sheet1') |
| `values` | Yes | 2D array of values (each inner array = one row) |
| `valueInputOption` | No | 'USER_ENTERED' (default, parsed) or 'RAW' (stored as-is) |

**What it does under the hood:**

1. Validates and formats the 2D values array
2. Appends via `POST /v4/spreadsheets/{id}/values/{range}:append`
3. Uses `INSERT_ROWS` to push data after existing content
4. Returns the updated range, row count, and cell count

**Tip:** Use `USER_ENTERED` (default) to let Sheets parse dates, numbers, and formulas. Use `RAW` to store values exactly as provided.

## Adapting These Flows

- **Data logger**: Pipe output from any flow (email summaries, CRM contacts, calendar events) into a tracking spreadsheet.
- **CSV import**: Parse CSV data into a 2D array and append it in batches.
- **Read + write**: Use the get-values action to read existing data, process it, and write results back.
