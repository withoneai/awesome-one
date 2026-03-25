import type { PlatformInfo, LinkConfig } from "../types";

interface ConfigResponse {
  platforms: string[];
  companyName: string;
  companyLogoDark: string;
  companyLogoLight: string;
  welcomeMessage: string;
  successMessage: string;
}

interface PlatformsResponse {
  platforms: PlatformInfo[];
}

interface ConnectionRow {
  id: string;
  platform: string;
}

interface ConnectionsResponse {
  rows: ConnectionRow[];
}

export async function fetchConfig(): Promise<LinkConfig> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to load config");
  const data: ConfigResponse = await res.json();
  return data;
}

export async function fetchPlatforms(): Promise<PlatformInfo[]> {
  const res = await fetch("/api/platforms");
  if (!res.ok) throw new Error("Failed to load platforms");
  const data: PlatformsResponse = await res.json();
  return data.platforms || [];
}

export async function fetchConnections(): Promise<Map<string, string>> {
  const res = await fetch("/api/connections");
  if (!res.ok) return new Map();
  const data: ConnectionsResponse = await res.json();
  const map = new Map<string, string>();
  for (const c of data.rows || []) {
    map.set(c.platform, c.id);
  }
  return map;
}

export async function deleteConnection(connectionId: string): Promise<void> {
  const res = await fetch(`/api/connections/${connectionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete connection");
}
