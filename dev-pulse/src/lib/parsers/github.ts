import type { ParsedEvent } from "./index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGitHubEvent(eventType: string, payload: Record<string, any>): ParsedEvent {
  const action = payload.action as string;

  if (eventType === "pull_request") {
    const pr = payload.pull_request;
    return {
      platform: "github",
      eventType: `pull_request.${action}`,
      title: `PR #${pr.number} ${action}`,
      description: pr.title || "",
    };
  }

  if (eventType === "push") {
    const commits = payload.commits as Array<unknown>;
    const ref = (payload.ref as string).replace("refs/heads/", "");
    return {
      platform: "github",
      eventType: "push",
      title: `Push to ${ref}`,
      description: `${commits?.length || 0} commit(s)`,
    };
  }

  if (eventType === "issues") {
    const issue = payload.issue;
    return {
      platform: "github",
      eventType: `issues.${action}`,
      title: `Issue #${issue.number} ${action}`,
      description: issue.title || "",
    };
  }

  return {
    platform: "github",
    eventType,
    title: `GitHub ${eventType}`,
    description: action || eventType,
  };
}
