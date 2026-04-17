// Platform-specific webhook payload parsers.
// Each parser transforms a raw webhook payload into a display-friendly event.
// To add a new platform: create a new file, export a parser, register it here.

import type { PulseEvent } from "@/lib/event-store";
import { parseGitHubEvent } from "./github";
import { parseLinearEvent } from "./linear";

export type ParsedEvent = Omit<PulseEvent, "id" | "timestamp">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventParser = (eventType: string, payload: Record<string, any>) => ParsedEvent;

const parsers: Record<string, EventParser> = {
  github: parseGitHubEvent,
  linear: parseLinearEvent,
};

export function parseWebhookEvent(
  platform: string,
  eventType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): ParsedEvent {
  const parser = parsers[platform];
  if (parser) return parser(eventType, payload);

  // Generic fallback for unregistered platforms
  const action = payload.action as string;
  return {
    platform,
    eventType,
    title: `${platform} ${eventType}`,
    description: action || eventType,
  };
}
