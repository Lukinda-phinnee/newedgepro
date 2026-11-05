"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowUp, RotateCcw, Bot, User, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const suggestedPrompts = [
  "Review my risk boundaries for today",
  "How should I handle high-impact news?",
  "Draft an entry checklist for this session",
];

interface PlanAiSidebarProps {
  className?: string;
}

export function PlanAiSidebar({ className }: PlanAiSidebarProps) {
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

  const handleSend = (textToSend?: string) => {
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

    // Simulated response UI demonstration before backend AI configuration
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I received your message: "${content}". Once the AI engine is configured, real-time contextual plan insights and risk audits will be generated here.`,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsResponding(false);
    }, 1000);
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

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full w-full lg:w-80 xl:w-96 shrink-0 rounded-2xl border border-border/70 bg-card p-4 shadow-xs overflow-hidden",
        className
      )}
    >
      {/* Subtle Apple Intelligence ambient iridescent glow within card */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 size-48 rounded-full bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-fuchsia-500/10 blur-3xl opacity-70 -z-10"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70 shrink-0">
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
            AI
          </span>
        </div>
      </div>

      {/* Messages Stream & Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 pr-1 text-xs overscroll-contain">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="size-9 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2.5">
              <Sparkles size={18} />
            </div>
            <p className="text-xs font-medium text-foreground">Plan Intelligence</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[220px] leading-relaxed">
              Ask questions about your setups, risk rules, or session game plan.
            </p>

            {/* Quick Starter Suggestions */}
            <div className="mt-5 w-full space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider block mb-1">
                Suggested Prompts
              </span>
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left p-2 rounded-xl border border-border/60 hover:border-violet-500/40 bg-muted/20 hover:bg-muted/40 text-[11px] text-muted-foreground hover:text-foreground transition-all cursor-pointer leading-tight"
                >
                  {prompt}
                </button>
              ))}
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
                    <div className="relative p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed bg-violet-600 text-white font-normal rounded-tr-xs shadow-xs select-text">
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                );
              }

              // AI response: full width plain text without a bubble
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

                  <div className="w-full text-xs leading-relaxed text-foreground select-text whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              );
            })}

            {/* Responding / Thinking State - Full width, no bubble */}
            {isResponding && (
              <div className="w-full flex flex-col items-start gap-1 py-1">
                <div className="flex items-center gap-1 text-[10px] text-violet-400 font-medium">
                  <Sparkles size={10} className="animate-spin" /> Copilot is thinking...
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

      {/* Floating Prompt Input Bar */}
      <div className="pt-3 border-t border-border/70 mt-auto shrink-0">
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
            placeholder="Ask Copilot... (Enter to send)"
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
        <span className="text-[9px] text-muted-foreground/50 block text-center mt-1.5 font-mono">
          Shift+Enter for newline
        </span>
      </div>
    </aside>
  );
}
