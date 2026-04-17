import { NextResponse } from "next/server";

const ONE_API_BASE = "https://api.withone.ai/v1";

export async function GET() {
  try {
    const res = await fetch(`${ONE_API_BASE}/webhooks/relay`, {
      headers: { "x-one-secret": process.env.ONE_SECRET! },
    });

    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.rows || [];

    // Filter to only show relays created by this app (identified by description prefix)
    const relays = rows
      .filter(
        (r: { active: boolean; deleted: boolean; description?: string; actions?: Array<{ type: string }> }) =>
          r.active &&
          !r.deleted &&
          r.description?.includes("Dev Pulse") &&
          r.actions?.some((a) => a.type === "url")
      )
      .map((r: { id: string; description: string; eventFilters?: string[]; metadata?: Record<string, string>; createdAt: string }) => ({
        id: r.id,
        description: r.description,
        eventFilters: r.eventFilters || [],
        metadata: r.metadata || {},
        createdAt: r.createdAt,
      }));

    return NextResponse.json(relays);
  } catch (err) {
    console.error("Failed to list relays:", err);
    return NextResponse.json([]);
  }
}
