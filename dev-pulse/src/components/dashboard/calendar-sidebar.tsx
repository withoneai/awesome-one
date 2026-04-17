"use client";

import Image from "next/image";
import { VideoCamera, Users, CalendarBlank, Clock } from "@phosphor-icons/react";

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: number;
  isVideo: boolean;
}

interface CalendarSidebarProps {
  events: CalendarEvent[];
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function formatDay(iso: string): string {
  try {
    const date = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function isNow(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}

function isAllDay(start: string): boolean {
  return !start.includes("T");
}

function getTimeUntil(start: string): string | null {
  const diff = new Date(start).getTime() - Date.now();
  if (diff < 0 || diff > 60 * 60 * 1000) return null; // 1 hour in ms
  const mins = Math.floor(diff / 60000);
  return `in ${mins}m`;
}

export function CalendarSidebar({ events }: CalendarSidebarProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const timedEvents = events.filter((e) => !isAllDay(e.startTime));

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header — sticky */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-calendar/5 to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-calendar/10 flex items-center justify-center">
              <CalendarBlank className="w-4 h-4 text-calendar" weight="fill" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">This Week</h2>
              <p className="text-[11px] text-muted-foreground">{today}</p>
            </div>
          </div>
          <Image
            src="https://assets.withone.ai/connectors/google-calendar.svg"
            alt="Google Calendar"
            width={18}
            height={18}
            className="opacity-40"
          />
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
      {timedEvents.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Clock className="w-5 h-5 text-text-subtle mx-auto mb-2" weight="bold" />
          <p className="text-xs text-text-subtle">No meetings scheduled today</p>
        </div>
      ) : (
        timedEvents.map((event, i) => {
          const current = isNow(event.startTime, event.endTime);
          const soon = getTimeUntil(event.startTime);
          const isLast = i === timedEvents.length - 1;

          return (
            <div
              key={event.id}
              className={`px-5 py-3 transition-colors ${!isLast ? "border-b border-border" : ""} ${
                current ? "bg-[hsl(var(--status-badge-blue))]" : "hover:bg-card-hover"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-mono ${current ? "text-[hsl(var(--status-badge-blue-foreground))]" : "text-muted-foreground"}`}>
                  {formatDay(event.startTime)} {formatTime(event.startTime)}
                </span>
                {current && (
                  <span className="text-[10px] font-semibold bg-[hsl(var(--badge-blue))] text-white px-1.5 py-0.5 rounded">NOW</span>
                )}
                {!current && soon && (
                  <span className="text-[10px] font-medium text-one-yellow bg-one-yellow/10 px-1.5 py-0.5 rounded">{soon}</span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              {(event.isVideo || event.attendees > 1) && (
                <div className="flex items-center gap-3 mt-1.5">
                  {event.isVideo && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <VideoCamera className="w-3 h-3" weight="bold" /> Video
                    </span>
                  )}
                  {event.attendees > 1 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="w-3 h-3" weight="bold" /> {event.attendees}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}
