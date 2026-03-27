# Web scraping to Sheets: scrape URLs, AI structures data, save to Sheets

Scrapes one or more URLs using Firecrawl, uses Claude AI to extract and structure the data into a clean tabular format, and saves the results to a new Google Sheets spreadsheet.

> **Works with any AI agent.** Paste this page's URL into Claude Code, Codex, Cursor, Windsurf, OpenClaw, or any coding agent — it will read the docs, connect your platforms, and run this flow for you.

## Quick Start

```bash
# 1. Connect your platforms (one-time setup)
one add firecrawl
one add google-sheets
one add slack

# 2. Run the flow
one flow execute n8n-2552-web-scraping-jina-sheets \
  --input slackChannel="C01ABC123" \
  --input urls="https://example.com" \
  --input dataDescription="..." \
  --input sheetTitle="..."
```

## Platforms

| Platform | Used for |
|----------|----------|
| Firecrawl | Web scraping |
| Google Sheets | Saving data |
| Slack | Status notification |

> Don't have these connected yet? Run `one list` to check, then `one add <platform>` to connect.

## What it does

1. Parse and validate input URLs
2. Scrape all URLs with Firecrawl
3. Compile all scraped content
4. Build Claude prompt for structured data extraction
5. Run Claude AI for data extraction
6. Format data for Google Sheets
7. Save extracted data to Google Sheets
8. Build Slack completion notification
9. Post completion notification to Slack

## Flow diagram

```mermaid
flowchart TD
    parseUrls["Parse and validate input URLs"]
    scrapeUrls(("Scrape all URLs with Firecrawl"))
    compileScraped["Compile all scraped content"]
    buildPrompt["Build Claude prompt for structured data extraction"]
    aiExtract[["AI: Run Claude AI for data extraction"]]
    buildSheetData["Format data for Google Sheets"]
    saveToSheets(["Google Sheets: Save extracted data to Google Sheets"])
    buildSlackBlocks["Build Slack completion notification"]
    postToSlack(["Slack: Post completion notification to Slack"])
    parseUrls --> scrapeUrls
    scrapeUrls --> compileScraped
    compileScraped --> buildPrompt
    buildPrompt --> aiExtract
    aiExtract --> buildSheetData
    buildSheetData --> saveToSheets
    saveToSheets --> buildSlackBlocks
    buildSlackBlocks --> postToSlack

    style aiExtract fill:#fce4ec,stroke:#c62828
    style saveToSheets fill:#e1f5fe,stroke:#0288d1
    style postToSlack fill:#e1f5fe,stroke:#0288d1
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `slackChannel` | Yes | Slack channel for completion notification |
| `urls` | Yes | Comma-separated URLs to scrape (e.g. 'https://example.com/products, https://example.com/pricing') |
| `dataDescription` | No | What data to extract (e.g. 'product names and prices', 'company names and contact info', 'article titles and dates') (default: all structured data items) |
| `sheetTitle` | No | Title for the Google Sheets spreadsheet (default: Scraped Data) |

---

<sub>Based on [n8n #2552](https://n8n.io/workflows/2552) · 51.3K views on n8n · by [derekcheungsa](https://n8n.io/creators/derekcheungsa) · Converted to One CLI on 2026-03-25</sub>
