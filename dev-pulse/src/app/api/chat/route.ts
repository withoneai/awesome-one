import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { addEvent } from "@/lib/event-store";
import { getOneMCPTools } from "@/lib/one-mcp";
import crypto from "crypto";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get tools from One's MCP server (proper MCP protocol)
  const tools = await getOneMCPTools();

  // Track action titles from knowledge steps — keyed by actionId
  const titleByActionId: Record<string, string> = {};

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
    onStepFinish: ({ toolResults }) => {
      if (!toolResults) return;

      for (const tr of toolResults) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trAny = tr as any;

        // Collect action titles from knowledge steps
        if (tr.toolName === "get_one_action_knowledge") {
          const output = trAny.output ?? trAny.result;
          if (output) {
            try {
              let parsed = output;
              if (typeof parsed === "string") parsed = JSON.parse(parsed);
              const text = parsed?.content?.[0]?.text || (typeof parsed === "string" ? parsed : "");
              const match = text.match(/^#\s*(?:Action:\s*)?\n*(.+)/m);
              const title = match?.[1]?.trim();
              const actionId = trAny.input?.actionId as string;
              if (title && actionId) {
                titleByActionId[actionId] = title;
              }
            } catch { /* ignore */ }
          }
          continue;
        }

        // Only process execute actions
        if (tr.toolName !== "execute_one_action") continue;

        const rawResult = trAny.output ?? trAny.result ?? trAny.content;
        if (!rawResult) continue;

        try {
          // Unwrap MCP envelope: { content: [{ text: "JSON_STRING" }] }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parsed: any = rawResult;
          if (typeof parsed === "string") {
            try { parsed = JSON.parse(parsed); } catch { /* keep */ }
          }
          if (parsed?.content && Array.isArray(parsed.content)) {
            const text = parsed.content[0]?.text;
            if (text) {
              try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
            }
          }

          // Skip MCP errors
          if (parsed?.raw?.startsWith?.("MCP error")) continue;

          // Get platform and action title from the tool input (not from response parsing)
          const platform = (trAny.input?.platform as string) || "unknown";
          const actionId = trAny.input?.actionId as string;
          const title = actionId ? titleByActionId[actionId] : null;

          if (title) {
            addEvent({
              id: crypto.randomUUID(),
              platform,
              eventType: "action.executed",
              title,
              description: "",
              timestamp: new Date().toISOString(),
            });
          }
        } catch { /* ignore parsing errors */ }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
