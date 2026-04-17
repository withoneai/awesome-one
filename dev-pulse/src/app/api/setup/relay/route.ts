import { NextRequest, NextResponse } from "next/server";

import { ONE_API_BASE } from "@/lib/constants";

function getHeaders() {
  return {
    "x-one-secret": process.env.ONE_SECRET!,
    "Content-Type": "application/json",
  };
}

export async function POST(req: NextRequest) {
  const { connectionKey, platform, eventFilters, metadata } = await req.json();

  if (!connectionKey || !platform) {
    return NextResponse.json({ error: "connectionKey and platform are required" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is required" }, { status: 500 });

  // Step 1: Create relay endpoint
  const createRes = await fetch(`${ONE_API_BASE}/webhooks/relay`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      connectionKey,
      description: `Dev Pulse — ${platform} events`,
      eventFilters,
      metadata: metadata || undefined,
      createWebhook: true,
    }),
  });

  const endpoint = await createRes.json();

  if (!endpoint.id) {
    return NextResponse.json({ error: "Failed to create relay endpoint", details: endpoint }, { status: 500 });
  }

  // Step 2: Set actions via PATCH
  const patchRes = await fetch(`${ONE_API_BASE}/webhooks/relay/${endpoint.id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      actions: [{ type: "url", url: `${appUrl}/api/webhooks` }],
    }),
  });

  const activated = await patchRes.json();

  return NextResponse.json({
    success: true,
    relayId: endpoint.id,
    platform,
    actions: activated.actions?.length || 0,
    warning: endpoint.warning || null,
  });
}
