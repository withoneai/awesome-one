import { saveEvent as dbSaveEvent, getEvents as dbGetEvents } from "./db";

export interface PulseEvent {
  id: string;
  platform: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  payload?: unknown;
}

// SSE clients for real-time broadcasting
const clients = new Set<ReadableStreamDefaultController>();

export function addEvent(event: PulseEvent) {
  // Persist to SQLite
  dbSaveEvent({
    id: event.id,
    platform: event.platform,
    event_type: event.eventType,
    title: event.title,
    description: event.description,
    timestamp: event.timestamp,
    payload: event.payload ? JSON.stringify(event.payload) : null,
  });

  // Broadcast to all SSE clients
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const controller of clients) {
    try {
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      clients.delete(controller);
    }
  }
}

export function getEvents(limit = 50): PulseEvent[] {
  const rows = dbGetEvents(limit);
  return rows.map((row) => ({
    id: row.id,
    platform: row.platform,
    eventType: row.event_type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp,
    payload: row.payload ? JSON.parse(row.payload) : undefined,
  }));
}

export function registerClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}
