import Database from "better-sqlite3";
import path from "path";

// Single database instance — reused across all requests
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "dev-pulse.db");
    db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    db.pragma("journal_mode = WAL");

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_steps TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        payload TEXT
      );

      CREATE TABLE IF NOT EXISTS automations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger_platform TEXT NOT NULL,
        trigger_event TEXT NOT NULL,
        action_prompt TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        state TEXT NOT NULL DEFAULT 'operational',
        connected_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_events_platform ON events(platform);
      CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(trigger_platform, trigger_event, enabled);
      CREATE INDEX IF NOT EXISTS idx_connections_platform ON connections(platform);

    `);
  }
  return db;
}

// --- Messages ---

export interface DbMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_steps: string | null;
  timestamp: number;
}

export function saveMessage(msg: DbMessage) {
  getDb()
    .prepare("INSERT OR REPLACE INTO messages (id, role, content, tool_steps, timestamp) VALUES (?, ?, ?, ?, ?)")
    .run(msg.id, msg.role, msg.content, msg.tool_steps, msg.timestamp);
}

export function getMessages(limit = 50): DbMessage[] {
  return getDb()
    .prepare("SELECT * FROM messages ORDER BY timestamp ASC LIMIT ?")
    .all(limit) as DbMessage[];
}

export function clearMessages() {
  getDb().prepare("DELETE FROM messages").run();
}

// --- Events ---

export interface DbEvent {
  id: string;
  platform: string;
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  payload: string | null;
}

export function saveEvent(event: DbEvent) {
  getDb()
    .prepare("INSERT OR IGNORE INTO events (id, platform, event_type, title, description, timestamp, payload) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(event.id, event.platform, event.event_type, event.title, event.description, event.timestamp, event.payload);
}

export function getEvents(limit = 50): DbEvent[] {
  return getDb()
    .prepare("SELECT * FROM events ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as DbEvent[];
}

// --- Automations ---

export interface DbAutomation {
  id: number;
  trigger_platform: string;
  trigger_event: string;
  action_prompt: string;
  enabled: number;
  created_at: string;
}

export function createAutomation(automation: Omit<DbAutomation, "id" | "created_at">) {
  return getDb()
    .prepare("INSERT INTO automations (trigger_platform, trigger_event, action_prompt, enabled) VALUES (?, ?, ?, ?)")
    .run(automation.trigger_platform, automation.trigger_event, automation.action_prompt, automation.enabled);
}

export function getAutomations(): DbAutomation[] {
  return getDb()
    .prepare("SELECT * FROM automations ORDER BY created_at DESC")
    .all() as DbAutomation[];
}

export function getActiveAutomations(platform: string, eventType: string): DbAutomation[] {
  return getDb()
    .prepare("SELECT * FROM automations WHERE trigger_platform = ? AND trigger_event = ? AND enabled = 1")
    .all(platform, eventType) as DbAutomation[];
}

export function deleteAutomation(id: number) {
  getDb().prepare("DELETE FROM automations WHERE id = ?").run(id);
}

export function toggleAutomation(id: number, enabled: boolean) {
  getDb().prepare("UPDATE automations SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
}

// --- Connections ---

export interface DbConnection {
  id: string;
  platform: string;
  key: string;
  state: string;
  connected_at: string;
}

export function saveConnection(conn: Omit<DbConnection, "connected_at">) {
  getDb()
    .prepare("INSERT OR REPLACE INTO connections (id, platform, key, state) VALUES (?, ?, ?, ?)")
    .run(conn.id, conn.platform, conn.key, conn.state);
}

export function getConnections(): DbConnection[] {
  return getDb()
    .prepare("SELECT * FROM connections ORDER BY connected_at DESC")
    .all() as DbConnection[];
}

export function getConnectionByPlatform(platform: string): DbConnection | undefined {
  return getDb()
    .prepare("SELECT * FROM connections WHERE platform = ? LIMIT 1")
    .get(platform) as DbConnection | undefined;
}

export function deleteConnection(id: string) {
  getDb().prepare("DELETE FROM connections WHERE id = ?").run(id);
}

