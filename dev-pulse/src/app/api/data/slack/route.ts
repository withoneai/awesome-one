import { NextRequest, NextResponse } from "next/server";
import { passthrough } from "@/lib/one-passthrough";
import { ACTION_IDS } from "@/lib/action-ids";

export async function GET(req: NextRequest) {
  const connectionKey = req.nextUrl.searchParams.get("connectionKey");
  if (!connectionKey) return NextResponse.json({ messages: [], channelCount: 0 });

  try {
    const data = await passthrough("conversations.list", connectionKey, ACTION_IDS.slack.listConversations, {
      queryParams: { limit: "20", types: "public_channel" },
    });

    const channels = data?.channels || [];
    return NextResponse.json({
      channelCount: channels.length,
      channels: channels.slice(0, 10).map((ch: { id: string; name: string; topic?: { value?: string } }) => ({
        id: ch.id,
        name: ch.name,
        topic: ch.topic?.value || "",
      })),
    });
  } catch (err) {
    console.error("Slack data fetch error:", err);
    return NextResponse.json({ messages: [], channelCount: 0 });
  }
}
