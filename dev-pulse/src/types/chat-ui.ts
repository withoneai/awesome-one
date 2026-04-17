export interface ToolStep {
  tool: string;
  status: "running" | "done" | "error";
  platform?: string;
  result?: unknown;
  input?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolSteps?: ToolStep[];
  timestamp: number;
}

export interface ActionGroup {
  platform: string;
  summary: string;
  knowledgeChips: { title: string; platform: string }[];
  result: unknown;
  status: "done" | "error";
}

export interface ThinkingLine {
  text: string;
  platform?: string;
  type: "search" | "knowledge" | "execute";
}
