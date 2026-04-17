import type { ParsedEvent } from "./index";

// Covers all 3 Google Calendar webhook event types:
// sync, exists, not_exists
//
// Note: Google Calendar webhooks are lightweight push notifications.
// They just say "something changed" without event details.
// The actual calendar event data is fetched separately via
// fetchCalendarChanges() in the webhooks route.
// These parsers handle the raw webhook notification display.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCalendarEvent(eventType: string, payload: Record<string, any>): ParsedEvent {
  switch (eventType) {
    case "sync":
      return {
        platform: "google-calendar",
        eventType,
        title: "Calendar sync started",
        description: "Initial sync notification",
      };

    case "exists":
      return {
        platform: "google-calendar",
        eventType,
        title: payload.summary || "Calendar event updated",
        description: payload.startTime
          ? formatCalTime(payload.startTime)
          : "Event changed",
      };

    case "not_exists":
      return {
        platform: "google-calendar",
        eventType,
        title: "Calendar event removed",
        description: payload.summary || "",
      };

    default:
      return {
        platform: "google-calendar",
        eventType,
        title: `Calendar ${eventType}`,
        description: "",
      };
  }
}

function formatCalTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}
