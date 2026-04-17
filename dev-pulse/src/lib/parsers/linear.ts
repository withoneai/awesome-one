import type { ParsedEvent } from "./index";

// Only parse events verified from real webhook payloads.
// Returns null for unverified events → generic fallback handles them.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLinearEvent(eventType: string, payload: Record<string, any>): ParsedEvent | null {
  const data = payload.data;

  switch (eventType) {
    case "Issue": {
      const title = data?.title || "Untitled issue";
      const state = data?.state?.name as string;
      const identifier = data?.identifier as string;
      return {
        platform: "linear",
        eventType,
        title: state ? `${title} → ${state}` : title,
        description: identifier || "",
      };
    }

    default:
      return null;
  }
}
