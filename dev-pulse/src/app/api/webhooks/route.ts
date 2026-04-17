import { NextRequest, NextResponse } from "next/server";
import { addEvent, type PulseEvent } from "@/lib/event-store";
import { getActiveAutomations, getConnectionByPlatform } from "@/lib/db";
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getOneMCPTools } from "@/lib/one-mcp";
import { passthrough } from "@/lib/one-passthrough";
import { ACTION_IDS } from "@/lib/action-ids";
import { parseWebhookEvent } from "@/lib/parsers";
import crypto from "crypto";
import { createHmac, timingSafeEqual } from "crypto";

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  // Dev mode: no secret configured, accept all webhooks
  if (!secret) return true;
  // Secret configured but request has no signature — reject
  if (!signature) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Calendar webhooks just say "something changed" — fetch recent events and diff
// Track seen events by id:updated to avoid duplicates across webhook bursts
const seenCalendarKeys = new Set<string>();
const CALENDAR_SEEN_MAX = 1000;
const CALENDAR_LOOKBACK_MS = 5 * 60 * 1000;

async function fetchCalendarChanges(): Promise<void> {
  const conn = getConnectionByPlatform("google-calendar");
  if (!conn) {
    console.error("Calendar sync: no google-calendar connection found");
    return;
  }

  try {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);

    const data = await passthrough(
      "calendars/{calendarId}/events",
      conn.key,
      ACTION_IDS.calendar.listEvents,
      {
        pathVariables: { calendarId: "primary" },
        queryParams: {
          timeMin: now.toISOString(),
          timeMax: weekFromNow.toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "20",
          updatedMin: new Date(now.getTime() - CALENDAR_LOOKBACK_MS).toISOString(),
        },
      }
    );

    const items = data?.items || [];

    // Prevent unbounded memory growth — clear the set if it gets too large
    if (seenCalendarKeys.size > CALENDAR_SEEN_MAX) {
      seenCalendarKeys.clear();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of items) {
      const evt = item as any;
      const key = `${evt.id}:${evt.updated || evt.created}`;

      // Skip if we already surfaced this exact version
      if (seenCalendarKeys.has(key)) continue;
      seenCalendarKeys.add(key);

      const summary = evt.summary || "Untitled event";
      const startTime = evt.start?.dateTime || evt.start?.date;

      addEvent({
        id: `cal-${evt.id}-${Date.now()}`,
        platform: "google-calendar",
        eventType: "event.created",
        title: summary,
        description: startTime ? formatCalTime(startTime) : "Calendar event",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error(`Calendar sync failed (connection: ${conn.id}, platform: ${conn.platform}):`, err);
  }
}

function formatCalTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return iso; }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-relay-signature");
  const relaySecret = process.env.WEBHOOK_RELAY_SECRET || "";

  if (relaySecret && !verifySignature(body, signature, relaySecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const platform = (req.headers.get("x-relay-platform") || payload.platform || "unknown") as string;
  const eventType = req.headers.get("x-relay-event-type") || payload.eventType || "unknown";
  const eventId = req.headers.get("x-relay-event-id") || crypto.randomUUID();
  const eventPayload = payload.payload || payload;

  // Calendar webhooks just say "something changed" — fetch actual event details
  if (platform === "google-calendar") {
    fetchCalendarChanges().catch((err) =>
      console.error("Calendar sync error:", err)
    );
    return NextResponse.json({ received: true, eventId, automationsTriggered: 0 });
  }

  const parsed = parseWebhookEvent(platform, eventType, eventPayload);

  const event: PulseEvent = { ...parsed, id: eventId, timestamp: new Date().toISOString(), payload: eventPayload };
  addEvent(event);

  // Check for matching automations
  const automationEventKey = `${eventType}${eventPayload.action ? `.${eventPayload.action}` : ""}`;
  const automations = getActiveAutomations(platform, automationEventKey);

  if (automations.length > 0) {
    runAutomations(automations, eventPayload).catch((err) =>
      console.error("Automation execution failed:", err)
    );
  }

  return NextResponse.json({ received: true, eventId, automationsTriggered: automations.length });
}

async function runAutomations(
  automations: Array<{ action_prompt: string }>,
  eventPayload: Record<string, unknown>
) {
  // Get MCP tools — same tools the Command Center uses
  const tools = await getOneMCPTools();

  for (const automation of automations) {
    try {
      // Build the prompt with event context
      let prompt = automation.action_prompt;

      // GitHub-shaped payload
      const issue = eventPayload.issue as Record<string, unknown> | undefined;
      const pr = eventPayload.pull_request as Record<string, unknown> | undefined;
      const repo = eventPayload.repository as Record<string, unknown> | undefined;

      // Linear-shaped payload — issue data lives under .data
      const linearData = eventPayload.data as Record<string, unknown> | undefined;
      const linearState = linearData?.state as Record<string, unknown> | undefined;
      const linearAssignee = linearData?.assignee as Record<string, unknown> | undefined;

      // Pick whatever the platform actually sent
      const title = issue?.title || pr?.title || linearData?.title || "";
      const number = issue?.number || pr?.number || linearData?.identifier || "";

      prompt = prompt.replace("{{title}}", title as string);
      prompt = prompt.replace("{{number}}", String(number));
      prompt = prompt.replace("{{repo}}", (repo?.full_name || "") as string);
      prompt = prompt.replace("{{author}}", ((eventPayload.sender as Record<string, unknown>)?.login || (linearAssignee?.name as string) || "") as string);

      // Build a rich context that includes everything Claude needs to make decisions.
      // Pass the actual payload data inline so Claude can read state names, descriptions, etc.
      const contextParts: string[] = [];
      if (title) contextParts.push(`Title: "${title}"`);
      if (number) contextParts.push(`Identifier: ${number}`);
      if (repo?.full_name) contextParts.push(`Repo: ${repo.full_name}`);
      if (linearState?.name) contextParts.push(`Linear state: ${linearState.name}`);
      if (linearData?.description) contextParts.push(`Description: ${String(linearData.description).slice(0, 200)}`);
      if (linearData?.url) contextParts.push(`URL: ${linearData.url}`);
      if (linearAssignee?.name) contextParts.push(`Assignee: ${linearAssignee.name}`);

      const context = contextParts.length > 0
        ? contextParts.join("\n")
        : `Raw payload: ${JSON.stringify(eventPayload).slice(0, 500)}`;

      // Use Claude with MCP tools — same as the Command Center
      const result = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: `You are an automation executor. A webhook event just occurred and you need to carry out an action.
Event context: ${context}
Execute the following action using the available tools. Be autonomous — look up any IDs you need.
When creating Linear issues: ALWAYS look up the viewer and the active cycle. Assign the issue to the viewer AND add it to the current active cycle.`,
        messages: [{ role: "user", content: prompt }],
        tools,
        stopWhen: stepCountIs(8),
      });

      // Check if an action was executed and add to the activity feed
      const executedTools = result.steps.flatMap((s) => s.toolResults || []);
      const executeResult = executedTools.find((tr) => tr.toolName === "execute_one_action");

      if (executeResult && "result" in executeResult) {
        const resultData = typeof executeResult.result === "string"
          ? JSON.parse(executeResult.result as string)
          : executeResult.result;
        const responseData = resultData?.responseData?.data || resultData?.responseData;

        let title = "Automation executed";
        let feedPlatform = "unknown";

        if (responseData?.issueCreate?.success) {
          const created = responseData.issueCreate.issue;
          title = `Auto-created ${created.identifier}: ${created.title}`;
          feedPlatform = "linear";
        } else if (resultData?.responseData?.ok) {
          title = "Auto-notified Slack";
          feedPlatform = "slack";
        }

        addEvent({
          id: crypto.randomUUID(),
          platform: feedPlatform,
          eventType: "automation.executed",
          title,
          description: `Triggered by ${(eventPayload.repository as Record<string, unknown>)?.full_name || "webhook"} #${(eventPayload.issue as Record<string, unknown>)?.number || ""}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Automation error:", err);
    }
  }
}
