import { NextRequest, NextResponse } from "next/server";
import { passthrough } from "@/lib/one-passthrough";

const SLACK_LIST_CONVERSATIONS = "conn_mod_def::GJ7H9zmRFIk::1RxrzeicS-ibnXF4sFC5Ww";

export async function GET(req: NextRequest) {
  const connectionKey = req.nextUrl.searchParams.get("connectionKey");
  if (!connectionKey) return NextResponse.json({ messages: [], channelCount: 0 });

  try {
    const data = await passthrough("conversations.list", connectionKey, SLACK_LIST_CONVERSATIONS, {
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
