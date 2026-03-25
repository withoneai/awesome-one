import { useState, useEffect, useRef, useCallback } from "react";
import { useOneAuth } from "@withone/auth";
import { useLinkData } from "../hooks/useLinkData";
import { LinkCard, LoadingCard, ErrorCard } from "../components/link-card";
import { FloatingHeader } from "../components/floating-header";

interface ControlledLinkCardProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function ControlledLinkCard({
  isDark,
  onToggleTheme,
}: ControlledLinkCardProps) {
  const {
    config,
    platforms,
    connectedPlatforms,
    loading,
    error,
    refreshConnections,
  } = useLinkData();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null
  );
  const pendingOpen = useRef(false);

  const { open } = useOneAuth({
    token: { url: `${window.location.origin}/api/one-auth` },
    selectedConnection: connectingPlatform || undefined,
    appTheme: isDark ? "dark" : "light",
    onSuccess: () => {
      setConnectingPlatform(null);
      refreshConnections();
    },
    onError: () => setConnectingPlatform(null),
    onClose: () => setConnectingPlatform(null),
  });

  useEffect(() => {
    if (pendingOpen.current && connectingPlatform) {
      pendingOpen.current = false;
      open();
    }
  }, [connectingPlatform, open]);

  const handleConnect = useCallback((platformName: string) => {
    pendingOpen.current = true;
    setConnectingPlatform(platformName);
  }, []);

  const cardContent = (() => {
    if (loading) return <LoadingCard />;
    if (error || !config)
      return <ErrorCard message={error || "Configuration error"} />;
    return (
      <div className="animate-fade-in">
        <LinkCard
          config={config}
          platforms={platforms}
          connectedPlatforms={connectedPlatforms}
          onConnect={handleConnect}
        />
      </div>
    );
  })();

  return (
    <div className="flex flex-col items-center min-h-screen w-full">
      <FloatingHeader
        config={config}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />
      <div className="flex-1 flex items-center justify-center w-full px-2">
        {cardContent}
      </div>
    </div>
  );
}
