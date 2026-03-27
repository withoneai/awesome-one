---
name: scrape-do
description: |
  Scrape.do async web scraping flow for the One CLI. Create scraping jobs with
  geo-targeting, device emulation, and markdown output for LLM workflows.
triggers:
  - "scrape website"
  - "web scraping"
  - "scrape-do"
  - "/scrape-do"
---

# Scrape.do Flows

Ready-to-run async web scraping via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add scrape-do                  # Connect your Scrape.do account
one --agent list                   # Find your connection key
```

## Flows

### Create Async Scraping Job

Creates an asynchronous scraping job for one or more URLs. Returns a job ID and
task IDs for tracking. Supports geo-targeting, device emulation, residential
proxies, and markdown output (ideal for LLM pipelines).

```bash
one flow execute scrape-do-async-job.flow.json \
  --input scrapeDoConnectionKey="<your-key>" \
  --input targets='["https://example.com", "https://news.ycombinator.com"]' \
  --input output="markdown" \
  --input geoCode="US"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `scrapeDoConnectionKey` | Yes | Your Scrape.do connection key |
| `targets` | Yes | Array of URLs to scrape |
| `geoCode` | No | Country code for geo-targeting (e.g., US, GB, DE) |
| `device` | No | Device emulation: desktop, mobile, tablet |
| `output` | No | Output format: raw (default) or markdown |
| `super` | No | Set `true` for residential proxies |

**What it does under the hood:**

1. Builds scraping job configuration with targets and optional settings
2. Creates async job via Scrape.do API (`POST /api/v1/jobs`)
3. Returns job ID and task IDs for tracking progress via the job details endpoint
