# Pre-Call Research Brief Generator

Fetches today's meetings from Gmail/Calendar, searches Exa for recent company news about meeting attendees, Claude AI creates a comprehensive pre-call research brief, and posts it to Slack with Block Kit formatting.

> **Works with any AI agent.** Paste this page's URL into Claude Code, Codex, Cursor, Windsurf, OpenClaw, or any coding agent — it will read the docs, connect your platforms, and run this flow for you.

## Quick Start

```bash
# 1. Connect your platforms (one-time setup)
one add google-calendar
one add exa
one add slack

# 2. Run the flow
one flow execute n8n-2110-pre-call-research \
  --input slackChannel="C01ABC123" \
  --input companyOverride="..."
```

## Platforms

| Platform | Used for |
|----------|----------|
| Google Calendar | Fetching meetings |
| Exa | Company research |
| Slack | Posting the brief |

> Don't have these connected yet? Run `one list` to check, then `one add <platform>` to connect.

## What it does

1. Calculate today's date range
2. Fetch today's calendar events
3. Extract companies and attendees from meetings
4. Search Exa for company news
5. Compile meeting and research data
6. Build Claude prompt for pre-call brief
7. Run Claude AI pre-call research
8. Post research brief to Slack

## Flow diagram

```mermaid
flowchart TD
    getDateBounds["Calculate today's date range"]
    listEvents(["Google Calendar: Fetch today's calendar events"])
    extractCompanies["Extract companies and attendees from meetings"]
    searchCompanyNews(["Exa: Search Exa for company news"])
    compileResearch["Compile meeting and research data"]
    buildPrompt["Build Claude prompt for pre-call brief"]
    aiAnalysis[["AI: Run Claude AI pre-call research"]]
    postToSlack(["Slack: Post research brief to Slack"])
    getDateBounds --> listEvents
    listEvents --> extractCompanies
    extractCompanies --> searchCompanyNews
    searchCompanyNews --> compileResearch
    compileResearch --> buildPrompt
    buildPrompt --> aiAnalysis
    aiAnalysis --> postToSlack

    style listEvents fill:#e1f5fe,stroke:#0288d1
    style searchCompanyNews fill:#e1f5fe,stroke:#0288d1
    style aiAnalysis fill:#fce4ec,stroke:#c62828
    style postToSlack fill:#e1f5fe,stroke:#0288d1
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `slackChannel` | Yes | Slack channel to post the research brief |
| `companyOverride` | No | Optional: specific company to research (overrides calendar extraction) (default: ) |

---

<sub>Based on [n8n #2110](https://n8n.io/workflows/2110) · 67.1K views on n8n · by [n8n_milorad](https://n8n.io/creators/n8n_milorad) · Converted to One CLI on 2026-03-25</sub>
