import { NextRequest, NextResponse } from "next/server";
import {
  getAutomations,
  createAutomation,
  deleteAutomation,
  toggleAutomation,
} from "@/lib/db";

export async function GET() {
  const automations = getAutomations();
  return NextResponse.json(automations);
}

export async function POST(req: NextRequest) {
  const { trigger_platform, trigger_event, action_prompt } = await req.json();

  if (!trigger_platform || !trigger_event || !action_prompt) {
    return NextResponse.json(
      { error: "trigger_platform, trigger_event, and action_prompt are required" },
      { status: 400 }
    );
  }

  const result = createAutomation({
    trigger_platform,
    trigger_event,
    action_prompt,
    enabled: 1,
  });

  return NextResponse.json({ id: result.lastInsertRowid, created: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteAutomation(Number(id));
  return NextResponse.json({ deleted: true });
}

export async function PATCH(req: NextRequest) {
  const { id, enabled } = await req.json();
  if (id === undefined || enabled === undefined) {
    return NextResponse.json({ error: "id and enabled required" }, { status: 400 });
  }
  toggleAutomation(id, enabled);
  return NextResponse.json({ updated: true });
}
