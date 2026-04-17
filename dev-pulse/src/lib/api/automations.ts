import type { Automation, CreateAutomationInput, ParsedAutomation } from "@/types/automations";

export async function getAutomations(): Promise<Automation[]> {
  const res = await fetch("/api/automations");
  if (!res.ok) throw new Error("Failed to load automations");
  return res.json();
}

export async function createAutomation(input: CreateAutomationInput): Promise<void> {
  await fetch("/api/automations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function parseAutomation(description: string): Promise<ParsedAutomation> {
  const res = await fetch("/api/automations/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  return res.json();
}

export async function toggleAutomation(id: number, enabled: boolean): Promise<void> {
  await fetch("/api/automations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, enabled }),
  });
}

export async function deleteAutomation(id: number): Promise<void> {
  await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
}
