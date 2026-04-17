import type { ParsedEvent } from "./index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLinearEvent(eventType: string, payload: Record<string, any>): ParsedEvent {
  const data = payload.data;
  const title = data?.title || eventType;
  const state = data?.state?.name as string;
  const identifier = data?.identifier as string;

  return {
    platform: "linear",
    eventType,
    title: state ? `${title} → ${state}` : title,
    description: identifier || eventType,
  };
}
