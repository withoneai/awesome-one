"use client";

import Image from "next/image";
import { Sun } from "@phosphor-icons/react";
import type { MorningBriefProps } from "@/types/dashboard-ui";

export function MorningBrief({ items }: MorningBriefProps) {
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header — sticky */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-one-yellow/5 to-transparent shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-one-yellow/10 flex items-center justify-center">
            <Sun className="w-4 h-4 text-one-yellow" weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{greeting}</h3>
            <p className="text-[11px] text-muted-foreground">Here&apos;s your weekly summary</p>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="px-3 py-5 text-center">
            <p className="text-xs text-text-subtle">
              Your daily summary will appear here once platforms have data.
            </p>
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            >
              <div className="w-7 h-7 rounded-md bg-card-elevated flex items-center justify-center shrink-0">
                <Image
                  src={`https://assets.withone.ai/connectors/${item.icon}.svg`}
                  alt={item.platform}
                  width={16}
                  height={16}
                />
              </div>
              <span className="text-sm text-foreground flex-1">{item.text}</span>
              {item.count !== undefined && (
                <span className="text-xs font-mono font-bold text-one-yellow bg-one-yellow/10 px-2 py-0.5 rounded-md min-w-[28px] text-center">
                  {item.count}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
