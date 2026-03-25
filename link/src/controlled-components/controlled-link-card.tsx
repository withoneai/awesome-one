import { useState, useEffect, useRef, useCallback } from "react";
import { useOneAuth } from "@withone/auth";
import { useLinkData } from "../hooks/useLinkData";
import { deleteConnection } from "../endpoints/link";
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
  // Track the old connection ID to delete after successful reconnect
  const reconnectingConnectionId = useRef<string | null>(null);

  const { open } = useOneAuth({
    token: { url: `${window.location.origin}/api/one-auth` },
    selectedConnection: connectingPlatform || undefined,
    appTheme: isDark ? "dark" : "light",
    onSuccess: async () => {
      // If reconnecting, delete the old connection first
      if (reconnectingConnectionId.current) {
        try {
          await deleteConnection(reconnectingConnectionId.current);
        } catch (err) {
          console.error("Failed to delete old connection:", err);
        }
        reconnectingConnectionId.current = null;
      }
      setConnectingPlatform(null);
      refreshConnections();
    },
    onError: () => {
      reconnectingConnectionId.current = null;
      setConnectingPlatform(null);
    },
    onClose: () => {
      reconnectingConnectionId.current = null;
      setConnectingPlatform(null);
    },
  });

  useEffect(() => {
    if (pendingOpen.current && connectingPlatform) {
      pendingOpen.current = false;
      open();
    }
  }, [connectingPlatform, open]);

  const handleConnect = useCallback((platformName: string) => {
    reconnectingConnectionId.current = null;
    pendingOpen.current = true;
    setConnectingPlatform(platformName);
  }, []);

  const handleReconnect = useCallback(
    (platformName: string, connectionId: string) => {
      reconnectingConnectionId.current = connectionId;
      pendingOpen.current = true;
      setConnectingPlatform(platformName);
    },
    []
  );

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
          onReconnect={handleReconnect}
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
