export interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_steps: string | null;
  timestamp: number;
}
