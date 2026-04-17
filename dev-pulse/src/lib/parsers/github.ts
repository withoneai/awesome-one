import type { ParsedEvent } from "./index";

// Only parse events verified from real webhook payloads.
// Returns null for unverified events → generic fallback handles them.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGitHubEvent(eventType: string, payload: Record<string, any>): ParsedEvent | null {
  const action = payload.action as string;

  switch (eventType) {
    case "push": {
      const commits = payload.commits as Array<unknown>;
      const ref = (payload.ref as string || "").replace("refs/heads/", "");
      return {
        platform: "github",
        eventType: "push",
        title: `Push to ${ref}`,
        description: `${commits?.length || 0} commit(s)`,
      };
    }

    case "pull_request": {
      const pr = payload.pull_request;
      const merged = action === "closed" && pr?.merged;
      return {
        platform: "github",
        eventType: `pull_request.${action}`,
        title: `PR #${pr?.number} ${merged ? "merged" : action}`,
        description: pr?.title || "",
      };
    }

    case "issues": {
      const issue = payload.issue;
      return {
        platform: "github",
        eventType: `issues.${action}`,
        title: `Issue #${issue?.number} ${action}`,
        description: issue?.title || "",
      };
    }

    default:
      return null;
  }
}
