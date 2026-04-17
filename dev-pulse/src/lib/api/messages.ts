import type { MessageRow } from "@/types/messages";

export async function getMessages(): Promise<MessageRow[]> {
  const res = await fetch("/api/messages");
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

export async function saveMessage(msg: MessageRow): Promise<void> {
  await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
}

export async function clearMessages(): Promise<void> {
  await fetch("/api/messages", { method: "DELETE" });
}
