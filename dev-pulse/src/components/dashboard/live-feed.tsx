"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Pulse } from "@phosphor-icons/react";
import type { PulseEvent } from "@/types/events";

const MAX_EVENTS = 50;

const platformColors: Record<string, string> = {
  github: "bg-github",
  linear: "bg-linear",
  calendar: "bg-calendar",
  slack: "bg-slack",
};

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Events persisted in SQLite — loaded via SSE stream on connect

export function LiveFeed() {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventsRef = useRef<PulseEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/events/stream");
    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);
    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as PulseEvent;
        // Deduplicate by ID
        if (eventsRef.current.some((ex) => ex.id === event.id)) return;
        eventsRef.current = [event, ...eventsRef.current].slice(0, MAX_EVENTS);
        setEvents([...eventsRef.current]);
      } catch { /* ignore pings */ }
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setEvents((prev) => [...prev]), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Activity Feed</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-badge-green pulse-dot" : "bg-destructive"
            }`}
          />
          <span className="text-xs text-muted-foreground font-medium">
            {connected ? "LIVE" : "CONNECTING"}
          </span>
        </div>
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-card-elevated flex items-center justify-center mb-4">
            <Pulse className="w-5 h-5 text-text-subtle" weight="bold" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">No activity yet</p>
          <p className="text-xs text-text-subtle max-w-[240px]">
            Actions from the Command Center and webhook events will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-y-auto flex-1">
          {events.map((event) => {
            const dotColor = platformColors[event.platform] || "bg-grey-medium";
            // The calendar connector is stored as "calendar" internally but the
            // asset/icon slug on assets.withone.ai is "google-calendar".
            const platformSlug =
              event.platform === "calendar" ? "google-calendar" : event.platform;

            return (
              <div
                key={event.id}
                className="px-5 py-3.5 hover:bg-card-hover transition-colors flex items-start gap-3 animate-fade-in-down"
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Image
                      src={`https://assets.withone.ai/connectors/${platformSlug}.svg`}
                      alt={event.platform}
                      width={14}
                      height={14}
                      className="shrink-0 opacity-70"
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate pl-[22px]">
                    {event.description}
                  </p>
                </div>
                <span className="text-xs text-text-subtle whitespace-nowrap shrink-0 mt-0.5">
                  {timeAgo(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
