"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ArrowUp,
  RotateCcw,
  Check,
  Copy,
  FileText,
  Clock,
  Cpu,
  Target,
  ArrowRight,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Code as CodeIcon,
  List as ListIcon,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradingPlanItem } from "@/components/plan/plan-sidebar";
import { RichChatMessage } from "@/components/plan/rich-chat-message";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  createdPlan?: TradingPlanItem;
}

const frameworkPrompts = [
  {
    icon: Clock,
    label: "5-Min Time Blocks",
    prompt: "Structure my trading session into 5-minute time-blocked intervals from pre-market to hard cutoff.",
  },
  {
    icon: Cpu,
    label: "5-Step Algorithm",
    prompt: "Apply the 5-Step Engineering Algorithm to optimize my entry rules and eliminate indicator clutter.",
  },
  {
    icon: Target,
    label: "First Principles",
    prompt: "Deconstruct today's trade thesis to first principles: liquidity pools, trapped traders, and R:R math.",
  },
];

interface PlanAiSidebarProps {
  activePlan?: TradingPlanItem;
  onPlanCreated?: (plan: TradingPlanItem) => void;
  className?: string;
}

export function PlanAiSidebar({ activePlan, onPlanCreated, className }: PlanAiSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isResponding]);

  const handleSend = async (textToSend?: string, mode: "chat" | "create_plan" = "chat") => {
    const content = (textToSend ?? input).trim();
    if (!content || isResponding) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsResponding(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/plans/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          planTitle: activePlan?.title,
          planContent: activePlan?.content,
          sessionTag: activePlan?.sessionTag,
          mode,
          conversationHistory: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Copilot response failed");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I have analyzed your request.",
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdPlan: data.createdPlan || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If a plan was created, immediately sync to parent state
      if (data.createdPlan && onPlanCreated) {
        onPlanCreated(data.createdPlan);
      }
    } catch (err) {
      console.error("Copilot request error:", err);
      const errorMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "I encountered an issue processing your request. Please check your connection or API key and try again.",
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsResponding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = input.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const updated = input.substring(0, start) + replacement + input.substring(end);
    setInput(updated);
    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + (selected ? selected.length : 4);
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const copyMessage = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleClearChat = () => {
    if (isResponding) return;
    setMessages([]);
  };

  const handleGenerateFullPlanDoc = () => {
    const prompt = `Please engineer and create a full trading plan document for my ${
      activePlan?.sessionTag || "NY AM"
    } session. Synthesize our conversation and enforce 5-minute time blocking, the 5-step engineering algorithm, and first principles strategy.`;
    void handleSend(prompt, "create_plan");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full w-full lg:w-80 xl:w-96 shrink-0 rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs overflow-hidden",
        className
      )}
    >
      {/* Apple Intelligence ambient iridescent glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 size-48 rounded-full bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-fuchsia-500/10 blur-3xl opacity-70 -z-10"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Sparkles size={13} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-foreground">
              Plan Copilot
            </span>
            <span
              className={cn(
                "size-1.5 rounded-full transition-colors",
                isResponding ? "bg-violet-400 animate-ping" : "bg-emerald-400/80 animate-pulse"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isResponding}
              title="Clear conversation"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/70">
            Groq AI
          </span>
        </div>
      </div>

      {/* Quick Action: Generate Full Plan Document Banner */}
      <div className="pt-2 pb-1 shrink-0">
        <button
          type="button"
          onClick={handleGenerateFullPlanDoc}
          disabled={isResponding}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 transition-all cursor-pointer shadow-2xs group disabled:opacity-50"
          title="Create a complete plan doc with Time Blocking, 5-Step Algorithm & First Principles"
        >
          <div className="flex items-center gap-1.5 text-left">
            <Sparkles size={12} className="text-violet-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-semibold tracking-tight">Generate Full Plan Doc</span>
          </div>
          <ArrowRight size={12} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Messages Stream & Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-3 pr-1 text-xs overscroll-contain">
        {messages.length === 0 ? (
          /* Empty State: Mentor introduction & 3 framework cards */
          <div className="h-full flex flex-col items-center justify-center p-3 text-center">
            <div className="size-9 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2">
              <Sparkles size={17} />
            </div>
            <p className="text-xs font-semibold text-foreground">Your Plan Mentor</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 max-w-[240px] leading-relaxed">
              Hey! What session are we prepping for? Chat with me about your setups or generate a full disciplined plan doc.
            </p>

            {/* Framework Action Buttons */}
            <div className="mt-3.5 w-full space-y-1.5 text-left">
              <span className="text-[9px] uppercase font-semibold text-muted-foreground/60 tracking-wider block px-1">
                Core Philosophies
              </span>
              {frameworkPrompts.map((fp) => {
                const Icon = fp.icon;
                return (
                  <button
                    key={fp.label}
                    type="button"
                    onClick={() => handleSend(fp.prompt)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:border-violet-500/40 bg-muted/20 hover:bg-muted/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="size-5 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
                      <Icon size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground group-hover:text-violet-300 truncate">
                        {fp.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 truncate leading-tight">
                        {fp.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          <>
            {messages.map((message) => {
              const isUser = message.role === "user";

              if (isUser) {
                return (
                  <div key={message.id} className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground/60">
                      <span>You</span>
                      <span>•</span>
                      <span className="font-mono">{message.createdAt}</span>
                    </div>
                    <div className="relative p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed bg-violet-600 text-white font-normal rounded-tr-xs shadow-xs select-text">
                      <RichChatMessage content={message.content} isUser />
                    </div>
                  </div>
                );
              }

              // AI response with Rich Text
              return (
                <div key={message.id} className="group w-full flex flex-col gap-1.5 py-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                    <span className="flex items-center gap-1 text-violet-400 font-medium">
                      <Sparkles size={11} /> Copilot
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">{message.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => copyMessage(message.id, message.content)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Copy response"
                      >
                        {copiedId === message.id ? (
                          <Check size={11} className="text-emerald-400" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Rich Text Rendered Content */}
                  <RichChatMessage content={message.content} />

                  {/* Render Created Plan Card if this message created a DB plan */}
                  {message.createdPlan && (
                    <div className="mt-2 p-3 rounded-xl border border-violet-500/35 bg-violet-500/10 backdrop-blur-xs flex flex-col gap-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                            <Check size={11} />
                          </span>
                          <span className="text-[11px] font-semibold text-violet-200">
                            Saved to Database
                          </span>
                        </div>
                        <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-mono text-violet-300 uppercase">
                          {message.createdPlan.sessionTag}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-semibold text-foreground">
                          {message.createdPlan.title}
                        </h5>
                        {message.createdPlan.summary && (
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-0.5 leading-tight">
                            {message.createdPlan.summary}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onPlanCreated?.(message.createdPlan!)}
                        className="mt-0.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>Open &amp; Edit Plan Document</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Responding / Thinking State */}
            {isResponding && (
              <div className="w-full flex flex-col items-start gap-1 py-1">
                <div className="flex items-center gap-1 text-[10px] text-violet-400 font-medium">
                  <Sparkles size={10} className="animate-spin" /> Copilot is typing...
                </div>
                <div className="flex items-center gap-1.5 py-1 text-muted-foreground/60">
                  <span className="size-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-fuchsia-400 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Floating Prompt Input Bar with Rich Text Formatting Toolbar */}
      <div className="pt-2 border-t border-border/70 mt-auto shrink-0 flex flex-col gap-1.5">
        {/* Quick formatting ribbon */}
        <div className="flex items-center justify-between px-1 text-muted-foreground">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Bold (**text**)"
            >
              <BoldIcon size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Italic (*text*)"
            >
              <ItalicIcon size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("`", "`")}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Inline Code (`code`)"
            >
              <CodeIcon size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("• ")}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Bullet list (• )"
            >
              <ListIcon size={12} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("- [ ] ")}
              className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Checklist task (- [ ] )"
            >
              <CheckSquare size={12} />
            </button>
          </div>

          {/* Quick asset tags */}
          <div className="flex items-center gap-1">
            {["NQ", "ES", "EUR/USD"].map((ticker) => (
              <button
                key={ticker}
                type="button"
                onClick={() => insertFormatting(`${ticker} `)}
                className="px-1.5 py-0.5 rounded bg-muted/40 hover:bg-violet-500/20 hover:text-violet-300 text-[10px] font-mono text-muted-foreground transition-colors cursor-pointer"
                title={`Insert ${ticker}`}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end rounded-xl border border-border/70 bg-muted/30 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all p-1"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            disabled={isResponding}
            placeholder="Chat with mentor or format setups..."
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden max-h-28 overflow-y-auto leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isResponding}
            className="size-7 rounded-lg shrink-0 flex items-center justify-center bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 transition-all cursor-pointer mb-0.5 mr-0.5 shadow-2xs"
            title="Send message"
          >
            <ArrowUp size={14} />
          </button>
        </form>

        <div className="flex items-center justify-between text-[9px] text-muted-foreground/50 px-1 font-mono">
          <span>Shift+Enter for newline</span>
          <span>Markdown &amp; Rich Text Enabled</span>
        </div>
      </div>
    </aside>
  );
}
