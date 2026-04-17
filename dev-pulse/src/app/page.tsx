"use client";

import { useEffect, useState, useRef } from "react";
import { useOneAuth } from "@withone/auth";
import { Header } from "@/components/header";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { CalendarSidebar, type CalendarEvent } from "@/components/dashboard/calendar-sidebar";
import { MorningBrief } from "@/components/dashboard/morning-brief";
import { WebhookConfigModal } from "@/components/dashboard/webhook-config-modal";
import { AutomationsPanel } from "@/components/dashboard/automations-panel";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

const REFRESH_INTERVAL_MS = 60_000;

interface DashboardData {
  prsMerged: number;
  issuesClosed: number;
  sprintProgress: number;
  meetingHours: number;
  calendarEvents: CalendarEvent[];
  briefItems: Array<{
    platform: string;
    icon: string;
    text: string;
    count?: number;
  }>;
}

interface Connection {
  key: string;
  platform: string;
}

// ── Skeleton Components ──

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />;
}

function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-5 w-5 rounded-full" />
          </div>
          <Shimmer className="h-8 w-16 mb-2" />
          <Shimmer className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

function MorningBriefSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <Shimmer className="w-8 h-8 rounded-lg" />
          <div>
            <Shimmer className="h-4 w-28 mb-1" />
            <Shimmer className="h-3 w-36" />
          </div>
        </div>
      </div>
      <div className="p-3 flex-1 space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Shimmer className="w-7 h-7 rounded-md" />
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-5 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarSidebarSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <Shimmer className="w-8 h-8 rounded-lg" />
          <div>
            <Shimmer className="h-4 w-20 mb-1" />
            <Shimmer className="h-3 w-32" />
          </div>
        </div>
      </div>
      <div className="flex-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-3 border-b border-border last:border-0">
            <Shimmer className="h-3 w-28 mb-2" />
            <Shimmer className="h-4 w-44 mb-2" />
            <div className="flex gap-3">
              <Shimmer className="h-3 w-14" />
              <Shimmer className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [connections, setConnections] = useState<Record<string, Connection>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    prsMerged: 0,
    issuesClosed: 0,
    sprintProgress: 0,
    meetingHours: 0,
    calendarEvents: [],
    briefItems: [],
  });

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shouldOpenRef = useRef(false);

  // Load connections from vault
  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch("/api/connections");
        if (res.ok) setConnections(await res.json());
      } catch (err) {
        console.error("Failed to load connections:", err);
      }
    }
    loadConnections();
  }, []);

  // Auth hook
  const { open } = useOneAuth({
    token: { url: `${appUrl}/api/one-auth`, headers: {} },
    selectedConnection: connecting || undefined,
    appTheme: (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light") as "dark" | "light",
    title: "Connect to Dev Pulse",
    onSuccess: async () => {
      // Sync from vault to get the real UUID, then refresh
      try {
        const res = await fetch("/api/connections?sync=true");
        if (res.ok) setConnections(await res.json());
      } catch { /* ignore */ }
      setConnecting(null);
    },
    onError: () => setConnecting(null),
    onClose: () => setConnecting(null),
  });

  useEffect(() => {
    if (connecting && shouldOpenRef.current) {
      shouldOpenRef.current = false;
      open();
    }
  }, [connecting, open]);

  const handleConnect = (platformName: string) => {
    shouldOpenRef.current = true;
    setConnecting(platformName);
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const githubKey = connections.github?.key || "";
      const linearKey = connections.linear?.key || "";
      const calendarKey = connections["google-calendar"]?.key || "";

      const [githubRes, linearRes, calendarRes] = await Promise.allSettled([
        githubKey ? fetch(`/api/data/github?connectionKey=${encodeURIComponent(githubKey)}`) : Promise.resolve(null),
        linearKey ? fetch(`/api/data/linear?connectionKey=${encodeURIComponent(linearKey)}`) : Promise.resolve(null),
        calendarKey ? fetch(`/api/data/calendar?connectionKey=${encodeURIComponent(calendarKey)}`) : Promise.resolve(null),
      ]);

      const github = githubRes.status === "fulfilled" && githubRes.value && (githubRes.value as Response).ok
        ? await (githubRes.value as Response).json() : { prsMerged: 0 };
      const linear = linearRes.status === "fulfilled" && linearRes.value && (linearRes.value as Response).ok
        ? await (linearRes.value as Response).json() : { issuesClosed: 0, sprintProgress: 0 };
      const calendar = calendarRes.status === "fulfilled" && calendarRes.value && (calendarRes.value as Response).ok
        ? await (calendarRes.value as Response).json() : { events: [], meetingHours: 0 };

      const briefItems = [];
      if (github.prsMerged > 0) briefItems.push({ platform: "github", icon: "github", text: "PRs merged this week", count: github.prsMerged });
      if (linear.issuesClosed > 0) briefItems.push({ platform: "linear", icon: "linear", text: "Issues closed this week", count: linear.issuesClosed });
      // Count only today's timed meetings for the brief
      const todayStr = new Date().toDateString();
      const todayMeetings = (calendar.events || []).filter((e: { startTime: string }) => {
        try { return new Date(e.startTime).toDateString() === todayStr; } catch { return false; }
      });
      if (todayMeetings.length > 0) briefItems.push({ platform: "calendar", icon: "google-calendar", text: "Meetings today", count: todayMeetings.length });
      if (calendar.events?.length > todayMeetings.length) briefItems.push({ platform: "calendar", icon: "google-calendar", text: "Meetings this week", count: calendar.events.length });
      if (linear.sprintProgress > 0) briefItems.push({ platform: "linear", icon: "linear", text: `Sprint progress: ${linear.sprintProgress}%` });

      setData({
        prsMerged: github.prsMerged || 0,
        issuesClosed: linear.issuesClosed || 0,
        sprintProgress: linear.sprintProgress || 0,
        meetingHours: calendar.meetingHours || 0,
        calendarEvents: calendar.events || [],
        briefItems,
      });
    }

    if (Object.keys(connections).length > 0) {
      fetchData().finally(() => setDataLoading(false));
      const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    } else {
      setDataLoading(false);
    }
  }, [connections]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header
        connections={connections}
        onConnect={handleConnect}
        onDisconnect={(platform) => setDisconnecting(platform)}
        onConfigureWebhooks={() => setWebhookModalOpen(true)}
        onConfigureAutomations={() => setAutomationsOpen(true)}
      />

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT: Dashboard — fixed height, no page scroll */}
        <div className="flex-1 flex flex-col p-6 pb-2 gap-6 min-h-0">
          {/* KPI Cards — fixed, never scrolls */}
          <div className="shrink-0">
            {dataLoading ? <KPICardsSkeleton /> : (
              <KPICards
                prsMerged={data.prsMerged}
                issuesClosed={data.issuesClosed}
                sprintProgress={data.sprintProgress}
                meetingHours={data.meetingHours}
              />
            )}
          </div>

          {/* Activity + Sidebar — fills remaining space */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
            {/* Activity Feed — scrolls internally */}
            <div className="lg:col-span-3 min-h-0 flex flex-col">
              <LiveFeed />
            </div>

            {/* Right sidebar — two cards split the height */}
            <div className="lg:col-span-2 min-h-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0 overflow-y-auto">
                {dataLoading ? <MorningBriefSkeleton /> : <MorningBrief items={data.briefItems} />}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {dataLoading ? <CalendarSidebarSkeleton /> : <CalendarSidebar events={data.calendarEvents} />}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Chat Panel */}
        <div className="w-[420px] border-l border-border flex flex-col bg-background-secondary">
          <ChatPanel />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <a
            href="https://withone.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
          >
            <span className="text-[11px] text-muted-foreground">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full-dark.svg" className="h-[11px] hidden dark:block" alt="One" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full-light.svg" className="h-[11px] dark:hidden" alt="One" />
          </a>
          <span className="text-[11px] text-text-subtle">
            GitHub · Linear · Calendar · Slack
          </span>
        </div>
      </footer>

      <WebhookConfigModal
        open={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        connections={connections}
      />

      <AutomationsPanel
        open={automationsOpen}
        onClose={() => setAutomationsOpen(false)}
      />

      <ConfirmModal
        open={!!disconnecting}
        onClose={() => setDisconnecting(null)}
        title={`Disconnect ${disconnecting ? disconnecting.charAt(0).toUpperCase() + disconnecting.slice(1).replace("-", " ") : ""}?`}
        description="This will remove the connection from One. You can reconnect anytime."
        confirmLabel="Disconnect"
        destructive
        onConfirm={async () => {
          if (!disconnecting) return;
          const conn = connections[disconnecting] as { id?: string };
          if (!conn?.id) return;
          await fetch(`/api/connections?id=${encodeURIComponent(conn.id)}`, { method: "DELETE" });
          const res = await fetch("/api/connections?sync=true");
          if (res.ok) setConnections(await res.json());
        }}
      />
    </div>
  );
}
