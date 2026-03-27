---
name: diffbot
description: |
  Diffbot article extraction flow for the One CLI. Extracts clean article text,
  metadata, tags, and images from any URL using Diffbot's Article API.
triggers:
  - "extract article"
  - "diffbot"
  - "article extraction"
  - "/diffbot"
---

# Diffbot Flows

Ready-to-run article extraction via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add diffbot                    # Connect your Diffbot account
one --agent list                   # Find your connection key
```

## Flows

### Extract Article

Extracts clean article text and structured metadata from any article, blog post,
or news page. Returns title, author, date, full text, tags, categories, images,
and sentiment score.

```bash
one flow execute diffbot-extract-article.flow.json \
  --input diffbotConnectionKey="<your-key>" \
  --input url="https://example.com/article"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `diffbotConnectionKey` | Yes | Your Diffbot connection key |
| `url` | Yes | URL of the article to extract |
| `discussion` | No | Set `false` to disable comment extraction |
| `maxTags` | No | Max tags to return (default: 10) |
| `fields` | No | Optional fields: links, extlinks, meta, querystring, breadcrumb, quotes |

**What it does under the hood:**

1. Builds query parameters with URL and optional extraction settings
2. Calls Diffbot Article API (`GET /v3/article`)
3. Extracts and formats title, author, date, text, tags, categories, images, and sentiment
4. Returns a clean, structured response ready for downstream use
