import { NextRequest, NextResponse } from "next/server";
import { passthrough } from "@/lib/one-passthrough";

// Stable action IDs for GitHub REST API
const LIST_REPOS = "conn_mod_def::GJ3aJv0FLn0::-lTycDc4TMG2EV3FIxpXVA";
const LIST_PRS = "conn_mod_def::GJ3ZxjBXxMQ::_MimZcghS8q0ydHS-ZafJg";

export async function GET(req: NextRequest) {
  const connectionKey = req.nextUrl.searchParams.get("connectionKey");
  if (!connectionKey) return NextResponse.json({ prsMerged: 0 });

  try {
    const repos = await passthrough("user/repos", connectionKey, LIST_REPOS, {
      queryParams: { per_page: "5", sort: "pushed", direction: "desc" },
    });

    let prsMerged = 0;
    if (Array.isArray(repos)) {
      for (const repo of repos.slice(0, 3)) {
        const owner = repo.owner?.login || repo.full_name?.split("/")[0];
        const name = repo.name;
        if (!owner || !name) continue;

        const prs = await passthrough(
          `repos/${owner}/${name}/pulls`,
          connectionKey,
          LIST_PRS,
          { queryParams: { state: "closed", per_page: "20", sort: "updated", direction: "desc" } }
        );

        if (Array.isArray(prs)) {
          const weekAgo = Date.now() - 7 * 86400000;
          prsMerged += prs.filter(
            (pr: { merged_at?: string }) => pr.merged_at && new Date(pr.merged_at).getTime() > weekAgo
          ).length;
        }
      }
    }
    return NextResponse.json({ prsMerged });
  } catch (err) {
    console.error("GitHub data fetch error:", err);
    return NextResponse.json({ prsMerged: 0 });
  }
}
