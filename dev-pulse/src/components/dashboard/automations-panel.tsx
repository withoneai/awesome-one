"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Lightning, Plus, Trash, ToggleLeft, ToggleRight,
  X, SpinnerGap, PaperPlaneTilt
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface Automation {
  id: number;
  trigger_platform: string;
  trigger_event: string;
  action_prompt: string;
  enabled: number;
  created_at: string;
}

const PLATFORM_NAMES: Record<string, string> = {
  github: "GitHub",
  linear: "Linear",
  "google-calendar": "Google Calendar",
  slack: "Slack",
};

// Templates with pre-defined triggers — no LLM parsing needed
const TEMPLATES = [
  {
    trigger_platform: "github",
    trigger_event: "issues.opened",
    action_prompt: "Create a matching Linear ticket with the same title and description",
    label: "GitHub → Linear",
    text: "When a GitHub issue is opened, create a matching Linear ticket",
    icons: ["github", "linear"],
  },
  {
    trigger_platform: "github",
    trigger_event: "pull_request.closed",
    action_prompt: "Send a message to #engineering on Slack saying the PR was merged with the PR title and link",
    label: "GitHub → Slack",
    text: "When a PR is merged on GitHub, notify #engineering on Slack",
    icons: ["github", "slack"],
  },
  {
    trigger_platform: "linear",
    trigger_event: "Issue.update",
    action_prompt: "Check the Linear issue payload. If the issue's state name is 'Done' or 'Completed', post a celebration message on #general in Slack with the issue title and a 🎉 emoji. Otherwise, do nothing.",
    label: "Linear → Slack",
    text: "When a Linear issue is marked done, post a celebration message on Slack",
    icons: ["linear", "slack"],
  },
  {
    trigger_platform: "github",
    trigger_event: "issues.opened",
    action_prompt: "Send a message to #engineering on Slack with the issue title, body, and link",
    label: "GitHub → Slack",
    text: "When a GitHub issue is opened, notify #engineering on Slack",
    icons: ["github", "slack"],
  },
  {
    trigger_platform: "github",
    trigger_event: "pull_request.opened",
    action_prompt: "Create a Linear task to review the PR with the PR title and link",
    label: "GitHub → Linear",
    text: "When a PR is opened, create a Linear task to review it",
    icons: ["github", "linear"],
  },
];

interface AutomationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AutomationsPanel({ open, onClose }: AutomationsPanelProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "custom">("list");
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<{
    trigger_platform: string;
    trigger_event: string;
    action_prompt: string;
    summary: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/automations")
      .then((r) => r.json())
      .then(setAutomations)
      .catch(() => setAutomations([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setView("list");
      setInput("");
      setParsed(null);
    }
  }, [open]);

  // Save a template directly — no LLM parsing needed
  const handleSaveTemplate = async (template: typeof TEMPLATES[0]) => {
    setSaving(true);
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger_platform: template.trigger_platform,
        trigger_event: template.trigger_event,
        action_prompt: template.action_prompt,
      }),
    });
    const res = await fetch("/api/automations");
    setAutomations(await res.json());
    setSaving(false);
  };

  // Parse custom natural language input via LLM
  const handleParseCustom = async () => {
    if (!input.trim()) return;
    setParsing(true);
    setParsed(null);
    try {
      const res = await fetch("/api/automations/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input.trim() }),
      });
      const data = await res.json();
      if (data.trigger_platform) setParsed(data);
    } catch { /* ignore */ }
    finally { setParsing(false); }
  };

  const handleSaveCustom = async () => {
    if (!parsed) return;
    setSaving(true);
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger_platform: parsed.trigger_platform,
        trigger_event: parsed.trigger_event,
        action_prompt: parsed.action_prompt,
      }),
    });
    const res = await fetch("/api/automations");
    setAutomations(await res.json());
    setView("list");
    setInput("");
    setParsed(null);
    setSaving(false);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: enabled ? 1 : 0 } : a))
    );
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleParseCustom();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg mx-4 glass rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Lightning className="w-4 h-4 text-one-yellow" weight="fill" />
            <h2 className="text-base font-semibold text-foreground">Automations</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" weight="bold" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-6 text-center">
              <SpinnerGap className="w-5 h-5 text-one-yellow animate-spin mx-auto" weight="bold" />
            </div>
          ) : view === "list" ? (
            <>
              {/* Active automations */}
              {automations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-text-subtle uppercase tracking-wider px-1">Active</p>
                  {automations.map((auto) => (
                    <div key={auto.id} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-muted/30 backdrop-blur-sm">
                      <Image
                        src={`https://assets.withone.ai/connectors/${auto.trigger_platform}.svg`}
                        alt=""
                        width={18}
                        height={18}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">{auto.action_prompt}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {PLATFORM_NAMES[auto.trigger_platform] || auto.trigger_platform} · {auto.trigger_event}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleToggle(auto.id, !auto.enabled)} className="p-1 transition-colors">
                          {auto.enabled ? (
                            <ToggleRight className="w-7 h-7 text-badge-green" weight="fill" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-text-subtle" weight="bold" />
                          )}
                        </button>
                        <button onClick={() => handleDelete(auto.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash className="w-4 h-4" weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Templates — click to save directly */}
              <div className="space-y-2">
                {automations.length === 0 && (
                  <div className="py-3 text-center">
                    <Lightning className="w-6 h-6 text-text-subtle mx-auto mb-2" weight="bold" />
                    <p className="text-sm text-muted-foreground">No automations yet</p>
                    <p className="text-xs text-text-subtle mt-1">Pick a template or write your own</p>
                  </div>
                )}

                <p className="text-[10px] text-text-subtle uppercase tracking-wider px-1">Templates</p>
                {TEMPLATES.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => handleSaveTemplate(template)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card hover:bg-card-hover border border-border text-left transition-colors group disabled:opacity-50"
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      {template.icons.map((icon, j) => (
                        <Image
                          key={j}
                          src={`https://assets.withone.ai/connectors/${icon}.svg`}
                          alt=""
                          width={16}
                          height={16}
                          className="rounded-full bg-card border border-border opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-one-yellow uppercase tracking-wider">{template.label}</span>
                      <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 mt-0.5">{template.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Custom automation — natural language input */
            <div className="space-y-3">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider px-1">Describe your automation</p>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setParsed(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder='e.g., "When a PR is merged, send a Slack message to #deploys"'
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-text-subtle resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring/50"
                  autoFocus
                />
                <button
                  onClick={handleParseCustom}
                  disabled={parsing || !input.trim()}
                  className="absolute right-2 bottom-2 p-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-30 transition-all"
                >
                  {parsing ? (
                    <SpinnerGap className="w-3.5 h-3.5 animate-spin" weight="bold" />
                  ) : (
                    <PaperPlaneTilt className="w-3.5 h-3.5" weight="bold" />
                  )}
                </button>
              </div>

              {/* Parsed preview */}
              {parsed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-lg bg-muted/30 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-2">
                    <Image
                      src={`https://assets.withone.ai/connectors/${parsed.trigger_platform}.svg`}
                      alt=""
                      width={16}
                      height={16}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm text-foreground">{parsed.summary}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {PLATFORM_NAMES[parsed.trigger_platform]} · {parsed.trigger_event}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {view === "custom" ? (
            <>
              <button
                onClick={() => { setView("list"); setInput(""); setParsed(null); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
              {parsed && (
                <button
                  onClick={handleSaveCustom}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover disabled:opacity-30 transition-all"
                >
                  {saving ? "Saving..." : "Save Automation"}
                </button>
              )}
            </>
          ) : (
            <>
              <span />
              <button
                onClick={() => setView("custom")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-all"
              >
                <Plus className="w-3.5 h-3.5" weight="bold" />
                Custom Automation
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
