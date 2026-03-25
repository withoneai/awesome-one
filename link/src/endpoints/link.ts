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

interface ConnectionsResponse {
  rows: { platform: string }[];
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

export async function fetchConnections(): Promise<Set<string>> {
  const res = await fetch("/api/connections");
  if (!res.ok) return new Set();
  const data: ConnectionsResponse = await res.json();
  return new Set((data.rows || []).map((c) => c.platform));
}
