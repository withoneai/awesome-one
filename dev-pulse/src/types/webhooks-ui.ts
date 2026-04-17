import type { Connection } from "./connections";

export interface WebhookConfigModalProps {
  open: boolean;
  onClose: () => void;
  connections: Record<string, Connection>;
}

export type WebhookView = "list" | "platform" | "events" | "metadata" | "creating";

export interface WebhookResultState {
  success: boolean;
  message: string;
  warning?: string;
}
