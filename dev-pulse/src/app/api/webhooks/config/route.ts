import { NextRequest, NextResponse } from "next/server";
import { ONE_API_BASE } from "@/lib/constants";

async function getConnDefId(platform: string): Promise<number | null> {
  try {
    const res = await fetch(`${ONE_API_BASE}/connection-definitions?platform=${platform}&limit=1`, {
      headers: { "x-one-secret": process.env.ONE_SECRET! },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rows?.[0]?._id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform) return NextResponse.json({ formData: [] }, { status: 400 });

  const connDefId = await getConnDefId(platform);
  if (!connDefId) return NextResponse.json({ formData: [] });

  try {
    const res = await fetch(`${ONE_API_BASE}/webhooks/relay/config/${connDefId}`, {
      headers: { "x-one-secret": process.env.ONE_SECRET! },
    });
    if (!res.ok) return NextResponse.json({ formData: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ formData: [] });
  }
}
