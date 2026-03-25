# One Awesome

Open-source tools and templates built on the [One](https://withone.ai) platform.

## Projects

### [One Link](./ui/link)

A drop-in connection onboarding page for agencies. Your customers visit the page, connect their integrations (Gmail, Slack, Google Calendar, etc.), and you're ready to go.

**Two ways to use it:**

1. **Clone and deploy** — Clone this repo, set your env vars, deploy anywhere
2. **AI-generate it** — Copy [`PROMPT.md`](./ui/link/PROMPT.md) into Lovable, Bolt, v0, or Cursor and it builds the full app for you

---

### Quick Start

```bash
cd ui/link
cp .env.example .env
```

Edit `.env` with your values:

```env
ONE_SECRET_KEY=sk_live_your_key_here
PLATFORMS=gmail,google-calendar,slack
COMPANY_NAME=Your Agency
COMPANY_LOGO_DARK=/logo/logo-full-dark.svg
COMPANY_LOGO_LIGHT=/logo/logo-full-light.svg
WELCOME_MESSAGE=To setup your agent, please connect the following apps
SUCCESS_MESSAGE=All apps connected! Your agent is ready to go.
```

Get your secret key from the [One Dashboard](https://app.withone.ai) → Settings → API Keys. The key is scoped to a project — create one project per customer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Your customers see a branded card with their required integrations. They click to connect, authenticate via OAuth, and you're done.

### How It Works

```
Your Customer                    One Link                         One API
    │                               │                                │
    │  visits page                  │                                │
    │──────────────────────────────>│                                │
    │                               │  GET /api/config               │
    │                               │  GET /api/platforms ──────────>│ fetch connector details
    │                               │  GET /api/connections ────────>│ check what's connected
    │                               │<──────────────────────────────│
    │  sees branded card            │                                │
    │<──────────────────────────────│                                │
    │                               │                                │
    │  clicks "Connect Gmail"       │                                │
    │──────────────────────────────>│                                │
    │                               │  opens @withone/auth iframe    │
    │                               │  POST /api/one-auth ──────────>│ generate auth token
    │                               │<──────────────────────────────│
    │  authenticates via OAuth      │                                │
    │──────────────────────────────>│                                │
    │                               │  connection saved              │
    │  sees "Connected ●"           │                                │
    │<──────────────────────────────│                                │
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ONE_SECRET_KEY` | Yes | Project secret key from the One Dashboard |
| `PLATFORMS` | Yes | Comma-separated platform keys (e.g. `gmail,slack,notion`) |
| `COMPANY_NAME` | Yes | Displayed in the card header |
| `COMPANY_LOGO_DARK` | No | Logo URL for dark mode (falls back to One logo) |
| `COMPANY_LOGO_LIGHT` | No | Logo URL for light mode (falls back to One logo) |
| `WELCOME_MESSAGE` | No | Subtitle text below the company name |
| `SUCCESS_MESSAGE` | No | Shown when all integrations are connected |
| `IDENTITY` | No | Unique identifier to scope connections to a specific user |
| `IDENTITY_TYPE` | No | Type of identity: `email`, `user`, `team`, `organization`, `project` |
| `CORS_ORIGIN` | No | Allowed origin for CORS (defaults to `*`) |

### Production Deployment

Build and run with the included Hono server:

```bash
npm run build
npm start
```

Or deploy to any platform that supports Node.js (Vercel, Railway, Render, Fly.io, etc.).

### Tech Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend (dev):** Vite dev server with API middleware
- **Backend (prod):** Hono server with static file serving
- **Auth:** [@withone/auth](https://github.com/withoneai/auth) iframe widget
- **Design:** One Design System (warm ivory/charcoal, glassmorphic cards)

---

## License

MIT
