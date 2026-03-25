import { useState, useEffect, useCallback } from "react";
import type { PlatformInfo, LinkConfig } from "../types";
import { fetchConfig, fetchPlatforms, fetchConnections } from "../endpoints/link";

export function useLinkData() {
  const [config, setConfig] = useState<LinkConfig | null>(null);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [configData, platformsData, connectionsData] = await Promise.all([
          fetchConfig(),
          fetchPlatforms(),
          fetchConnections(),
        ]);
        setConfig(configData);
        setPlatforms(platformsData);
        setConnectedPlatforms(connectionsData);
      } catch (err) {
        setError("Failed to load. Check your environment variables.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const refreshConnections = useCallback(async () => {
    try {
      setConnectedPlatforms(await fetchConnections());
    } catch {}
  }, []);

  return {
    config,
    platforms,
    connectedPlatforms,
    loading,
    error,
    refreshConnections,
  };
}
