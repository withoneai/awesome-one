import type { LinkConfig } from "../types";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

interface FloatingHeaderProps {
  config: LinkConfig | null;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function FloatingHeader({ config, isDark, onToggleTheme }: FloatingHeaderProps) {
  const logoSrc = isDark
    ? (config?.companyLogoDark || "/logo/logo-full-dark.svg")
    : (config?.companyLogoLight || "/logo/logo-full-light.svg");

  return (
    <header
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
    >
      <div
        className="flex items-center justify-between px-5 h-12 rounded-2xl backdrop-blur-xl border border-border/40 bg-background/70"
        style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.12))" }}
      >
        {/* Logo */}
        <img
          src={logoSrc}
          alt={config?.companyName || "Logo"}
          className="h-5 w-auto"
        />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
