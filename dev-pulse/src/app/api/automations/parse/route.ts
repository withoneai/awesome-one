import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { ONE_API_BASE } from "@/lib/constants";

const PLATFORMS = ["github", "linear", "google-calendar", "slack"] as const;

async function getEventTypes(platform: string): Promise<string[]> {
  try {
    const res = await fetch(`${ONE_API_BASE}/webhooks/relay/event-types?platform=${platform}`, {
      headers: { "x-one-secret": process.env.ONE_SECRET! },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function buildEventTypeContext(): Promise<string> {
  const results = await Promise.all(
    PLATFORMS.map(async (p) => {
      const events = await getEventTypes(p);
      if (events.length === 0) return null;
      return `${p}: ${events.join(", ")}`;
    })
  );
  return results.filter(Boolean).join("\n  ");
}

const AutomationSchema = z.object({
  trigger_platform: z.enum(PLATFORMS),
  trigger_event: z.string().describe("The exact event type from the supported events list"),
  action_prompt: z.string().describe("What to do when triggered, written clearly for an AI executor"),
  summary: z.string().describe("One-line human-readable summary"),
});

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  try {
    const eventContext = await buildEventTypeContext();

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: AutomationSchema,
      system: `You parse natural language automation descriptions into structured triggers.

Extract:
- trigger_platform: the source platform
- trigger_event: the EXACT event type from the list below. For GitHub, append the action with a dot (e.g., issues.opened, pull_request.closed).
- action_prompt: the action to execute, rewritten clearly for an AI agent. Include what data to use from the trigger event.
- summary: one-line human readable summary

Supported events by platform:
  ${eventContext}`,
      prompt: description,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Parse automation error:", err);
    return NextResponse.json({ error: "Failed to parse automation" }, { status: 500 });
  }
}
