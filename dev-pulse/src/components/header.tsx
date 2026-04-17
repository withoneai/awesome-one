"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Plus, CheckCircle, WebhooksLogo, Lightning, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { PLATFORMS } from "@/lib/constants";

interface HeaderProps {
  connections: Record<string, { key: string; platform: string }>;
  onConnect: (platform: string) => void;
  onDisconnect?: (platform: string) => void;
  onConfigureWebhooks?: () => void;
  onConfigureAutomations?: () => void;
}

export function Header({ connections, onConnect, onDisconnect, onConfigureWebhooks, onConfigureAutomations }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const connectedCount = PLATFORMS.filter((p) => !!connections[p.id]).length;

  return (
    <header className="border-b border-border px-6 py-2.5 shrink-0">
      <div className="flex items-center gap-4">
        {/* Logo + Title + Live */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {mounted && (
            <Image
              src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
              alt="One"
              width={24}
              height={24}
              className="shrink-0"
            />
          )}
          <span className="text-sm font-semibold text-foreground tracking-tight">Dev Pulse</span>
        </Link>

        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[hsl(var(--status-badge-green))] text-[hsl(var(--status-badge-green-foreground))] text-[10px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--badge-green))] pulse-dot" />
          Live
        </span>

        {/* Divider */}
        <div className="w-px h-5 bg-border" />

        {/* Sources — right aligned */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {PLATFORMS.map((p) => {
            const conn = connections[p.id];
            const isConnected = !!conn;
            return (
              <div key={p.id} className="relative group">
                <button
                  onClick={() => !isConnected && onConnect(p.name)}
                  disabled={isConnected}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isConnected
                      ? "bg-[hsl(var(--status-badge-green))] text-[hsl(var(--status-badge-green-foreground))]"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary-hover cursor-pointer"
                  }`}
                >
                  <Image
                    src={`https://assets.withone.ai/connectors/${p.slug}.svg`}
                    alt={p.name}
                    width={14}
                    height={14}
                  />
                  {p.name}
                  {isConnected ? (
                    <CheckCircle className="w-3 h-3" weight="bold" />
                  ) : (
                    <Plus className="w-3 h-3 opacity-50" weight="bold" />
                  )}
                </button>

                {/* Delete button — shows on hover */}
                {isConnected && onDisconnect && (
                  <button
                    onClick={() => onDisconnect(p.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Disconnect ${p.name}`}
                  >
                    <X className="w-2.5 h-2.5" weight="bold" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Automations + Webhooks + Theme */}
        <div className="flex items-center gap-1.5 shrink-0">
          {connectedCount > 0 && onConfigureAutomations && (
            <button
              onClick={onConfigureAutomations}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card hover:bg-card-hover border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lightning className="w-3.5 h-3.5" weight="bold" />
              Automations
            </button>
          )}

          {connectedCount > 0 && onConfigureWebhooks && (
            <button
              onClick={onConfigureWebhooks}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card hover:bg-card-hover border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <WebhooksLogo className="w-3.5 h-3.5" weight="bold" />
              Webhooks
            </button>
          )}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4" weight="bold" />
            ) : (
              <Moon className="w-4 h-4" weight="bold" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
