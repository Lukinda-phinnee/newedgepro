"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Image as LucideImage,
  Maximize2,
  Quote,
  ShieldAlert,
  ShieldCheck,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface JournalDetailModalProps {
  trade: Trade | null;
  currency?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function JournalDetailModal({
  trade,
  currency = "USD",
  open,
  onOpenChange,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
}: JournalDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset selected image index when trade changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setIsZoomed(false);
  }, [trade?.id]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onOpenChange(false);
        }
      } else if (e.key === "ArrowLeft" && hasPrev && onNavigatePrev && !isZoomed) {
        onNavigatePrev();
      } else if (e.key === "ArrowRight" && hasNext && onNavigateNext && !isZoomed) {
        onNavigateNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isZoomed, onOpenChange, hasPrev, hasNext, onNavigatePrev, onNavigateNext]);

  if (!trade || !open) return null;

  const isProfitable = trade.pnl > 0;
  const isLoss = trade.pnl < 0;
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;

  const screenshots = Array.isArray(trade.screenshots) ? trade.screenshots : [];
  const currentScreenshot = screenshots[selectedImageIndex] || null;

  const dateObj = new Date(trade.openedAt);
  const dateStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : trade.openedAt;

  const timeStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/70 bg-card/90 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                  trade.side === "long"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                )}
              >
                {trade.side === "long" ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                {trade.side}
              </span>

              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{trade.symbol}</span>
                {trade.isDemo && (
                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-semibold text-amber-500 uppercase">
                    Demo
                  </span>
                )}
              </h2>

              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold tabular-nums border",
                  isProfitable
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isLoss
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-border/60 bg-secondary/50 text-muted-foreground"
                )}
              >
                {isProfitable ? <TrendingUp size={13} /> : isLoss ? <TrendingDown size={13} /> : null}
                <span>
                  {isProfitable ? "+" : isLoss ? "-" : ""}
                  {currencySymbol}
                  {Math.abs(trade.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] opacity-80">
                  ({isProfitable ? "+" : ""}{trade.pnlPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Navigation & Close */}
            <div className="flex items-center gap-1.5">
              {hasPrev && onNavigatePrev && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNavigatePrev}
                  className="size-8 p-0"
                  title="Previous trade (Left arrow)"
                >
                  <ChevronLeft size={16} />
                </Button>
              )}
              {hasNext && onNavigateNext && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNavigateNext}
                  className="size-8 p-0"
                  title="Next trade (Right arrow)"
                >
                  <ChevronRight size={16} />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X size={17} />
              </Button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Chart Screenshot Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <LucideImage size={13} />
                  Chart Evidence {screenshots.length > 0 && `(${selectedImageIndex + 1}/${screenshots.length})`}
                </span>
                {currentScreenshot && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsZoomed(true)}
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Maximize2 size={12} />
                    Fullscreen View
                  </Button>
                )}
              </div>

              {currentScreenshot ? (
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-black/40">
                  <div className="relative aspect-video max-h-[460px] w-full flex items-center justify-center bg-black/60">
                    <img
                      src={currentScreenshot}
                      alt={`${trade.symbol} chart capture`}
                      className="h-full w-full object-contain cursor-zoom-in"
                      onClick={() => setIsZoomed(true)}
                    />
                  </div>

                  {/* Thumbnail Selector if multiple images */}
                  {screenshots.length > 1 && (
                    <div className="flex items-center gap-2 border-t border-border/40 bg-card/60 p-2 overflow-x-auto">
                      {screenshots.map((shot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={cn(
                            "relative size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                            selectedImageIndex === idx
                              ? "border-violet-500 shadow-xs"
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img
                            src={shot}
                            alt={`Thumbnail ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-10 text-center text-muted-foreground">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary border border-border/50">
                    <LucideImage size={24} className="opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No chart screenshot attached to this trade</p>
                  <p className="text-xs text-muted-foreground/70 max-w-sm">
                    You can attach screenshots with Ctrl+V or upload during trade logging and review.
                  </p>
                </div>
              )}
            </div>

            {/* Summary Caption & Reflections Block */}
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
                <Quote size={16} className="text-violet-400 rotate-180" />
                <span>Trade Caption &amp; Reflections</span>
              </div>

              {trade.lessonsLearned && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                    Key Lesson Learned
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/95 bg-card/60 rounded-xl p-3 border border-border/50">
                    {trade.lessonsLearned}
                  </p>
                </div>
              )}

              {trade.whatWentWell && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                    What Went Well
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/95 bg-card/60 rounded-xl p-3 border border-border/50">
                    {trade.whatWentWell}
                  </p>
                </div>
              )}

              {trade.whatToImprove && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                    What to Improve / Trading Leak
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/95 bg-card/60 rounded-xl p-3 border border-border/50">
                    {trade.whatToImprove}
                  </p>
                </div>
              )}

              {trade.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    General Trade Notes
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90 bg-card/60 rounded-xl p-3 border border-border/50 whitespace-pre-wrap">
                    {trade.notes}
                  </p>
                </div>
              )}

              {!trade.lessonsLearned && !trade.whatWentWell && !trade.whatToImprove && !trade.notes && (
                <p className="text-xs italic text-muted-foreground/60">
                  No written notes or reflections recorded for this trade yet.
                </p>
              )}
            </div>

            {/* Execution Details Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Execution Breakdown
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Entry Price</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {currencySymbol}{trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Exit Price</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {trade.exitPrice !== null && trade.exitPrice !== undefined
                      ? `${currencySymbol}${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`
                      : "Open Position"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Stop Loss</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {trade.stopLoss !== null && trade.stopLoss !== undefined
                      ? `${currencySymbol}${trade.stopLoss.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`
                      : "None"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Take Profit</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {trade.takeProfit !== null && trade.takeProfit !== undefined
                      ? `${currencySymbol}${trade.takeProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`
                      : "None"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Quantity / Size</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {trade.quantity}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">R-Multiple</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {trade.rMultiple !== undefined && trade.rMultiple !== null
                      ? `${trade.rMultiple >= 0 ? "+" : ""}${trade.rMultiple}R`
                      : "—"}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Execution Date</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {dateStr}
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <span className="block text-[11px] text-muted-foreground font-medium">Execution Time</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {timeStr || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy, Tags & Risk Adherence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Context &amp; Environment
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Strategy:</span>
                    <span className="font-semibold">{trade.strategy || "Unspecified"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Market Session:</span>
                    <span className="font-semibold">{trade.marketSession || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Market Condition:</span>
                    <span className="font-semibold">{trade.marketCondition || "—"}</span>
                  </div>
                  {trade.entryEmotion && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Entry Emotion:</span>
                      <span className="font-semibold">{trade.entryEmotion}</span>
                    </div>
                  )}
                  {trade.exitEmotion && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Exit Emotion:</span>
                      <span className="font-semibold">{trade.exitEmotion}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Rule Engine &amp; Review Audit
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rule Compliance:</span>
                    <span
                      className={cn(
                        "font-semibold flex items-center gap-1",
                        trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no")
                          ? "text-rose-500"
                          : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial")
                          ? "text-amber-500"
                          : "text-emerald-500"
                      )}
                    >
                      {trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no") ? (
                        <>
                          <Flame size={12} /> Violation Detected
                        </>
                      ) : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial") ? (
                        <>
                          <ShieldAlert size={12} /> Minor Deviation
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} /> 100% Compliant
                        </>
                      )}
                    </span>
                  </div>

                  {trade.executionGrade && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Execution Grade:</span>
                      <span className="font-bold text-foreground">Grade {trade.executionGrade}</span>
                    </div>
                  )}

                  {trade.reviewRating && trade.reviewRating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Score Rating:</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: trade.reviewRating }).map((_, i) => (
                          <Star key={i} size={11} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                  )}

                  {trade.mistakeTags && trade.mistakeTags.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] text-muted-foreground block mb-1">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {trade.mistakeTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-secondary border border-border/50 px-2 py-0.5 text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-border/70 bg-card/90 px-5 py-3">
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              Trade ID: <code className="text-[11px] font-mono">{trade.id.slice(0, 8)}</code>
            </span>

            <Button
              size="sm"
              variant="default"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Close
            </Button>
          </div>
        </motion.div>

        {/* Fullscreen Zoom Lightbox */}
        {isZoomed && currentScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
            onClick={() => setIsZoomed(false)}
          >
            <div className="flex w-full max-w-6xl items-center justify-between pb-3 text-white">
              <span className="text-sm font-semibold">
                {trade.symbol} Chart · {selectedImageIndex + 1} of {screenshots.length}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="flex size-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="relative flex max-h-[86vh] w-full max-w-6xl items-center justify-center overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentScreenshot}
                alt={`${trade.symbol} enlarged chart`}
                className="max-h-[84vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

