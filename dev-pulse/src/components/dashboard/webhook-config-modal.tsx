"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Check, SpinnerGap, CaretRight, WebhooksLogo, Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { WEBHOOK_PLATFORMS } from "@/lib/constants";

interface WebhookConfigModalProps {
  open: boolean;
  onClose: () => void;
  connections: Record<string, { key: string; platform: string }>;
}

interface ActiveRelay {
  id: string;
  description: string;
  eventFilters: string[];
  metadata: Record<string, string>;
  createdAt: string;
}

type View = "list" | "platform" | "events" | "metadata" | "creating";

export function WebhookConfigModal({ open, onClose, connections }: WebhookConfigModalProps) {
  const [view, setView] = useState<View>("list");
  const [activeRelays, setActiveRelays] = useState<ActiveRelay[]>([]);
  const [loadingRelays, setLoadingRelays] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [formData, setFormData] = useState<Array<{ name: string; label: string; type: string; placeholder: string }>>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dynamicContext, setDynamicContext] = useState<{
    field?: string;
    label?: string;
    items: Array<{ value: string; label: string; extra?: Record<string, string> }>;
    fields?: Array<{ field: string; label: string; items: Array<{ value: string; label: string; extra?: Record<string, string> }> }>;
  } | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [creating, setCreating] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; warning?: string } | null>(null);

  // Load active relays
  useEffect(() => {
    if (!open) return;
    setLoadingRelays(true);
    fetch("/api/webhooks/list")
      .then((r) => r.json())
      .then((data) => setActiveRelays(data))
      .catch(() => setActiveRelays([]))
      .finally(() => setLoadingRelays(false));
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setView("list");
      setSelectedPlatform(null);
      setEventTypes([]);
      setSelectedEvents([]);
      setFormData([]);
      setFormValues({});
      setResult(null);
      setEventSearch("");
    }
  }, [open]);

  // Fetch event types when platform selected
  useEffect(() => {
    if (!selectedPlatform) return;
    fetch(`/api/webhooks/event-types?platform=${selectedPlatform}`)
      .then((r) => r.json())
      .then((data) => setEventTypes(data))
      .catch(() => setEventTypes([]));

    fetch(`/api/webhooks/config?platform=${selectedPlatform}`)
      .then((r) => r.json())
      .then((data) => setFormData(data?.formData || []))
      .catch(() => setFormData([]));

    // Auto-fetch dynamic context (teams, repos, etc.)
    const connKey = connections[selectedPlatform]?.key;
    if (connKey) {
      setLoadingContext(true);
      fetch(`/api/webhooks/platform-context?platform=${selectedPlatform}&connectionKey=${encodeURIComponent(connKey)}`)
        .then((r) => r.json())
        .then((data) => {
          setDynamicContext(data);
          // Auto-select if only one item
          if (data.field && data.items?.length === 1) {
            setFormValues((prev) => ({ ...prev, [data.field]: data.items[0].value }));
          }
          if (data.fields) {
            for (const f of data.fields) {
              if (f.items?.length === 1) {
                setFormValues((prev) => ({
                  ...prev,
                  [f.field]: f.items[0].value,
                  ...(f.items[0].extra || {}),
                }));
              }
            }
          }
        })
        .catch(() => setDynamicContext(null))
        .finally(() => setLoadingContext(false));
    }
  }, [selectedPlatform, connections]);

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
    setView("events");
  };

  const handleToggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleSelectAll = () => {
    setSelectedEvents(selectedEvents.length === eventTypes.length ? [] : [...eventTypes]);
  };

  const handleNext = () => {
    if (view === "events" && formData.length > 0) {
      // If dynamic context auto-filled all fields (single team, etc.), skip metadata
      const allFilled = formData.every((f) => !!formValues[f.name]);
      if (allFilled) {
        handleCreate();
      } else {
        setView("metadata");
      }
    } else {
      handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!selectedPlatform) return;
    setView("creating");
    setCreating(true);

    try {
      const connectionKey = connections[selectedPlatform]?.key;
      if (!connectionKey) throw new Error("Platform not connected");

      const res = await fetch("/api/setup/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionKey,
          platform: selectedPlatform,
          eventFilters: selectedEvents.length > 0 ? selectedEvents : undefined,
          metadata: Object.keys(formValues).length > 0 ? formValues : undefined,
        }),
      });

      const data = await res.json();
      setResult({
        success: !!data.success,
        message: data.success
          ? `Webhook relay active for ${selectedPlatform}. Events will appear in the live feed.`
          : data.error || "Failed to create relay",
        warning: data.warning || undefined,
      });

      // Refresh list
      if (data.success) {
        const listRes = await fetch("/api/webhooks/list");
        setActiveRelays(await listRes.json());
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  const availablePlatforms = WEBHOOK_PLATFORMS.filter((p) => !!connections[p.id]);

  // Detect which platforms already have relays
  const platformsWithRelays = new Set(
    activeRelays.map((r) => {
      const desc = r.description.toLowerCase();
      return WEBHOOK_PLATFORMS.find((p) => desc.includes(p.id))?.id;
    }).filter(Boolean)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg mx-4 glass rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <WebhooksLogo className="w-4 h-4 text-one-yellow" weight="bold" />
            <h2 className="text-base font-semibold text-foreground">Webhook Relay</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" weight="bold" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* LIST VIEW — shows active relays + add new */}
            {view === "list" && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4">

                {/* Active webhooks */}
                {loadingRelays ? (
                  <div className="py-6 text-center">
                    <SpinnerGap className="w-5 h-5 text-one-yellow animate-spin mx-auto" weight="bold" />
                  </div>
                ) : activeRelays.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground px-1">Active webhooks</p>
                    {activeRelays.map((relay) => {
                      const platform = WEBHOOK_PLATFORMS.find((p) => relay.description.toLowerCase().includes(p.id));
                      return (
                        <div key={relay.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 backdrop-blur-sm">
                          {platform && (
                            <Image src={`https://assets.withone.ai/connectors/${platform.slug}.svg`} alt="" width={18} height={18} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{relay.description}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {relay.metadata?.GITHUB_OWNER && `${relay.metadata.GITHUB_OWNER}/${relay.metadata.GITHUB_REPOSITORY} · `}
                              {relay.eventFilters.length} events
                            </p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-badge-green pulse-dot shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-1 py-2 text-center">
                    <WebhooksLogo className="w-6 h-6 text-text-subtle mx-auto mb-2" weight="bold" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">No active webhooks</p>
                    <p className="text-xs text-text-subtle max-w-[280px] mx-auto">
                      Route real-time events from GitHub, Linear, Calendar and more into your activity feed.
                    </p>
                  </div>
                )}

                {/* Add new button */}
                <button
                  onClick={() => setView("platform")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border hover:border-muted-foreground hover:bg-card-hover transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" weight="bold" />
                  <span className="text-sm text-muted-foreground">Add webhook relay</span>
                </button>
              </motion.div>
            )}

            {/* PLATFORM VIEW */}
            {view === "platform" && (
              <motion.div key="platform" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-3">Choose a platform</p>
                {availablePlatforms.length === 0 ? (
                  <p className="text-sm text-text-subtle py-4 text-center">No connected platforms support webhooks.</p>
                ) : (
                  availablePlatforms.map((p) => {
                    const hasRelay = platformsWithRelays.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPlatform(p.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 backdrop-blur-sm transition-colors group"
                      >
                        <Image src={`https://assets.withone.ai/connectors/${p.slug}.svg`} alt={p.name} width={22} height={22} />
                        <span className="text-sm font-medium text-foreground flex-1 text-left">{p.name}</span>
                        {hasRelay && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">active</span>}
                        <CaretRight className="w-4 h-4 text-text-subtle group-hover:text-foreground transition-colors" weight="bold" />
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* EVENTS VIEW */}
            {view === "events" && (() => {
              const filtered = eventSearch
                ? eventTypes.filter((e) => e.toLowerCase().includes(eventSearch.toLowerCase()))
                : eventTypes;
              return (
              <motion.div key="events" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-muted-foreground">Select events ({selectedEvents.length}/{eventTypes.length})</p>
                  <button onClick={handleSelectAll} className="text-[11px] text-[hsl(var(--link))] hover:underline">
                    {selectedEvents.length === eventTypes.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" weight="bold" />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search events..."
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto">
                  {filtered.map((event) => {
                    const selected = selectedEvents.includes(event);
                    return (
                      <button
                        key={event}
                        onClick={() => handleToggleEvent(event)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all ${
                          selected
                            ? "bg-muted/50 backdrop-blur-sm text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-[hsl(var(--badge-green))] shrink-0" weight="bold" />}
                        <span className="truncate">{event}</span>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <p className="col-span-2 text-xs text-text-subtle text-center py-4">No events matching &quot;{eventSearch}&quot;</p>
                  )}
                </div>
              </motion.div>
              );
            })()}

            {/* METADATA VIEW — dynamic dropdowns or manual inputs */}
            {view === "metadata" && (
              <motion.div key="metadata" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-4">
                <p className="text-xs font-medium text-muted-foreground px-1">Configuration</p>

                {loadingContext ? (
                  <div className="py-6 text-center">
                    <SpinnerGap className="w-5 h-5 text-one-yellow animate-spin mx-auto mb-2" weight="bold" />
                    <p className="text-xs text-muted-foreground">Loading configuration...</p>
                  </div>
                ) : dynamicContext?.field && dynamicContext.items.length > 0 ? (
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block px-1">{dynamicContext.label || dynamicContext.field}</label>
                    <div className="space-y-1.5">
                      {dynamicContext.items.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setFormValues((prev) => ({ ...prev, [dynamicContext.field!]: item.value }))}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            formValues[dynamicContext.field!] === item.value
                              ? "bg-muted/50 backdrop-blur-sm text-foreground font-medium border border-[hsl(var(--badge-green))]/20"
                              : "bg-card hover:bg-card-hover border border-border text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {formValues[dynamicContext.field!] === item.value && (
                              <Check className="w-3.5 h-3.5 text-[hsl(var(--badge-green))]" weight="bold" />
                            )}
                            {item.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : dynamicContext?.fields ? (
                  dynamicContext.fields.map((f) => (
                    <div key={f.field}>
                      <label className="text-xs font-medium text-foreground mb-1.5 block px-1">{f.label}</label>
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {f.items.map((item) => (
                          <button
                            key={item.value + item.label}
                            onClick={() => setFormValues((prev) => ({
                              ...prev,
                              [f.field]: item.value,
                              ...(item.extra || {}),
                            }))}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              formValues[f.field] === item.value
                                ? "bg-muted/50 backdrop-blur-sm text-foreground font-medium border border-[hsl(var(--badge-green))]/20"
                                : "bg-card hover:bg-card-hover border border-border text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {formValues[f.field] === item.value && (
                                <Check className="w-3.5 h-3.5 text-[hsl(var(--badge-green))]" weight="bold" />
                              )}
                              {item.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  formData.map((field) => (
                    <div key={field.name}>
                      <label className="text-xs font-medium text-foreground mb-1.5 block px-1">{field.label}</label>
                      <input
                        type={field.type === "password" ? "password" : "text"}
                        placeholder={field.placeholder}
                        value={formValues[field.name] || ""}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-ring/50"
                      />
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* CREATING VIEW */}
            {view === "creating" && (
              <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
                {creating ? (
                  <div className="flex flex-col items-center gap-3">
                    <SpinnerGap className="w-8 h-8 text-one-yellow animate-spin" weight="bold" />
                    <p className="text-sm text-muted-foreground">Setting up webhook relay...</p>
                  </div>
                ) : result ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.success && !result.warning ? "bg-[hsl(var(--status-badge-green))]" : result.success && result.warning ? "bg-warning/10" : "bg-destructive/10"}`}>
                      {result.success && !result.warning ? (
                        <Check className="w-6 h-6 text-[hsl(var(--status-badge-green-foreground))]" weight="bold" />
                      ) : result.success && result.warning ? (
                        <Check className="w-6 h-6 text-warning-foreground" weight="bold" />
                      ) : (
                        <X className="w-6 h-6 text-destructive" weight="bold" />
                      )}
                    </div>
                    <p className="text-sm text-foreground">{result.message}</p>
                    {result.warning && (
                      <div className="mt-1 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-left max-w-sm">
                        <p className="text-xs font-medium text-warning-foreground mb-1">Warning</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{result.warning}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {view === "list" ? null : view === "creating" && !creating ? (
          <div className="px-6 py-4 border-t border-border flex justify-end">
            <button onClick={() => { setView("list"); setResult(null); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-all">
              Done
            </button>
          </div>
        ) : view !== "creating" ? (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setView(view === "metadata" ? "events" : view === "events" ? "platform" : "list")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={view === "events" && selectedEvents.length === 0}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover disabled:opacity-30 transition-all"
            >
              {view === "events" && formData.length > 0 ? "Next" : "Create Relay"}
            </button>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
