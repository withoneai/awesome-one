import type { Connection } from "@/types/connections";

export async function getConnections(): Promise<Record<string, Connection>> {
  const res = await fetch("/api/connections");
  if (!res.ok) throw new Error("Failed to load connections");
  return res.json();
}

export async function syncConnections(): Promise<Record<string, Connection>> {
  const res = await fetch("/api/connections?sync=true");
  if (!res.ok) throw new Error("Failed to sync connections");
  return res.json();
}

export async function deleteConnection(id: string): Promise<void> {
  await fetch(`/api/connections?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
