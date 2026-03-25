# One Link — AI Coding Tool Prompt

Copy the entire prompt below and paste it into **Lovable**, **Bolt**, **v0**, **Cursor**, or any AI coding tool to generate a complete connection onboarding page for your customers.

Before pasting, replace the placeholder values marked with `<YOUR_...>` with your actual configuration from the [One Dashboard](https://app.withone.ai).

---

## Prompt

```
Build a single-page web application that lets end users connect their third-party integrations (Gmail, Slack, Google Calendar, etc.) through a beautiful onboarding card. The app uses the One platform (withone.ai) for authentication and connection management.

## Configuration

The app reads these values from environment variables. The user must set them:

ONE_SECRET_KEY=<YOUR_ONE_SECRET_KEY>
PLATFORMS=<YOUR_COMMA_SEPARATED_PLATFORMS e.g. gmail,google-calendar,slack>
COMPANY_NAME=<YOUR_COMPANY_NAME>
COMPANY_LOGO_DARK=<YOUR_LOGO_URL_FOR_DARK_BACKGROUNDS>
COMPANY_LOGO_LIGHT=<YOUR_LOGO_URL_FOR_LIGHT_BACKGROUNDS>
WELCOME_MESSAGE=<YOUR_WELCOME_MESSAGE e.g. "To setup your agent, please connect the following apps">
SUCCESS_MESSAGE=<YOUR_SUCCESS_MESSAGE e.g. "All apps connected! Your agent is ready to go.">

Optional:
IDENTITY=<UNIQUE_USER_OR_PROJECT_IDENTIFIER>
IDENTITY_TYPE=<user|team|organization|project>

## Tech Stack

- React (with Vite or Next.js)
- Tailwind CSS
- @withone/auth package (npm i @withone/auth)
- A backend server (Node.js/Express/Hono/Next.js API routes)

## Backend Endpoints

The app needs 4 backend API endpoints. All endpoints use the ONE_SECRET_KEY from the environment variable to authenticate with the One API.

### 1. GET /api/config

Returns the configuration to the frontend. Reads from environment variables.

Response:
{
  "platforms": ["gmail", "google-calendar", "slack"],
  "companyName": "Your Agency",
  "companyLogoDark": "/logo/logo-full-dark.svg",
  "companyLogoLight": "/logo/logo-full-light.svg",
  "welcomeMessage": "To setup your agent, please connect the following apps",
  "successMessage": "All apps connected! Your agent is ready to go."
}

### 2. GET /api/platforms

Fetches platform details (name, image, description) from the One API. The API paginates at 100 per page, so you must paginate through all pages.

Logic:
1. Read PLATFORMS from env (comma-separated list like "gmail,google-calendar,slack")
2. Fetch ALL available connectors from https://api.withone.ai/v1/available-connectors?limit=100&page={page}
   - Header: x-one-secret: <ONE_SECRET_KEY>
   - Paginate: keep fetching until page > response.pages
3. For each requested platform, find the matching connector by platform key or name
4. Return: { platforms: [{ platform, name, image, description }] }

### 3. GET /api/connections

Checks which platforms the user has already connected.

Logic:
1. Fetch from https://api.withone.ai/v1/connections
   - Header: x-one-secret: <ONE_SECRET_KEY>
2. Return the response as-is. It contains: { rows: [{ id: "uuid", platform: "gmail", ... }] }
3. The frontend needs both the `platform` name (to show connected state) and the `id` (to delete on reconnect)

### 4. DELETE /api/connections/:id

Deletes a connection. Used for the reconnect flow — after a user successfully re-authenticates, the old connection is deleted.

Logic:
1. Extract the connection ID from the URL path
2. DELETE to https://api.withone.ai/v1/vault/connections/{id}
   - Header: x-one-secret: <ONE_SECRET_KEY>
3. Return { deleted: true } on success

### 5. POST /api/one-auth

Token endpoint called by the @withone/auth iframe widget. This is the most critical endpoint.

IMPORTANT: This endpoint is called by the auth widget running inside an iframe at auth.withone.ai. It MUST return proper CORS headers:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type

You must also handle OPTIONS preflight requests.

Logic:
1. Read page and limit from query parameters (sent automatically by the widget)
2. Build the request body:
   - If IDENTITY env var is set, include: { identity: IDENTITY, identityType: IDENTITY_TYPE }
   - Otherwise send an empty body: {}
3. POST to https://api.withone.ai/v1/authkit/token?page={page}&limit={limit}
   - Headers: Content-Type: application/json, X-One-Secret: <ONE_SECRET_KEY>
   - Body: the body from step 2
4. Return the response to the client

## Frontend — @withone/auth Integration

Install the package: npm i @withone/auth

Usage in a React component:

import { useOneAuth } from "@withone/auth";

const { open } = useOneAuth({
  token: {
    url: `${window.location.origin}/api/one-auth`,  // Full URL to your token endpoint
  },
  selectedConnection: platformName,  // e.g. "Gmail" (display name, not key)
  appTheme: isDark ? "dark" : "light",
  onSuccess: (connection) => {
    // Refresh the connection list to show the new connection
  },
  onError: (error) => {
    console.error("Connection failed:", error);
  },
  onClose: () => {
    // User closed the auth modal
  },
});

// Call open() to show the auth modal
// IMPORTANT: selectedConnection must be set BEFORE calling open()
// Use a useEffect to call open() after the state updates

When the user clicks a platform to connect, set the selectedConnection to the platform's display name (e.g. "Gmail", "Slack", "Google Calendar"), then call open() AFTER the component re-renders with the new selectedConnection value.

## Frontend — UI Design

Build a centered card with this structure:

1. HEADER SECTION:
   - Company logo (use COMPANY_LOGO_DARK in dark mode, COMPANY_LOGO_LIGHT in light mode)
   - Title: "Welcome to {COMPANY_NAME}"
   - Subtitle: {WELCOME_MESSAGE}

2. SEARCH BAR (show only if more than 3 platforms):
   - Filter platforms by name as user types

3. PLATFORM LIST (scrollable if many platforms, max height ~280px):
   - Each row shows: platform icon (from API), platform name, and a right arrow chevron
   - On hover: subtle background highlight
   - If already connected: show "Connected" text with a green pulsating dot, a three-dot menu icon, and no arrow
   - The three-dot menu has two options: "Reconnect" and "Remove" (shown in red).
   - Reconnect: open the auth modal for that platform. On successful re-auth, delete the OLD connection (DELETE /api/connections/:id) then refresh the connections list. The user never sees a disconnected state.
   - Remove: delete the connection (DELETE /api/connections/:id) and refresh the list. The platform immediately shows as unconnected.
   - On click (if not connected): open the auth modal for that platform

4. SUCCESS BANNER (shown when ALL platforms are connected):
   - Green pulsating dot + {SUCCESS_MESSAGE}

5. FOOTER:
   - "Secured & powered by" + One logo
   - "withone.ai" link

## Design System

Use a warm color palette:

Light mode:
- Background: hsl(60 23% 97.5%)  (warm ivory)
- Card: semi-transparent white with backdrop blur (glassmorphic)
- Text: hsl(0 0% 9.8%)
- Muted text: hsl(60 1.5% 39%)
- Border: hsl(60 8.5% 88.4%)

Dark mode:
- Background: hsl(0 0% 9.8%)  (warm charcoal)
- Card: semi-transparent dark with backdrop blur (glassmorphic)
- Text: hsl(60 23% 97.5%)
- Muted text: hsl(60 1.4% 56.7%)
- Border: hsl(60 1.6% 24.7%)

Card styling:
- Rounded corners (24px)
- Glassmorphic: semi-transparent background + backdrop-filter: blur(24px) in light, blur(40px) saturate(1.5) in dark
- Separate footer section with slightly different background
- Width: 480px, max-width: calc(100% - 16px)

Theme detection:
- Auto-detect system preference using window.matchMedia("(prefers-color-scheme: dark)")
- Toggle .dark class on <html> element
- All colors switch via CSS variables

Font: DM Sans (import from Google Fonts), 13px base size

Connected indicator: green color hsl(160 59% 52%) with a pulsating glow animation

## Key Technical Details

1. The @withone/auth package creates a full-screen iframe overlay when open() is called. The iframe loads from auth.withone.ai. Your token endpoint (/api/one-auth) is called FROM this iframe, which is why CORS headers are mandatory.

2. After a successful connection, call your /api/connections endpoint again to refresh the connected state.

3. The platform images come from the One API (GET /api/platforms). They are SVG URLs hosted at assets.withone.ai.

4. The selectedConnection prop in useOneAuth takes the platform's DISPLAY NAME (e.g. "Gmail", not "gmail"). This is the name field from the /api/platforms response.

5. For the token endpoint, the identity and identityType fields are optional. If not provided, connections are scoped to the project's secret key. If provided, they scope connections to a specific user/entity.
```