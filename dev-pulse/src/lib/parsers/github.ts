import type { ParsedEvent } from "./index";

// Covers the 9 recommended repo-level webhook events:
// push, pull_request, pull_request_review, pull_request_review_comment,
// issues, issue_comment, create, delete, release

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGitHubEvent(eventType: string, payload: Record<string, any>): ParsedEvent {
  const action = payload.action as string;
  const repo = payload.repository;
  const sender = payload.sender;

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

    case "pull_request_review": {
      const pr = payload.pull_request;
      const review = payload.review;
      const state = review?.state || action; // "approved", "changes_requested", "commented"
      return {
        platform: "github",
        eventType: `pull_request_review.${action}`,
        title: `Review ${state} on PR #${pr?.number}`,
        description: `by ${review?.user?.login || sender?.login || "unknown"}`,
      };
    }

    case "pull_request_review_comment": {
      const pr = payload.pull_request;
      const comment = payload.comment;
      return {
        platform: "github",
        eventType: `pull_request_review_comment.${action}`,
        title: `Review comment on PR #${pr?.number}`,
        description: (comment?.body || "").slice(0, 100),
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

    case "issue_comment": {
      const issue = payload.issue;
      const comment = payload.comment;
      return {
        platform: "github",
        eventType: `issue_comment.${action}`,
        title: `Comment on #${issue?.number}`,
        description: (comment?.body || "").slice(0, 100),
      };
    }

    case "create": {
      const refType = payload.ref_type; // "branch", "tag"
      const ref = payload.ref;
      return {
        platform: "github",
        eventType: "create",
        title: `${refType === "tag" ? "Tag" : "Branch"} created: ${ref}`,
        description: repo?.full_name || "",
      };
    }

    case "delete": {
      const refType = payload.ref_type;
      const ref = payload.ref;
      return {
        platform: "github",
        eventType: "delete",
        title: `${refType === "tag" ? "Tag" : "Branch"} deleted: ${ref}`,
        description: repo?.full_name || "",
      };
    }

    case "release": {
      const release = payload.release;
      return {
        platform: "github",
        eventType: `release.${action}`,
        title: `Release ${release?.tag_name || ""} ${action}`,
        description: release?.name || release?.tag_name || "",
      };
    }

    default:
      return {
        platform: "github",
        eventType,
        title: `GitHub ${eventType}`,
        description: action || eventType,
      };
  }
}
