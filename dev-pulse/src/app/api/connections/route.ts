import { NextRequest, NextResponse } from "next/server";
import { getConnections, saveConnection, deleteConnection as dbDeleteConnection } from "@/lib/db";

const ONE_API_BASE = "https://api.withone.ai/v1";

// GET: Return connections from SQLite. Syncs from vault on first load or when ?sync=true.
export async function GET(req: NextRequest) {
  try {
    const forceSync = req.nextUrl.searchParams.get("sync") === "true";
    let connections = getConnections();

    if (connections.length === 0 || forceSync) {
      await syncFromVault();
      connections = getConnections();
    }

    // Group by platform — prefer connections without identity pipe
    const byPlatform: Record<string, { id: string; key: string; platform: string; state: string }> = {};
    for (const conn of connections) {
      const existing = byPlatform[conn.platform];
      const hasNoPipe = !conn.key.includes("|");
      if (!existing || hasNoPipe) {
        byPlatform[conn.platform] = {
          id: conn.id,
          key: conn.key,
          platform: conn.platform,
          state: conn.state,
        };
      }
    }

    return NextResponse.json(byPlatform);
  } catch (err) {
    console.error("Failed to list connections:", err);
    return NextResponse.json({}, { status: 500 });
  }
}

// DELETE: Remove a connection from One's vault and SQLite
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Delete from One's vault using the UUID
  try {
    await fetch(`${ONE_API_BASE}/vault/connections/${id}`, {
      method: "DELETE",
      headers: { "x-one-secret": process.env.ONE_SECRET! },
    });
  } catch (err) {
    console.error("Failed to delete from vault:", err);
  }

  // Delete from local DB
  dbDeleteConnection(id);
  return NextResponse.json({ deleted: true });
}

// Sync connections from One's vault into SQLite
async function syncFromVault() {
  try {
    const res = await fetch(`${ONE_API_BASE}/vault/connections`, {
      headers: {
        "x-one-secret": process.env.ONE_SECRET!,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    const rows = data?.rows || [];

    for (const conn of rows) {
      if (conn.active && conn.environment === "live" && conn.platform && conn.id) {
        try {
          saveConnection({
            id: conn.id,
            platform: conn.platform,
            key: conn.key,
            state: conn.state || "operational",
          });
        } catch (saveErr) {
          console.error(`Failed to sync connection for platform "${conn.platform}" (id=${conn.id}):`, saveErr);
        }
      }
    }
  } catch (err) {
    console.error(`Failed to sync from vault:`, err);
  }

  // Per-platform errors are logged above; if individual platforms fail during
  // iteration the loop continues so other connections still sync.
}
