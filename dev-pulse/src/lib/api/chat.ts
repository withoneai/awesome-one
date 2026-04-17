export interface ChatStreamInput {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export function streamChat(input: ChatStreamInput): Promise<Response> {
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
