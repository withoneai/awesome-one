import type { ParsedEvent } from "./index";

// Google Calendar webhooks are lightweight push notifications.
// They say "something changed" without event details.
// The actual event data is fetched separately via fetchCalendarChanges().
// Returns null for unverified events → generic fallback handles them.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCalendarEvent(_eventType: string, _payload: Record<string, any>): ParsedEvent | null {
  // Calendar webhook payloads are empty — all real event details
  // come from the fetchCalendarChanges() follow-up call.
  // Let the generic fallback handle the raw webhook notification.
  return null;
}
