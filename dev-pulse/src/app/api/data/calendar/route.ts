import { NextRequest, NextResponse } from "next/server";
import { passthrough } from "@/lib/one-passthrough";

const CALENDAR_LIST_EVENTS = "conn_mod_def::GJ6RlnIYK20::YzuWSmaVQgurletRDNJavA";

export async function GET(req: NextRequest) {
  const connectionKey = req.nextUrl.searchParams.get("connectionKey");
  if (!connectionKey) return NextResponse.json({ events: [], meetingHours: 0 });

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfDay.getTime() + 7 * 86400000);

    const data = await passthrough(
      "calendars/{calendarId}/events",
      connectionKey,
      CALENDAR_LIST_EVENTS,
      {
        pathVariables: { calendarId: "primary" },
        queryParams: {
          timeMin: startOfDay.toISOString(),
          timeMax: endOfWeek.toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
        },
      }
    );

    const items = data?.items || [];
    const events = items
      .filter((item: { start?: { dateTime?: string } }) => item.start?.dateTime)
      .map((item: { id: string; summary?: string; start?: { dateTime?: string }; end?: { dateTime?: string }; attendees?: unknown[]; hangoutLink?: string; conferenceData?: unknown }) => ({
        id: item.id,
        title: item.summary || "Untitled",
        startTime: item.start?.dateTime || "",
        endTime: item.end?.dateTime || "",
        attendees: item.attendees?.length || 1,
        isVideo: !!(item.hangoutLink || item.conferenceData),
      }));

    const meetingHours = events.reduce((total: number, evt: { startTime: string; endTime: string }) => {
      if (!evt.startTime || !evt.endTime) return total;
      const duration = (new Date(evt.endTime).getTime() - new Date(evt.startTime).getTime()) / 3600000;
      return total + Math.max(0, duration);
    }, 0);

    return NextResponse.json({ events, meetingHours: Math.round(meetingHours * 10) / 10 });
  } catch (err) {
    console.error("Calendar data fetch error:", err);
    return NextResponse.json({ events: [], meetingHours: 0 });
  }
}
