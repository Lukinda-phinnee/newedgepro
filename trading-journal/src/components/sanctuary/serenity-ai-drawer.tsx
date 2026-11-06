"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Heart,
  Wind,
  ShieldAlert,
  Loader2,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichChatMessage } from "@/components/plan/rich-chat-message";

interface SerenityAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMeditation?: (title: string, durationMin: number) => void;
}

interface SerenityMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const QUICK_PROMPTS = [
  { label: "Red trade / Tilt reset", prompt: "I just took an unexpected loss and I'm feeling angry and tilted. Help me reset before I do something reckless." },
  { label: "FOMO & Anxiety", prompt: "I missed the initial market expansion and I feel intense FOMO urging me to chase. Help me center myself." },
  { label: "Box Breathing 4-4-4-4", prompt: "Guide me through a 3-minute box breathing somatic sequence to lower my cortisol." },
  { label: "Detaching from PnL", prompt: "How do I detach my personal self-worth and mood from today's monetary results?" },
];

export function SerenityAiDrawer({
  isOpen,
  onClose,
  onStartMeditation,
}: SerenityAiDrawerProps) {
  const [messages, setMessages] = useState<SerenityMessage[]>([
    {
      id: "serenity-welcome",
      role: "assistant",
      content: `Welcome to your quiet space. I'm **Serenity**, your mindfulness companion and mental equilibrium coach.

Trading places immense pressure on your nervous system. Whether you're navigating post-loss tilt, market-induced anxiety, or simply need to center yourself before the bell rings, I am here with you.

How does your mind and body feel right now?`,
      createdAt: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    const userMessage: SerenityMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      createdAt: "Just now",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/sanctuary/serenity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: historyPayload,
        }),
      });

      if (!res.ok) throw new Error("Failed to contact Serenity AI");
      const data = await res.json();

      const assistantMessage: SerenityMessage = {
        id: `serenity-${Date.now()}`,
        role: "assistant",
        content: data.response || "Take a deep breath and let all tension dissolve.",
        createdAt: "Just now",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Serenity AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `serenity-err-${Date.now()}`,
          role: "assistant",
          content:
            "Take a gentle breath with me right now. Release your shoulders, unclench your jaw, and give yourself permission to step away from the screen for 10 minutes. Your edge will be waiting when you return with a calm mind.",
          createdAt: "Just now",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-[#17221b] border-l border-white/10 text-[#f3f0ea] shadow-2xl flex flex-col overflow-hidden">
        {/* Serene Ambient Background Aura */}
        <div className="absolute top-0 right-0 size-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#141d17]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight font-serif text-white">
                Serenity AI
              </h3>
              <p className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Mindfulness & Nervous System Coach
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="relative px-3 py-2 border-b border-white/5 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => void handleSend(item.prompt)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-emerald-500/20 text-white/80 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="relative flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1 max-w-[90%]",
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs"
                    : "bg-white/5 border border-white/10 text-white/90 rounded-tl-xs"
                )}
              >
                <RichChatMessage
                  content={msg.content}
                  isUser={msg.role === "user"}
                />
              </div>
              <span className="text-[9px] text-white/40 font-mono px-1">
                {msg.createdAt}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400/80 p-2">
              <Loader2 size={14} className="animate-spin" />
              <span>Serenity is grounding thoughts...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Interactive Breathing Quick Action Card */}
        {onStartMeditation && (
          <div className="px-4 py-2 border-t border-white/10 bg-emerald-950/20 shrink-0 flex items-center justify-between text-xs">
            <span className="text-white/70 flex items-center gap-1.5 text-[11px]">
              <Wind size={13} className="text-emerald-400" /> Need instant calm?
            </span>
            <button
              type="button"
              onClick={() => onStartMeditation("Somatic Breathwork Reset", 5)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/30 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Play size={10} className="fill-current" />
              <span>Start 5-Min Reset</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="relative p-3 border-t border-white/10 bg-[#141d17]/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Serenity about calm, tilt, breathwork..."
              disabled={isLoading}
              className="flex-1 h-9 px-3 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-hidden focus:border-emerald-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="size-9 rounded-xl flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white disabled:opacity-40 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

