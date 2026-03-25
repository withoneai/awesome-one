import { cn } from "../lib/utils";
import { useState, useRef, useEffect } from "react";
import type { PlatformInfo, LinkConfig } from "../types";

function Spinner() {
  return (
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-solid border-muted-foreground border-t-transparent" />
  );
}

/* ------------------------------------------------------------------ */
/*  Logo — switches via CSS dark: variant, no JS needed                */
/* ------------------------------------------------------------------ */

function OneLogo({ className }: { className?: string }) {
  return (
    <>
      <img src="/logo/logo-full-light.svg" alt="One" className={cn(className, "dark:hidden")} />
      <img src="/logo/logo-full-dark.svg" alt="One" className={cn(className, "hidden dark:block")} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Card Shell                                                         */
/* ------------------------------------------------------------------ */

function CardShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  footer?: boolean;
}) {
  return (
    <div className="w-[480px] max-w-[calc(100%-16px)]">
      <div
        className={cn(
          "w-full overflow-hidden border flex flex-col glass card-surface",
          footer ? "rounded-t-[24px] border-b-0" : "rounded-[24px]"
        )}
      >
        {children}
      </div>
      {footer && (
        <div className="w-full flex flex-col items-center justify-center gap-1.5 rounded-b-[24px] border border-t-0 glass footer-surface py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">
              Secured &amp; powered by
            </span>
            <OneLogo className="h-[11px]" />
          </div>
          <a
            href="https://withone.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            withone.ai
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search Bar                                                         */
/* ------------------------------------------------------------------ */

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-5 pb-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search apps..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg bg-card-elevated/50 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-border transition-colors"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Three-dot Menu                                                     */
/* ------------------------------------------------------------------ */

function ReconnectMenu({ onReconnect }: { onReconnect: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-card-elevated transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-32 rounded-lg border border-border bg-card shadow-lg py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onReconnect();
            }}
            className="w-full px-3 py-1.5 text-left text-[12px] text-muted-foreground hover:text-foreground hover:bg-card-elevated transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform Row                                                       */
/* ------------------------------------------------------------------ */

function PlatformRow({
  platform,
  isConnected,
  onConnect,
  onReconnect,
}: {
  platform: PlatformInfo;
  isConnected: boolean;
  onConnect: () => void;
  onReconnect?: () => void;
}) {
  return (
    <div
      onClick={() => !isConnected && onConnect()}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 group",
        "border",
        isConnected
          ? "border-border/30"
          : "border-transparent hover:bg-card-elevated cursor-pointer active:scale-[0.98]"
      )}
    >
      <img
        src={platform.image}
        alt={platform.name}
        className="w-9 h-9 rounded-lg object-contain shrink-0"
      />
      <div className="flex-1 text-left min-w-0">
        <span
          className={cn(
            "text-[13px] font-medium transition-colors duration-150",
            isConnected
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {platform.name}
        </span>
      </div>
      {isConnected ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-connected pulse-connected" />
          <span className="text-[11px] font-medium text-connected">
            Connected
          </span>
          {onReconnect && <ReconnectMenu onReconnect={onReconnect} />}
        </div>
      ) : (
        <svg
          className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all duration-150 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported Card Variants                                             */
/* ------------------------------------------------------------------ */

interface LinkCardProps {
  config: LinkConfig;
  platforms: PlatformInfo[];
  connectedPlatforms: Map<string, string>;
  onConnect: (platformName: string) => void;
  onReconnect: (platformName: string, connectionId: string) => void;
}

export function LinkCard({
  config,
  platforms,
  connectedPlatforms,
  onConnect,
  onReconnect,
}: LinkCardProps) {
  const [search, setSearch] = useState("");
  const allConnected =
    platforms.length > 0 &&
    platforms.every((p) => connectedPlatforms.has(p.platform));

  const filtered = search
    ? platforms.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : platforms;

  return (
    <CardShell>
      {/* Header */}
      <div className="flex flex-col items-center pt-10 px-8 pb-5">
        <div className="mb-6">
          {config.companyLogoLight || config.companyLogoDark ? (
            <>
              <img src={config.companyLogoLight || config.companyLogoDark} alt={config.companyName} className="h-8 w-auto dark:hidden" />
              <img src={config.companyLogoDark || config.companyLogoLight} alt={config.companyName} className="h-8 w-auto hidden dark:block" />
            </>
          ) : (
            <OneLogo className="h-8 w-auto" />
          )}
        </div>
        <h1 className="text-[17px] font-semibold text-foreground leading-tight text-center">
          Welcome to {config.companyName}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2 text-center leading-relaxed max-w-[360px]">
          {config.welcomeMessage}
        </p>
      </div>

      {/* Search */}
      {platforms.length > 3 && (
        <SearchBar value={search} onChange={setSearch} />
      )}

      {/* Platform list — fixed height, scrollable */}
      <div className="px-5 pb-3 max-h-[280px] overflow-y-auto scrollbar-thin space-y-1">
        {filtered.map((platform) => {
          const connectionId = connectedPlatforms.get(platform.platform);
          return (
            <PlatformRow
              key={platform.platform}
              platform={platform}
              isConnected={!!connectionId}
              onConnect={() => onConnect(platform.name)}
              onReconnect={
                connectionId
                  ? () => onReconnect(platform.name, connectionId)
                  : undefined
              }
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center py-6">
            No integrations found
          </p>
        )}
      </div>

      {/* Success banner — fixed above footer, outside scroll area */}
      {allConnected ? (
        <div className="px-6 py-3 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-connected pulse-connected" />
            <span className="text-[11px] font-medium text-connected">
              {config.successMessage}
            </span>
          </div>
        </div>
      ) : (
        <div className="pb-2" />
      )}
    </CardShell>
  );
}

export function LoadingCard() {
  return (
    <CardShell>
      <div className="flex flex-col items-center justify-center min-h-[420px]">
        <Spinner />
        <p className="text-[13px] text-muted-foreground mt-4">
          Loading integrations...
        </p>
      </div>
    </CardShell>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <CardShell footer={false}>
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-[13px] text-muted-foreground">{message}</p>
      </div>
    </CardShell>
  );
}
