import type { CalendarEvent } from "@/types/calendar";

export interface GitHubKpis {
  prsMerged: number;
}

export interface LinearKpis {
  issuesClosed: number;
  sprintProgress: number;
}

export interface CalendarKpis {
  events: CalendarEvent[];
  meetingHours: number;
}

async function fetchJsonOrDefault<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export function getGithubKpis(connectionKey: string): Promise<GitHubKpis> {
  return fetchJsonOrDefault<GitHubKpis>(
    `/api/data/github?connectionKey=${encodeURIComponent(connectionKey)}`,
    { prsMerged: 0 },
  );
}

export function getLinearKpis(connectionKey: string): Promise<LinearKpis> {
  return fetchJsonOrDefault<LinearKpis>(
    `/api/data/linear?connectionKey=${encodeURIComponent(connectionKey)}`,
    { issuesClosed: 0, sprintProgress: 0 },
  );
}

export function getCalendarKpis(connectionKey: string): Promise<CalendarKpis> {
  return fetchJsonOrDefault<CalendarKpis>(
    `/api/data/calendar?connectionKey=${encodeURIComponent(connectionKey)}`,
    { events: [], meetingHours: 0 },
  );
}
