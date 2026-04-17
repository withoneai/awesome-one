export interface PulseEvent {
  id: string;
  platform: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  payload?: unknown;
}
