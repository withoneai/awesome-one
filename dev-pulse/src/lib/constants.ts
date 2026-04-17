export const PLATFORMS = [
  { id: "github", name: "GitHub", slug: "github" },
  { id: "linear", name: "Linear", slug: "linear" },
  { id: "google-calendar", name: "Google Calendar", slug: "google-calendar" },
  { id: "slack", name: "Slack", slug: "slack" },
] as const;

// Platforms that support webhook relay via One
export const WEBHOOK_PLATFORMS = [
  { id: "github", name: "GitHub", slug: "github" },
  { id: "linear", name: "Linear", slug: "linear" },
  { id: "google-calendar", name: "Google Calendar", slug: "google-calendar" },
] as const;

export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const ONE_HOUR_MS = 60 * 60 * 1000;
export const ONE_API_BASE = "https://api.withone.ai/v1";
