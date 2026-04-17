import type {
  ActiveRelay,
  CreateRelayInput,
  CreateRelayResponse,
  PlatformContext,
  WebhookConfig,
} from "@/types/webhooks";

export async function listRelays(): Promise<ActiveRelay[]> {
  const res = await fetch("/api/webhooks/list");
  if (!res.ok) throw new Error("Failed to list relays");
  return res.json();
}

export async function getEventTypes(platform: string): Promise<string[]> {
  const res = await fetch(`/api/webhooks/event-types?platform=${encodeURIComponent(platform)}`);
  if (!res.ok) throw new Error("Failed to load event types");
  return res.json();
}

export async function getWebhookConfig(platform: string): Promise<WebhookConfig> {
  const res = await fetch(`/api/webhooks/config?platform=${encodeURIComponent(platform)}`);
  if (!res.ok) throw new Error("Failed to load webhook config");
  return res.json();
}

export async function getPlatformContext(
  platform: string,
  connectionKey: string,
): Promise<PlatformContext> {
  const res = await fetch(
    `/api/webhooks/platform-context?platform=${encodeURIComponent(platform)}&connectionKey=${encodeURIComponent(connectionKey)}`,
  );
  if (!res.ok) throw new Error("Failed to load platform context");
  return res.json();
}

export async function createRelay(input: CreateRelayInput): Promise<CreateRelayResponse> {
  const res = await fetch("/api/setup/relay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}
