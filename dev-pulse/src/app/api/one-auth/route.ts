import { NextRequest, NextResponse } from "next/server";
import { ONE_API_BASE } from "@/lib/constants";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") || "1";
  const limit = req.nextUrl.searchParams.get("limit") || "50";

  const identity = process.env.ONE_IDENTITY;
  const identityType = process.env.ONE_IDENTITY_TYPE;

  const body: Record<string, string> = {};
  if (identity) {
    body.identity = identity;
    body.identityType = identityType || "user";
  }

  const res = await fetch(
    `${ONE_API_BASE}/authkit/token?page=${page}&limit=${limit}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-one-secret": process.env.ONE_SECRET!,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { headers: CORS_HEADERS });
}
