import { NextRequest, NextResponse } from "next/server";
import { getMessages, saveMessage, clearMessages } from "@/lib/db";

export async function GET() {
  const messages = getMessages(100);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const msg = await req.json();
  saveMessage(msg);
  return NextResponse.json({ saved: true });
}

export async function DELETE() {
  clearMessages();
  return NextResponse.json({ cleared: true });
}
