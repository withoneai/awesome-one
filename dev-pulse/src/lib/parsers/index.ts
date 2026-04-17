// Platform-specific webhook payload parsers.
// Each parser transforms a raw webhook payload into a display-friendly event.
// Parsers return null for unverified event types → generic fallback handles them.
// To add a new platform: create a new file, export a parser, register it here.

import type { PulseEvent } from "@/lib/event-store";
import { parseGitHubEvent } from "./github";
import { parseLinearEvent } from "./linear";
import { parseCalendarEvent } from "./calendar";

export type ParsedEvent = Omit<PulseEvent, "id" | "timestamp">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventParser = (eventType: string, payload: Record<string, any>) => ParsedEvent | null;

const parsers: Record<string, EventParser> = {
  github: parseGitHubEvent,
  linear: parseLinearEvent,
  "google-calendar": parseCalendarEvent,
};

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseWebhookEvent(
  platform: string,
  eventType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): ParsedEvent {
  const parser = parsers[platform];
  if (parser) {
    try {
      const result = parser(eventType, payload);
      if (result) return result;
    } catch {
      // Parser threw — fall through to generic fallback
    }
  }

  // Generic fallback — title case, works for any platform
  const action = payload?.action as string;
  return {
    platform,
    eventType,
    title: `${toTitleCase(platform)} ${toTitleCase(eventType)}`,
    description: action ? toTitleCase(action) : "",
  };
}
