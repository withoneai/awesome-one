"use client";

import Image from "next/image";
import type { KPICardsProps } from "@/types/dashboard-ui";

const cards = [
  {
    key: "prs",
    label: "PRs Merged",
    platform: "github",
    getValue: (p: KPICardsProps) => String(p.prsMerged),
    suffix: "this week",
  },
  {
    key: "issues",
    label: "Issues Closed",
    platform: "linear",
    getValue: (p: KPICardsProps) => String(p.issuesClosed),
    suffix: "this week",
  },
  {
    key: "sprint",
    label: "Sprint Progress",
    platform: "linear",
    getValue: (p: KPICardsProps) => `${p.sprintProgress}%`,
    suffix: "active cycle",
  },
  {
    key: "meetings",
    label: "Meetings Today",
    platform: "google-calendar",
    getValue: (p: KPICardsProps) => `${p.meetingHours}h`,
    suffix: "scheduled",
  },
];

export function KPICards(props: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="glass rounded-xl p-5 hover:bg-card-hover transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
            <Image
              src={`https://assets.withone.ai/connectors/${card.platform}.svg`}
              alt={card.platform}
              width={20}
              height={20}
              className="opacity-60"
            />
          </div>
          <div className="text-3xl font-bold text-foreground font-mono tracking-tight">
            {card.getValue(props)}
          </div>
          <p className="text-xs text-text-subtle mt-1">{card.suffix}</p>
        </div>
      ))}
    </div>
  );
}
