import type { CalendarEvent } from "./calendar";

export interface BriefItem {
  platform: string;
  icon: string;
  text: string;
  count?: number;
  action?: string;
}

export interface DashboardData {
  prsMerged: number;
  issuesClosed: number;
  sprintProgress: number;
  meetingHours: number;
  calendarEvents: CalendarEvent[];
  briefItems: BriefItem[];
}

export interface KPICardsProps {
  prsMerged: number;
  issuesClosed: number;
  sprintProgress: number;
  meetingHours: number;
}

export interface MorningBriefProps {
  items: BriefItem[];
}
