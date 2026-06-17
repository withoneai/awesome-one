---
name: netlify
description: |
  Netlify deployment and site management flows for the One CLI. Deploy sites,
  list sites, and manage deploy previews.
triggers:
  - "deploy netlify"
  - "netlify deploy"
  - "netlify sites"
  - "list sites"
  - "/netlify"
---

# Netlify Flows

Ready-to-run site deployment and management via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add netlify                    # Connect your Netlify account
one --agent list                   # Find your connection key
```

## Discovery

Deploying requires a `siteId`. Find it using the list sites flow:

```bash
# List all sites (returns site IDs, names, and URLs)
one flow execute netlify-list-sites.flow.json \
  --input netlifyConnectionKey="<your-key>"
```

## Flows

### Deploy Site

Triggers a new deploy for a Netlify site. Supports production deploys, branch
targeting, and deploy titles.

```bash
one flow execute netlify-deploy-site.flow.json \
  --input netlifyConnectionKey="<your-key>" \
  --input siteId="12345678-90ab-cdef-1234-567890abcdef" \
  --input production=true \
  --input branch="main"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `netlifyConnectionKey` | Yes | Your Netlify connection key |
| `siteId` | Yes | Netlify site ID to deploy |
| `production` | No | Set `true` for production deploy |
| `branch` | No | Branch to deploy from |
| `title` | No | Title for this deploy |

### List Sites

Lists all sites in your Netlify account with IDs, names, URLs, and status.

```bash
one flow execute netlify-list-sites.flow.json \
  --input netlifyConnectionKey="<your-key>"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `netlifyConnectionKey` | Yes | Your Netlify connection key |

## Adapting These Flows

- **Deploy preview**: Set `production=false` and specify a feature branch
- **Auto-deploy pipeline**: Chain with a GitHub action or webhook trigger
- **Deploy + notify**: Follow up with a Slack flow to announce the deploy
