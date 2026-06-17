---
name: vercel
description: |
  Vercel deployment and project management flows for the One CLI. List projects,
  create deployments, and view environment variables.
triggers:
  - "deploy vercel"
  - "vercel deploy"
  - "vercel projects"
  - "vercel env"
  - "/vercel"
---

# Vercel Flows

Ready-to-run deployment and project management via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add vercel                     # Connect your Vercel account
one --agent list                   # Find your connection key
```

## Discovery

Some flows require a `projectId` or `teamId`. Find them using the list projects flow:

```bash
# List all projects (returns project IDs and names)
one flow execute vercel-list-projects.flow.json \
  --input vercelConnectionKey="<your-key>"

# To find your team ID
one --agent actions search vercel "list teams"
one --agent actions execute vercel <list-teams-action-id> <your-connection-key>
```

## Flows

### List Projects

Lists all projects in your Vercel account or team. Supports filtering by name.

```bash
one flow execute vercel-list-projects.flow.json \
  --input vercelConnectionKey="<your-key>" \
  --input search="my-app"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `vercelConnectionKey` | Yes | Your Vercel connection key |
| `search` | No | Search projects by name |
| `teamId` | No | Team ID to list projects for |
| `limit` | No | Max number of projects to return |

### Create Deployment

Creates a new deployment on Vercel. Supports static file deploys, redeployments,
and team context.

```bash
one flow execute vercel-create-deployment.flow.json \
  --input vercelConnectionKey="<your-key>" \
  --input projectName="my-app" \
  --input target="production"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `vercelConnectionKey` | Yes | Your Vercel connection key |
| `projectName` | Yes | Project name for the deployment URL |
| `target` | No | Target: production, staging, or preview (default) |
| `teamId` | No | Team ID to deploy on behalf of |
| `deploymentId` | No | Previous deployment ID to redeploy |
| `files` | No | Array of file objects for static deploys |
| `framework` | No | Framework: nextjs, gatsby, nuxtjs, etc. |
| `buildCommand` | No | Custom build command |

### View Environment Variables

Retrieves environment variables for a project. Values are masked for security.

```bash
one flow execute vercel-manage-env-vars.flow.json \
  --input vercelConnectionKey="<your-key>" \
  --input projectId="my-app"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `vercelConnectionKey` | Yes | Your Vercel connection key |
| `projectId` | Yes | Project ID or name |
| `teamId` | No | Team ID if project belongs to a team |

## Typical Workflow

1. **List projects** to find the project you want to deploy
2. **Check env vars** to verify configuration is correct
3. **Create deployment** targeting production or preview
4. **Monitor** deployment status (check the returned URL)
