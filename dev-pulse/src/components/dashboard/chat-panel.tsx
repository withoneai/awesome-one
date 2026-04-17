"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  PaperPlaneTilt, SpinnerGap, Sparkle, Check, X,
  Lightning, Trash, CaretRight, Timer
} from "@phosphor-icons/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

// ── Types ──

interface ToolStep {
  tool: string;
  status: "running" | "done" | "error";
  platform?: string;
  result?: unknown;
  input?: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolSteps?: ToolStep[];
  timestamp: number;
}

interface ActionGroup {
  platform: string;
  summary: string;
  knowledgeChips: { title: string; platform: string }[];
  result: unknown;
  status: "done" | "error";
}

// ── Helpers ──

function extractPlatform(args: Record<string, unknown>): string | undefined {
  return (args?.platform as string) || undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractKnowledgeTitle(result: any): string | null {
  const text = result?.content?.[0]?.text || (typeof result === "string" ? result : "");
  if (!text) return null;
  const match = text.match(/^#\s*(?:Action:\s*)?\n*(.+)/m);
  return match?.[1]?.trim() || null;
}

function extractSearchQuery(input?: Record<string, unknown>): string | null {
  if (!input) return null;
  return (input.searchQuery || input.query || input.search || input.intent || input.q) as string || null;
}

// Check if execute succeeded (we skip failures and noisy "Completed" cases — but most succeed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExecuteSuccess(result: any): boolean {
  if (!result) return false;
  try {
    const text = result?.content?.[0]?.text || "";
    if (!text) return false;
    // MCP error responses contain "MCP error" or "Failed to execute"
    if (text.startsWith("MCP error") || text.includes("Failed to execute")) return false;
    return true;
  } catch { return false; }
}

// Build readable lines from tool steps for the thinking block
interface ThinkingLine {
  text: string;
  platform?: string;
  type: "search" | "knowledge" | "execute";
}

function buildThinkingLines(steps: ToolStep[]): ThinkingLine[] {
  const lines: ThinkingLine[] = [];

  for (const step of steps) {
    if (step.tool === "list_one_integrations") continue;
    if (step.status === "running") continue; // running step shown in trigger

    if (step.tool === "search_one_platform_actions" && step.status === "done") {
      const query = extractSearchQuery(step.input);
      lines.push({
        text: query ? `Searching "${query}"` : "Searching actions",
        platform: step.platform,
        type: "search",
      });
    }

    if (step.tool === "get_one_action_knowledge" && step.status === "done") {
      const title = extractKnowledgeTitle(step.result);
      lines.push({
        text: title ? `Read ${title}` : "Read API docs",
        platform: step.platform,
        type: "knowledge",
      });
    }
  }

  return lines;
}

function groupToolSteps(steps: ToolStep[]): ActionGroup[] {
  // Map actionId → title from knowledge steps
  const titleByActionId: Record<string, string> = {};

  // First pass: collect all knowledge titles keyed by the actionId they loaded
  for (const step of steps) {
    if (step.tool === "get_one_action_knowledge" && step.status === "done" && step.result) {
      const title = extractKnowledgeTitle(step.result);
      const actionId = step.input?.actionId as string;
      if (title && actionId) {
        titleByActionId[actionId] = title;
      }
    }
  }

  // Second pass: group execute attempts by actionId
  type Attempt = { result: unknown; success: boolean };
  const attemptsByActionId: Record<string, Attempt[]> = {};
  const metaByActionId: Record<string, { platform: string; title: string }> = {};
  const actionOrder: string[] = [];

  for (const step of steps) {
    if (step.tool !== "execute_one_action") continue;
    if (step.status === "running") continue;

    const actionId = step.input?.actionId as string;
    if (!actionId) continue;

    const platform = step.platform || "unknown";
    const title = titleByActionId[actionId];
    if (!title) continue; // skip executes with no knowledge title (plumbing calls)

    if (!attemptsByActionId[actionId]) {
      attemptsByActionId[actionId] = [];
      metaByActionId[actionId] = { platform, title };
      actionOrder.push(actionId);
    }

    attemptsByActionId[actionId].push({
      result: step.result,
      success: step.status !== "error" && isExecuteSuccess(step.result),
    });
  }

  // For each action: prefer the latest success, otherwise show the latest failure
  const actions: ActionGroup[] = [];
  for (const actionId of actionOrder) {
    const attempts = attemptsByActionId[actionId];
    const meta = metaByActionId[actionId];

    const latestSuccess = [...attempts].reverse().find((a) => a.success);
    const chosen = latestSuccess || attempts[attempts.length - 1];

    actions.push({
      platform: meta.platform,
      summary: meta.title,
      knowledgeChips: [],
      result: chosen.result,
      status: chosen.success ? "done" : "error",
    });
  }

  return actions;
}

// ── Subcomponents ──

const SYNTAX_HIGHLIGHT_LIMIT = 5_000;

function ResponseDataBlock({ result }: { result: unknown }) {
  const { resolvedTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = result as any;
  const text = output?.content?.[0]?.text || "";
  let responseData = null;
  try {
    const parsed = typeof text === "string" ? JSON.parse(text) : text;
    responseData = parsed?.responseData?.data || parsed?.responseData || parsed;
  } catch {
    responseData = output?.responseData || output;
  }

  const jsonString = useMemo(() => {
    if (!responseData) return "";
    return typeof responseData === "string" ? responseData : JSON.stringify(responseData, null, 2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!jsonString) return null;
  const syntaxStyle = resolvedTheme === "dark" ? oneDark : oneLight;
  const isLarge = jsonString.length > SYNTAX_HIGHLIGHT_LIMIT;

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">Response</div>
      <div className="max-h-48 overflow-auto rounded-lg border border-border">
        {isLarge ? (
          <pre className="overflow-hidden font-mono text-xs p-3" style={{ background: "transparent" }}>
            <code className="font-mono text-xs">{jsonString}</code>
          </pre>
        ) : (
          <SyntaxHighlighter
            language="json"
            style={syntaxStyle}
            customStyle={{ margin: 0, padding: "0.75rem", fontSize: "0.75rem", background: "transparent" }}
            codeTagProps={{ className: "font-mono text-xs" }}
          >
            {jsonString}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}

// ── Thinking Block (Reasoning + Task hybrid) ──

function ThinkingBlock({ steps, isStreaming, duration }: {
  steps: ToolStep[];
  isStreaming: boolean;
  duration?: number;
}) {
  const [open, setOpen] = useState(isStreaming);

  useEffect(() => {
    setOpen(isStreaming);
  }, [isStreaming]);

  const lines = buildThinkingLines(steps);
  const runningStep = [...steps].reverse().find(s => s.status === "running");

  // Dynamic trigger label based on current activity
  let triggerLabel = "Thinking...";
  if (!isStreaming) {
    triggerLabel = duration ? `Thought for ${duration}s` : "Thinking";
  } else if (runningStep) {
    switch (runningStep.tool) {
      case "search_one_platform_actions": triggerLabel = "Searching..."; break;
      case "get_one_action_knowledge": triggerLabel = "Reading API docs..."; break;
      case "execute_one_action": triggerLabel = "Executing..."; break;
      default: triggerLabel = "Thinking...";
    }
  }

  if (!isStreaming && lines.length === 0) return null;

  return (
    <div>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1 w-full text-left"
      >
        <CaretRight
          className={`w-3 h-3 text-muted-foreground transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          weight="bold"
        />
        {isStreaming ? (
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-one-yellow animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-one-yellow animate-bounce" style={{ animationDelay: "100ms" }} />
            <span className="w-1 h-1 rounded-full bg-one-yellow animate-bounce" style={{ animationDelay: "200ms" }} />
          </div>
        ) : (
          <Timer className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
        )}
        <span className="text-xs text-muted-foreground">{triggerLabel}</span>
      </button>

      {/* Content — task-style line items */}
      <AnimatePresence>
        {open && lines.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-[7px] pl-3.5 border-l border-border/60 py-1 space-y-0.5">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-2 py-[3px]">
                  <span className="text-xs text-muted-foreground">{line.text}</span>
                  {line.platform && (
                    <Image
                      src={`https://assets.withone.ai/connectors/${line.platform}.svg`}
                      alt=""
                      width={13}
                      height={13}
                      className="shrink-0 opacity-60"
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Action Card ──

function ActionCard({ action }: { action: ActionGroup }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-card-hover cursor-pointer"
      >
        <Lightning className="w-4 h-4 text-muted-foreground shrink-0" weight="bold" />

        {action.platform !== "unknown" && (
          <Image
            src={`https://assets.withone.ai/connectors/${action.platform}.svg`}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
        )}

        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {action.summary}
        </span>

        {action.status === "error" ? (
          <X className="w-3 h-3 text-destructive shrink-0" weight="bold" />
        ) : (
          <Check className="w-3 h-3 text-[hsl(var(--badge-green))] shrink-0" weight="bold" />
        )}

        <CaretRight
          className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}
          weight="bold"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 py-2.5 space-y-3">
              {action.knowledgeChips.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Knowledge</div>
                  <div className="flex flex-wrap gap-1.5">
                    {action.knowledgeChips.map((chip, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-[14px] bg-badge-blue/10 px-2 py-0.5 text-[11px] font-medium text-badge-blue-foreground ring-1 ring-inset ring-badge-blue/15"
                      >
                        <Image src={`https://assets.withone.ai/connectors/${chip.platform}.svg`} alt="" width={12} height={12} />
                        {chip.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <ResponseDataBlock result={action.result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ──

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<ToolStep[]>([]);
  const [thinkingDuration, setThinkingDuration] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamStartRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((rows) => {
        const loaded = rows.map((r: { id: string; role: string; content: string; tool_steps: string | null; timestamp: number }) => ({
          id: r.id,
          role: r.role,
          content: r.content,
          toolSteps: r.tool_steps ? JSON.parse(r.tool_steps) : undefined,
          timestamp: r.timestamp,
        }));
        setMessages(loaded);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSteps]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setThinkingDuration(undefined);
    streamStartRef.current = null;

    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userMsg.id, role: userMsg.role, content: userMsg.content, tool_steps: null, timestamp: userMsg.timestamp }),
    }).catch(() => {});
    setCurrentSteps([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";
      const steps: ToolStep[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine.slice(6));

            if (data.type === "text-delta") {
              fullText += data.delta;
            } else if (data.type === "tool-input-available") {
              if (!streamStartRef.current) streamStartRef.current = Date.now();
              steps.push({
                tool: data.toolName,
                status: "running",
                platform: extractPlatform(data.input || {}),
                input: data.input,
              });
              setCurrentSteps([...steps]);
            } else if (data.type === "tool-output-available") {
              const lastRunning = [...steps].reverse().find((s) => s.status === "running");
              if (lastRunning) {
                lastRunning.status = "done";
                lastRunning.result = data.output;
                setCurrentSteps([...steps]);
              }
            }
          } catch { /* ignore */ }
        }
      }

      // Compute thinking duration
      if (streamStartRef.current) {
        setThinkingDuration(Math.round((Date.now() - streamStartRef.current) / 1000));
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullText,
        toolSteps: steps,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assistantMsg.id,
          role: assistantMsg.role,
          content: assistantMsg.content,
          tool_steps: JSON.stringify(assistantMsg.toolSteps),
          timestamp: assistantMsg.timestamp,
        }),
      }).catch(() => {});
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`, timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
      setCurrentSteps([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
    fetch("/api/messages", { method: "DELETE" }).catch(() => {});
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-one-yellow" weight="fill" />
          <span className="text-sm font-semibold text-foreground">Command Center</span>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Clear chat">
            <Trash className="w-3.5 h-3.5" weight="bold" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkle className="w-8 h-8 text-one-yellow/30 mb-3" weight="fill" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Take actions across your platforms</p>
            <p className="text-xs text-text-subtle max-w-[280px] mb-6">
              Create Linear issues, send Slack messages, schedule meetings, open GitHub issues.
            </p>
            <div className="space-y-2 w-full max-w-[300px]">
              {[
                { text: "Create a bug in Linear and block time on my calendar to fix it", icons: ["linear", "google-calendar"] },
                { text: "Open a GitHub issue and a Linear task for webhook retry logic", icons: ["github", "linear"] },
                { text: "Message #engineering: deploy going out in 10 min", icons: ["slack"] },
                { text: "Block 2h on my calendar for deep work tomorrow", icons: ["google-calendar"] },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card hover:bg-card-hover border border-border text-left transition-colors text-xs text-muted-foreground hover:text-foreground"
                >
                  <div className="flex -space-x-1 shrink-0">
                    {s.icons.map((icon, j) => (
                      <Image key={j} src={`https://assets.withone.ai/connectors/${icon}.svg`} alt="" width={14} height={14} className="opacity-50" />
                    ))}
                  </div>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]">
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {msg.toolSteps && msg.toolSteps.length > 0 && (
                  <>
                    <ThinkingBlock steps={msg.toolSteps} isStreaming={false} />
                    <div className="space-y-1.5">
                      {groupToolSteps(msg.toolSteps).map((action, i) => (
                        <ActionCard key={i} action={action} />
                      ))}
                    </div>
                  </>
                )}

                {msg.content?.trim() && (
                  <div className="text-sm text-foreground/90 leading-relaxed px-1 prose prose-sm prose-invert max-w-none [&_p]:mb-1.5 [&_ul]:mt-1 [&_ul]:mb-1.5 [&_li]:mb-0.5 [&_strong]:text-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Live streaming */}
        {loading && (
          <ThinkingBlock
            steps={currentSteps}
            isStreaming={true}
            duration={thinkingDuration}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an action or reply..."
            rows={2}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-text-subtle resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary-hover transition-all"
          >
            {loading ? <SpinnerGap className="w-4 h-4 animate-spin" weight="bold" /> : <PaperPlaneTilt className="w-4 h-4" weight="bold" />}
          </button>
        </form>
      </div>
    </div>
  );
}
