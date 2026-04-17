import type { Connection } from "./connections";

export interface HeaderProps {
  connections: Record<string, Connection>;
  onConnect: (platform: string) => void;
  onDisconnect?: (platform: string) => void;
  onConfigureWebhooks?: () => void;
  onConfigureAutomations?: () => void;
}
