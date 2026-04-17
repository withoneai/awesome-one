import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getOneMCPTools } from "@/lib/one-mcp";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const tools = await getOneMCPTools();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are Dev Pulse, an engineering command center.

## Current date and time: ${new Date().toISOString()}

## Rules:
1. Use the MCP tools to search for actions, read API docs, and execute actions.
2. Be autonomous — look up IDs, viewer info, and any required fields yourself.
3. Do not narrate what you are doing. Call tools silently.
4. When all actions are complete, respond with the final outcome in markdown (1-2 sentences).
5. When creating issues in project management tools, look up and assign to the current viewer, and add to the active cycle if one exists.
6. Never produce intermediate text between tool calls.`,
    messages,
    tools,
    stopWhen: stepCountIs(100),
  });

  return result.toUIMessageStreamResponse();
}
