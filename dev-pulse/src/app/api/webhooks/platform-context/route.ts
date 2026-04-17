import { NextRequest, NextResponse } from "next/server";
import { passthrough } from "@/lib/one-passthrough";
import { ACTION_IDS } from "@/lib/action-ids";

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  const connectionKey = req.nextUrl.searchParams.get("connectionKey");

  if (!platform || !connectionKey) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  try {
    if (platform === "linear") {
      const result = await passthrough("graphql", connectionKey, ACTION_IDS.linear.listTeams, {
        method: "POST",
        data: { query: "{ teams { nodes { id name key } } }" },
      });

      const teams = result?.data?.teams?.nodes || [];
      return NextResponse.json({
        field: "LINEAR_TEAM_ID",
        label: "Team",
        items: teams.map((t: { id: string; name: string; key: string }) => ({
          value: t.id,
          label: `${t.name} (${t.key})`,
        })),
      });
    }

    if (platform === "github") {
      const repos = await passthrough("user/repos", connectionKey, ACTION_IDS.github.listRepos, {
        queryParams: { per_page: "20", sort: "pushed", direction: "desc" },
      });

      if (!Array.isArray(repos)) return NextResponse.json({ items: [] });

      return NextResponse.json({
        fields: [{
          field: "GITHUB_REPO",
          label: "Repository",
          items: repos.map((r: { full_name: string; owner: { login: string }; name: string }) => ({
            value: r.full_name,
            label: r.full_name,
            extra: { GITHUB_OWNER: r.owner.login, GITHUB_REPOSITORY: r.name },
          })),
        }],
      });
    }

    return NextResponse.json({ items: [] });
  } catch (err) {
    console.error("Platform context fetch error:", err);
    return NextResponse.json({ items: [] });
  }
}
