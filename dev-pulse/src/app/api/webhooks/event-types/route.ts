import { NextRequest, NextResponse } from "next/server";

const ONE_API_BASE = "https://api.withone.ai/v1";

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform) return NextResponse.json([], { status: 400 });

  try {
    const res = await fetch(`${ONE_API_BASE}/webhooks/relay/event-types?platform=${platform}`, {
      headers: { "x-one-secret": process.env.ONE_SECRET! },
    });
    if (!res.ok) return NextResponse.json([]);

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json([]);
  }
}
