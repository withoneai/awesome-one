import type { ParsedEvent } from "./index";

// Covers all 14 Linear webhook event types:
// Comment, Cycle, Customer, CustomerNeed, Document, Initiative,
// InitiativeUpdate, Issue, IssueLabel, IssueSLA, Project,
// ProjectUpdate, Reaction, User

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLinearEvent(eventType: string, payload: Record<string, any>): ParsedEvent {
  const action = payload.action as string; // "create", "update", "remove"
  const data = payload.data;

  switch (eventType) {
    case "Issue": {
      const title = data?.title || "Untitled issue";
      const state = data?.state?.name as string;
      const identifier = data?.identifier as string;
      const assignee = data?.assignee?.name as string;
      return {
        platform: "linear",
        eventType,
        title: state ? `${title} → ${state}` : `${title} ${action || "updated"}`,
        description: [identifier, assignee].filter(Boolean).join(" · "),
      };
    }

    case "Comment": {
      const body = (data?.body || "").slice(0, 100);
      const issue = data?.issue;
      return {
        platform: "linear",
        eventType,
        title: `Comment on ${issue?.identifier || "issue"}`,
        description: body,
      };
    }

    case "Cycle": {
      const name = data?.name || data?.number ? `Cycle ${data.number}` : "Cycle";
      return {
        platform: "linear",
        eventType,
        title: `${name} ${action || "updated"}`,
        description: data?.startsAt ? `Starts: ${data.startsAt.split("T")[0]}` : "",
      };
    }

    case "Project": {
      const name = data?.name || "Untitled project";
      return {
        platform: "linear",
        eventType,
        title: `Project ${action || "updated"}: ${name}`,
        description: data?.state || "",
      };
    }

    case "ProjectUpdate": {
      const project = data?.project?.name || "project";
      return {
        platform: "linear",
        eventType,
        title: `Update on ${project}`,
        description: (data?.body || "").slice(0, 100),
      };
    }

    case "Document": {
      const title = data?.title || "Untitled document";
      return {
        platform: "linear",
        eventType,
        title: `Document ${action || "updated"}: ${title}`,
        description: "",
      };
    }

    case "IssueLabel": {
      const name = data?.name || "label";
      return {
        platform: "linear",
        eventType,
        title: `Label ${action || "updated"}: ${name}`,
        description: "",
      };
    }

    case "IssueSLA": {
      return {
        platform: "linear",
        eventType,
        title: `SLA ${action || "updated"}`,
        description: data?.issueIdentifier || "",
      };
    }

    case "Initiative": {
      const name = data?.name || "Untitled initiative";
      return {
        platform: "linear",
        eventType,
        title: `Initiative ${action || "updated"}: ${name}`,
        description: "",
      };
    }

    case "InitiativeUpdate": {
      const initiative = data?.initiative?.name || "initiative";
      return {
        platform: "linear",
        eventType,
        title: `Update on ${initiative}`,
        description: (data?.body || "").slice(0, 100),
      };
    }

    case "Customer": {
      const name = data?.name || "customer";
      return {
        platform: "linear",
        eventType,
        title: `Customer ${action || "updated"}: ${name}`,
        description: "",
      };
    }

    case "CustomerNeed": {
      return {
        platform: "linear",
        eventType,
        title: `Customer need ${action || "updated"}`,
        description: (data?.body || "").slice(0, 100),
      };
    }

    case "Reaction": {
      const emoji = data?.emoji || "reaction";
      return {
        platform: "linear",
        eventType,
        title: `Reaction ${action || "added"}: ${emoji}`,
        description: "",
      };
    }

    case "User": {
      const name = data?.name || "user";
      return {
        platform: "linear",
        eventType,
        title: `User ${action || "updated"}: ${name}`,
        description: "",
      };
    }

    default:
      return {
        platform: "linear",
        eventType,
        title: `Linear ${eventType}`,
        description: action || eventType,
      };
  }
}
