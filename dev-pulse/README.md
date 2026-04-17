# Dev Pulse

A real-time engineering command center that connects GitHub, Linear, Slack, and Google Calendar into one dashboard. Webhook events stream live into the activity feed, and a natural-language chat panel executes actions across all platforms autonomously using One's MCP server.

**Built on [One](https://withone.ai)** — auth, webhooks, passthrough API, and MCP handled by the platform. No per-integration glue code.

## Quick Start

```bash
git clone https://github.com/withoneai/awesome.git
cd awesome/dev-pulse
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
ONE_SECRET=sk_live_your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
ONE_IDENTITY=your-app-user
ONE_IDENTITY_TYPE=user
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.dev
```

Get your One secret key from the [One Dashboard](https://app.withone.ai) → Settings → API Keys.

```bash
npm install
npm run dev
```

Open `http://localhost:7001`.

### Webhook Relay (for real-time events)

To receive live webhook events from GitHub, Linear, and Google Calendar, you need a public URL. Start an ngrok tunnel:

```bash
ngrok http 7001
```

Copy the ngrok URL and set it as `NEXT_PUBLIC_APP_URL` in `.env.local`. Then configure webhook relays from the dashboard header (Webhooks button).

## How It Works

```
Your Platforms                    One                              Dev Pulse
    │                               │                                │
    │  GitHub push / PR merge       │                                │
    │──────────────────────────────>│  webhook relay                 │
    │                               │──────────────────────────────>│  activity feed (SSE)
    │  Linear issue update          │                                │
    │──────────────────────────────>│  webhook relay                 │
    │                               │──────────────────────────────>│  activity feed
    │                               │                                │
    │                               │                                │  User types a prompt
    │                               │                                │──────────┐
    │                               │  Claude + One MCP              │          │
    │                               │<──────────────────────────────│  streamText()
    │                               │  search actions                │          │
    │                               │  read knowledge                │          │
    │                               │  execute action                │          │
    │<──────────────────────────────│  passthrough API              │          │
    │  action executed              │──────────────────────────────>│  action card
    │                               │                                │──────────┘
    │                               │                                │
    │                               │                                │  Automations
    │  webhook event fires          │                                │
    │──────────────────────────────>│  relay to Dev Pulse           │
    │                               │──────────────────────────────>│  match trigger
    │                               │                                │  run Claude + MCP
    │<──────────────────────────────│  execute cross-platform action │
```

## Features

- **Real-time Activity Feed** — webhook events from GitHub, Linear, and Google Calendar streamed via SSE
- **AI Command Center** — natural-language chat panel powered by Claude + One's MCP server. Executes actions across 250+ platforms autonomously
- **Automations** — "when X happens on platform A, do Y on platform B" in plain English
- **KPI Dashboard** — PRs merged, issues closed, sprint progress, meeting hours (pulled from platform APIs)
- **Calendar Sidebar** — upcoming events from Google Calendar
- **Connection Management** — connect/disconnect platforms via One Auth

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ONE_SECRET` | Yes | Secret key from the One Dashboard |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL for webhook relay delivery (ngrok for local dev) |
| `ONE_IDENTITY` | No | Scopes connections to a specific user identity |
| `ONE_IDENTITY_TYPE` | No | Identity type: `user`, `team`, `organization`, `project` |
| `WEBHOOK_RELAY_SECRET` | No | HMAC secret for verifying webhook signatures |

## Data Storage

Dev Pulse uses **SQLite** (via `better-sqlite3`) for local persistence. The database file (`dev-pulse.db`) is created automatically on first run. Tables:

- `messages` — chat history (survives page refresh)
- `events` — activity feed history (replayed on SSE connect)
- `automations` — saved automation rules
- `connections` — synced platform connections from One's vault
- `cache` — 24h TTL cache for event type lookups

No external database required. WAL mode enabled for concurrent reads.

## Production Deployment

```bash
npm run build
npm start
```

Deploy to any platform that supports Node.js with persistent filesystem (Railway, Render, Fly.io, VPS). The MCP server runs as a stdio subprocess — requires a long-running Node.js process (not compatible with serverless/edge runtimes like Vercel or AWS Lambda).


## Tech Stack

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4
- **AI:** Vercel AI SDK v6 + Claude Sonnet 4 + One MCP Server
- **Database:** SQLite via better-sqlite3 (WAL mode)
- **Auth:** [@withone/auth](https://github.com/withoneai/auth) iframe widget
- **Icons:** [Phosphor Icons](https://phosphoricons.com/)
- **Design:** One Design System (warm ivory/charcoal palette, glassmorphic cards)
- **Real-time:** Server-Sent Events for live activity feed
