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
        if (tr.toolName !== "execute_one_action") continue;

        // AI SDK v6 stores tool output under 'output', not 'result'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trAny = tr as any;
        const rawResult = trAny.output ?? trAny.result ?? trAny.content;
        if (!rawResult) continue;

        try {
          // Unwrap MCP envelope: { content: [{ text: "JSON_STRING" }] }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parsed: any = rawResult;
          if (typeof parsed === "string") {
            try { parsed = JSON.parse(parsed); } catch { /* keep as string */ }
          }
          if (parsed?.content && Array.isArray(parsed.content)) {
            const text = parsed.content[0]?.text;
            if (text) {
              try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
            }
          }

          // Skip MCP errors
          if (parsed?.raw?.startsWith?.("MCP error")) continue;

          const responseData = parsed?.responseData?.data || parsed?.responseData || parsed;
          const requestConfig = parsed?.requestConfig;

          // Detect platform from request path
          const path: string = requestConfig?.path || requestConfig?.url || "";
          let platform = "unknown";
          if (path.includes("slack") || path.includes("chat.post")) platform = "slack";
          else if (path.includes("linear") || path.includes("graphql")) platform = "linear";
          else if (path.includes("github")) platform = "github";
          else if (path.includes("calendar")) platform = "google-calendar";
          else if (path.includes("adyen") || path.includes("/v3/") || path.includes("/v71/")) platform = "adyen";

          // Build a generic title from the response
          let title = "";
          let description = "";

          // Try common response patterns
          if (responseData?.issueCreate?.success) {
            const issue = responseData.issueCreate.issue;
            title = `Created ${issue.identifier}: ${issue.title}`;
            platform = "linear";
          } else if (responseData?.ok === true && responseData?.channel) {
            title = "Message sent to Slack";
            description = `Channel: ${responseData.channel}`;
            platform = "slack";
          } else if (responseData?.kind === "calendar#event") {
            title = `Scheduled: ${responseData.summary}`;
            platform = "google-calendar";
          } else if (responseData?.number && responseData?.html_url) {
            title = `Opened #${responseData.number}: ${responseData.title}`;
            platform = "github";
          } else if (responseData?.id && responseData?.merchantId) {
            title = `Created store: ${responseData.description || responseData.id}`;
            platform = "adyen";
          } else if (responseData?.url?.includes?.("adyen.link")) {
            title = "Created payment link";
            description = responseData.url;
            platform = "adyen";
          }

          // Only add to feed if we could identify something meaningful
          if (title) {
            addEvent({
              id: crypto.randomUUID(),
              platform,
              eventType: "action.executed",
              title,
              description,
              timestamp: new Date().toISOString(),
            });
          }
        } catch { /* ignore parsing errors */ }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
