import { NextRequest, NextResponse } from "next/server";
import { passthrough } from "@/lib/one-passthrough";
import { ACTION_IDS } from "@/lib/action-ids";

export async function GET(req: NextRequest) {
  const connectionKey = req.nextUrl.searchParams.get("connectionKey");
  if (!connectionKey) return NextResponse.json({ issuesClosed: 0, sprintProgress: 0 });

  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const result = await passthrough("graphql", connectionKey, ACTION_IDS.linear.graphql, {
      method: "POST",
      data: {
        query: `{
          viewer {
            assignedIssues(filter: { completedAt: { gte: "${weekAgo}" } }, first: 50) {
              nodes { id title state { name } completedAt }
            }
            teamMemberships {
              nodes { team { activeCycle { progress name } } }
            }
          }
        }`,
      },
    });

    const issues = result?.data?.viewer?.assignedIssues?.nodes || [];
    const teams = result?.data?.viewer?.teamMemberships?.nodes || [];
    const activeCycle = teams.find(
      (m: { team?: { activeCycle?: { progress: number } } }) => m.team?.activeCycle
    )?.team?.activeCycle;

    return NextResponse.json({
      issuesClosed: issues.length,
      sprintProgress: Math.round((activeCycle?.progress || 0) * 100),
    });
  } catch (err) {
    console.error("Linear data fetch error:", err);
    return NextResponse.json({ issuesClosed: 0, sprintProgress: 0 });
  }
}
