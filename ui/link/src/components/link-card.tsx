import { cn } from "../lib/utils";
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
/*  Platform Row                                                       */
/* ------------------------------------------------------------------ */

function PlatformRow({
  platform,
  isConnected,
  onConnect,
}: {
  platform: PlatformInfo;
  isConnected: boolean;
  onConnect: () => void;
}) {
  return (
    <button
      onClick={() => !isConnected && onConnect()}
      disabled={isConnected}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 group",
        "border",
        isConnected
          ? "border-border/30 cursor-default"
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
          <span className="text-[11px] font-medium text-connected">
            Connected
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-connected pulse-connected" />
        </div>
      ) : (
        <svg
          className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
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
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported Card Variants                                             */
/* ------------------------------------------------------------------ */

interface LinkCardProps {
  config: LinkConfig;
  platforms: PlatformInfo[];
  connectedPlatforms: Set<string>;
  onConnect: (platformName: string) => void;
}

export function LinkCard({
  config,
  platforms,
  connectedPlatforms,
  onConnect,
}: LinkCardProps) {
  const allConnected =
    platforms.length > 0 &&
    platforms.every((p) => connectedPlatforms.has(p.platform));

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

      {/* Platform list */}
      <div className="px-5 pb-5 space-y-1">
        {platforms.map((platform) => (
          <PlatformRow
            key={platform.platform}
            platform={platform}
            isConnected={connectedPlatforms.has(platform.platform)}
            onConnect={() => onConnect(platform.name)}
          />
        ))}
      </div>

      {/* Success banner */}
      {allConnected && (
        <div className="px-6 pb-5 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-connected pulse-connected" />
            <span className="text-[11px] font-medium text-connected">
              {config.successMessage}
            </span>
          </div>
        </div>
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
