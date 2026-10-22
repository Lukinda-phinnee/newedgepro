"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flame,
  Image as LucideImage,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { ExecutionGrade, FollowedRules, ReviewStatus, Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface TradeReviewModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveReview: (updatedTrade: Trade) => Promise<void>;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalInQueue?: number;
}

const POSITIVE_HABIT_TAGS = [
  "Textbook Setup",
  "Patient Entry",
  "Let Winner Run",
  "Honored Stop Loss",
  "Clean Exit",
  "Risk Respected",
  "HTF Confluence",
  "Disciplined Sizing",
];

const LEAK_TAGS = [
  "FOMO / Chasing",
  "Moved Stop Loss",
  "Exited Prematurely",
  "Cut Winner Short",
  "Hesitated Entry",
  "Late Entry",
  "Overleveraged / Oversized",
  "Revenge Trading",
  "Boredom / No Setup",
  "Ignored HTF Bias",
  "Held Into News",
  "Averaged Down",
];

const GRADE_CONFIG: Record<
  ExecutionGrade,
  { label: string; desc: string; color: string; bg: string; border: string }
> = {
  "A+": {
    label: "A+ Setup",
    desc: "Textbook execution, zero hesitation, honored plan and risk parameters to the tick.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  "A": {
    label: "A Grade",
    desc: "High quality execution according to playbook with solid risk management and discipline.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  "B": {
    label: "B Grade",
    desc: "Valid setup and good execution with minor imperfections or slight slippage.",
    color: "text-violet-600 dark:text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
  },
  "C": {
    label: "C Grade",
    desc: "Suboptimal entry or marginal setup, but risk remained controlled without catastrophic loss.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  "D": {
    label: "D Grade",
    desc: "Poor execution, chased or hesitated, rule discipline breakdown.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  "F": {
    label: "F Grade",
    desc: "Severe rule violation, emotional gambling, moved stop loss, or impulsive revenge trade.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
  },
};

// Helper: read image file and compress dimensions if needed to optimize storage while maintaining crisp candle details
function readFileAsCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.88));
            return;
          }
        }
        resolve(src);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TradeReviewModal({
  trade,
  open,
  onOpenChange,
  onSaveReview,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
  currentIndex,
  totalInQueue,
}: TradeReviewModalProps) {
  // Form State
  const [followedRules, setFollowedRules] = useState<FollowedRules>("yes");
  const [executionGrade, setExecutionGrade] = useState<ExecutionGrade>("A");
  const [reviewRating, setReviewRating] = useState<number>(5);

  // Behavioral Strengths & Disciplined Habits
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [customStrengthsList, setCustomStrengthsList] = useState<string[]>([]);
  const [customStrengthInput, setCustomStrengthInput] = useState("");

  // Execution Leaks & Psychological Traps
  const [selectedLeaks, setSelectedLeaks] = useState<string[]>([]);
  const [customLeaksList, setCustomLeaksList] = useState<string[]>([]);
  const [customLeakInput, setCustomLeakInput] = useState("");

  // Retrospective Reflections
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatToImprove, setWhatToImprove] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  // Screenshots state (multi-image support)
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFlagged, setIsFlagged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever active trade changes
  useEffect(() => {
    if (trade) {
      setFollowedRules(
        trade.followedRules ||
          (trade.ruleVerdict === "BLOCK"
            ? "no"
            : trade.ruleVerdict === "WARN"
            ? "partial"
            : "yes"),
      );
      setExecutionGrade(trade.executionGrade || "A");
      setReviewRating(trade.reviewRating || 5);

      // Separate tags into Strengths vs Leaks
      const allTags = trade.mistakeTags || [];
      const initStrengths: string[] = [];
      const initCustomStrengths: string[] = [];
      const initLeaks: string[] = [];
      const initCustomLeaks: string[] = [];

      allTags.forEach((t) => {
        if (POSITIVE_HABIT_TAGS.includes(t)) {
          initStrengths.push(t);
        } else if (LEAK_TAGS.includes(t)) {
          initLeaks.push(t);
        } else if (t.toLowerCase().startsWith("strength:")) {
          const clean = t.replace(/^strength:\s*/i, "").trim();
          initStrengths.push(clean);
          initCustomStrengths.push(clean);
        } else {
          initLeaks.push(t);
          initCustomLeaks.push(t);
        }
      });

      setSelectedStrengths(initStrengths);
      setCustomStrengthsList(initCustomStrengths);
      setSelectedLeaks(initLeaks);
      setCustomLeaksList(initCustomLeaks);

      setWhatWentWell(trade.whatWentWell || "");
      setWhatToImprove(trade.whatToImprove || "");
      setLessonsLearned(trade.lessonsLearned || "");
      setIsFlagged(trade.reviewStatus === "flagged");
      setScreenshots(trade.screenshots || []);
      setLightboxIndex(null);
      setError(null);
    }
  }, [trade]);

  // Handle Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onOpenChange(false);
        }
      } else if (e.key === "ArrowLeft" && hasPrev && onNavigatePrev && lightboxIndex === null) {
        // Prevent navigating when typing inside textarea or input
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          onNavigatePrev();
        }
      } else if (e.key === "ArrowRight" && hasNext && onNavigateNext && lightboxIndex === null) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          onNavigateNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, lightboxIndex, onOpenChange, hasPrev, hasNext, onNavigatePrev, onNavigateNext]);

  // Lock body scroll while side panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Global paste handler: allows quick Ctrl+V of screenshots taken with Snipping tool
  useEffect(() => {
    if (!open) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open]);

  if (!trade) return null;

  const isProfitable = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  const dateObj = new Date(trade.openedAt);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Strengths Tag Handlers
  const toggleStrength = (tag: string) => {
    setSelectedStrengths((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomStrength = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customStrengthInput.trim();
    if (!clean) return;
    if (!customStrengthsList.includes(clean) && !POSITIVE_HABIT_TAGS.includes(clean)) {
      setCustomStrengthsList((prev) => [...prev, clean]);
    }
    if (!selectedStrengths.includes(clean)) {
      setSelectedStrengths((prev) => [...prev, clean]);
    }
    setCustomStrengthInput("");
  };

  const removeCustomStrength = (tag: string) => {
    setCustomStrengthsList((prev) => prev.filter((t) => t !== tag));
    setSelectedStrengths((prev) => prev.filter((t) => t !== tag));
  };

  // Leaks Tag Handlers
  const toggleLeak = (tag: string) => {
    setSelectedLeaks((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomLeak = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customLeakInput.trim();
    if (!clean) return;
    if (!customLeaksList.includes(clean) && !LEAK_TAGS.includes(clean)) {
      setCustomLeaksList((prev) => [...prev, clean]);
    }
    if (!selectedLeaks.includes(clean)) {
      setSelectedLeaks((prev) => [...prev, clean]);
    }
    setCustomLeakInput("");
  };

  const removeCustomLeak = (tag: string) => {
    setCustomLeaksList((prev) => prev.filter((t) => t !== tag));
    setSelectedLeaks((prev) => prev.filter((t) => t !== tag));
  };

  // Multi-Image Upload & Management Handlers
  const handleFiles = async (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (validImageFiles.length === 0) return;

    try {
      const dataUrls = await Promise.all(validImageFiles.map(readFileAsCompressedDataUrl));
      setScreenshots((prev) => [...prev, ...dataUrls]);
    } catch (err) {
      console.error("Failed to read image files:", err);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    if (lightboxIndex === index) {
      setLightboxIndex(null);
    } else if (lightboxIndex !== null && lightboxIndex > index) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSave = async (markAsReviewed: boolean = true) => {
    setError(null);
    setSaving(true);
    try {
      const updatedStatus: ReviewStatus = isFlagged
        ? "flagged"
        : markAsReviewed
        ? "reviewed"
        : "unreviewed";

      // Combine strengths & leaks for database storage
      const combinedTags = [
        ...selectedStrengths.map((s) => (POSITIVE_HABIT_TAGS.includes(s) ? s : `Strength: ${s}`)),
        ...selectedLeaks,
      ];

      const updatedTrade: Trade = {
        ...trade,
        reviewStatus: updatedStatus,
        reviewedAt: markAsReviewed ? new Date().toISOString() : null,
        executionGrade: markAsReviewed ? executionGrade : null,
        reviewRating: markAsReviewed ? reviewRating : null,
        followedRules: markAsReviewed ? followedRules : null,
        mistakeTags: combinedTags,
        whatWentWell: whatWentWell.trim() || null,
        whatToImprove: whatToImprove.trim() || null,
        lessonsLearned: lessonsLearned.trim() || null,
        screenshots: screenshots,
      };

      await onSaveReview(updatedTrade);

      if (hasNext && onNavigateNext) {
        onNavigateNext();
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkUnreviewed = async () => {
    setError(null);
    setSaving(true);
    try {
      const revertedTrade: Trade = {
        ...trade,
        reviewStatus: "unreviewed",
        reviewedAt: null,
      };
      await onSaveReview(revertedTrade);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Apple Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          />

          {/* Sliding Apple macOS / iPadOS Inspector Sheet */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320, mass: 0.85 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border/80 bg-background text-foreground shadow-2xl sm:w-4/5 lg:w-[580px] xl:w-[640px]"
          >
            {/* ═══════════════ 1. FIXED GLASS HEADER ═══════════════ */}
            <div className="shrink-0 border-b border-border/70 bg-card/85 px-5 py-4 backdrop-blur-xl sm:px-6">
              <div className="flex items-center justify-between gap-3">
                {/* Title & Queue Counter */}
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    Trade Audit
                  </h3>
                  {typeof currentIndex === "number" && typeof totalInQueue === "number" && (
                    <Badge variant="muted" size="sm" className="tabular-nums font-medium">
                      {currentIndex + 1} of {totalInQueue}
                    </Badge>
                  )}
                </div>

                {/* Queue Controls & Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Prev / Next Queue navigation */}
                  <div className="flex items-center rounded-lg border border-border/80 bg-secondary/50 p-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!hasPrev || saving}
                      onClick={onNavigatePrev}
                      className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                      title="Previous trade (Left Arrow)"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!hasNext || saving}
                      onClick={onNavigateNext}
                      className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                      title="Next trade (Right Arrow)"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>

                  {/* Flag Bookmark */}
                  <Button
                    type="button"
                    variant={isFlagged ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsFlagged((prev) => !prev)}
                    className={cn(
                      "h-8 gap-1 px-2.5 text-xs font-medium active:scale-95 transition-transform",
                      isFlagged && "bg-violet-600 text-white"
                    )}
                    title="Flag trade for weekend deep-dive"
                  >
                    <Bookmark size={12} fill={isFlagged ? "currentColor" : "none"} />
                    <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Flag"}</span>
                  </Button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-95"
                    aria-label="Close panel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Trade Execution Hero Capsule */}
              <div className="mt-3.5 rounded-xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-xs">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Symbol & Direction */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold tracking-tight text-foreground">
                        {trade.symbol}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          trade.side === "long"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {trade.side === "long" ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                        {trade.side}
                      </span>
                      {trade.strategy && (
                        <span className="text-xs text-muted-foreground">
                          • {trade.strategy}
                        </span>
                      )}
                      {trade.marketSession && (
                        <span className="text-xs text-muted-foreground/80">
                          • {trade.marketSession}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums"
                      suppressHydrationWarning
                    >
                      <Clock size={11} />
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{timeStr}</span>
                    </div>
                  </div>

                  {/* P&L & R-Multiple */}
                  <div className="text-left sm:text-right">
                    <div
                      className={cn(
                        "text-xl font-bold tracking-tight tabular-nums",
                        isProfitable
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isLoss
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {isProfitable ? "+" : ""}
                      ${trade.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {isProfitable ? "+" : ""}
                      {trade.pnlPercentage.toFixed(2)}%
                      {trade.rMultiple !== undefined && (
                        <span className="font-medium text-foreground">
                          {" "}
                          • {trade.rMultiple >= 0 ? "+" : ""}
                          {trade.rMultiple}R
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Strip */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-xs tabular-nums sm:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">Entry: </span>
                    <span className="font-medium text-foreground">
                      ${trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exit: </span>
                    <span className="font-medium text-foreground">
                      {trade.exitPrice !== null ? (
                        `$${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="italic text-muted-foreground">Open</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size: </span>
                    <span className="font-medium text-foreground">{trade.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop: </span>
                    <span className="font-medium text-foreground">
                      {trade.stopLoss ? `$${trade.stopLoss.toLocaleString("en-US")}` : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════ 2. SCROLLABLE REVIEW BODY ═══════════════ */}
            <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* ────── MODULE 1: EXECUTION & PLAN SCORING ────── */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Plan & Execution Quality
                  </h4>
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground tabular-nums mr-1">
                      Score: <span className="font-semibold text-foreground">{reviewRating}/5</span>
                    </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={cn(
                          "p-0.5 transition active:scale-90",
                          star <= reviewRating
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-muted-foreground/30 hover:text-muted-foreground"
                        )}
                        title={`${star} Star Score`}
                      >
                        <Star size={14} fill={star <= reviewRating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Automated Rule Engine Telemetry Banner (if available) */}
                {trade.ruleEvaluation ? (
                  <div
                    className={cn(
                      "rounded-xl border p-3 text-xs space-y-2 transition",
                      trade.ruleVerdict === "BLOCK"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                        : trade.ruleVerdict === "WARN"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {trade.ruleVerdict === "BLOCK" ? (
                          <AlertTriangle size={15} className="text-rose-500 shrink-0" />
                        ) : trade.ruleVerdict === "WARN" ? (
                          <ShieldAlert size={15} className="text-amber-500 shrink-0" />
                        ) : (
                          <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
                        )}
                        <span>
                          Rule Engine Audit:{" "}
                          {trade.ruleVerdict === "BLOCK"
                            ? "Violation Detected"
                            : trade.ruleVerdict === "WARN"
                            ? "Warning Flagged"
                            : "100% Compliant"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (trade.ruleVerdict === "BLOCK") setFollowedRules("no");
                          else if (trade.ruleVerdict === "WARN") setFollowedRules("partial");
                          else setFollowedRules("yes");
                        }}
                        className="text-[11px] font-semibold underline opacity-85 hover:opacity-100 transition"
                      >
                        Apply Verdict
                      </button>
                    </div>

                    {trade.ruleEvaluation.messages && trade.ruleEvaluation.messages.length > 0 && (
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {trade.ruleEvaluation.messages[0]}
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Followed Rules Options */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setFollowedRules("yes")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition active:scale-[0.98]",
                      followedRules === "yes"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-foreground shadow-xs"
                        : "border-border/70 bg-card/60 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        size={15}
                        className={followedRules === "yes" ? "text-emerald-500" : "text-muted-foreground"}
                      />
                      <span className="text-xs font-semibold text-foreground">Followed 100%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Honored setup, plan, stop loss, and size.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowedRules("partial")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition active:scale-[0.98]",
                      followedRules === "partial"
                        ? "border-amber-500/50 bg-amber-500/10 text-foreground shadow-xs"
                        : "border-border/70 bg-card/60 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert
                        size={15}
                        className={followedRules === "partial" ? "text-amber-500" : "text-muted-foreground"}
                      />
                      <span className="text-xs font-semibold text-foreground">Minor Deviation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Valid setup with slight hesitation or early exit.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowedRules("no")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition active:scale-[0.98]",
                      followedRules === "no"
                        ? "border-rose-500/50 bg-rose-500/10 text-foreground shadow-xs"
                        : "border-border/70 bg-card/60 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Flame
                        size={15}
                        className={followedRules === "no" ? "text-rose-500" : "text-muted-foreground"}
                      />
                      <span className="text-xs font-semibold text-foreground">Broke Rules</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      FOMO, chasing, moving stop loss, or revenge.
                    </p>
                  </button>
                </div>

                {/* Grade Selection Row */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Execution Grade</span>
                    <span className={cn("font-semibold", GRADE_CONFIG[executionGrade].color)}>
                      {GRADE_CONFIG[executionGrade].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {(["A+", "A", "B", "C", "D", "F"] as ExecutionGrade[]).map((grade) => {
                      const config = GRADE_CONFIG[grade];
                      const isActive = executionGrade === grade;
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setExecutionGrade(grade)}
                          className={cn(
                            "flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition active:scale-95",
                            isActive
                              ? cn(config.border, config.bg, config.color, "shadow-xs")
                              : "border-border/70 bg-card hover:bg-secondary text-muted-foreground"
                          )}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                    {GRADE_CONFIG[executionGrade].desc}
                  </p>
                </div>
              </section>

              {/* ────── MODULE 2: TACTICAL & BEHAVIORAL TAGS ────── */}
              <section className="space-y-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Behavioral &amp; Tactical Tags
                </h4>

                {/* Strengths & Disciplined Habits */}
                <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp size={13} />
                      <span>Strengths &amp; Habits</span>
                    </div>
                    {selectedStrengths.length > 0 && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {selectedStrengths.length} selected
                      </span>
                    )}
                  </div>

                  {/* Predefined + Custom Strength Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {POSITIVE_HABIT_TAGS.map((tag) => {
                      const isSelected = selectedStrengths.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleStrength(tag)}
                          className={cn(
                            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition active:scale-95",
                            isSelected
                              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "border-border/70 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <span>{tag}</span>
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      );
                    })}

                    {customStrengthsList.map((customTag) => {
                      const isSelected = selectedStrengths.includes(customTag);
                      return (
                        <div
                          key={customTag}
                          className={cn(
                            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                            isSelected
                              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "border-border/70 bg-card text-muted-foreground"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleStrength(customTag)}
                            className="flex items-center gap-1"
                          >
                            <span>{customTag}</span>
                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomStrength(customTag)}
                            className="ml-1 text-muted-foreground/60 hover:text-destructive transition"
                            title="Remove custom tag"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Strength Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={customStrengthInput}
                      onChange={(e) => setCustomStrengthInput(e.target.value)}
                      placeholder="Add habit (e.g. Scaled out at 2R target)..."
                      className="h-8 text-xs rounded-lg border-border/70 bg-background/80"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomStrength();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomStrength()}
                      disabled={!customStrengthInput.trim()}
                      className="h-8 shrink-0 px-2.5 text-xs font-medium"
                    >
                      <Plus size={13} className="mr-0.5" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Leaks & Traps */}
                <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      <Flame size={13} />
                      <span>Execution Leaks</span>
                    </div>
                    {selectedLeaks.length > 0 && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {selectedLeaks.length} selected
                      </span>
                    )}
                  </div>

                  {/* Predefined + Custom Leak Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {LEAK_TAGS.map((tag) => {
                      const isSelected = selectedLeaks.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleLeak(tag)}
                          className={cn(
                            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition active:scale-95",
                            isSelected
                              ? "border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "border-border/70 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <span>{tag}</span>
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      );
                    })}

                    {customLeaksList.map((customTag) => {
                      const isSelected = selectedLeaks.includes(customTag);
                      return (
                        <div
                          key={customTag}
                          className={cn(
                            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                            isSelected
                              ? "border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "border-border/70 bg-card text-muted-foreground"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleLeak(customTag)}
                            className="flex items-center gap-1"
                          >
                            <span>{customTag}</span>
                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomLeak(customTag)}
                            className="ml-1 text-muted-foreground/60 hover:text-destructive transition"
                            title="Remove custom leak"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Leak Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={customLeakInput}
                      onChange={(e) => setCustomLeakInput(e.target.value)}
                      placeholder="Add leak (e.g. Traded into high-impact CPI release)..."
                      className="h-8 text-xs rounded-lg border-border/70 bg-background/80"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomLeak();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomLeak()}
                      disabled={!customLeakInput.trim()}
                      className="h-8 shrink-0 px-2.5 text-xs font-medium"
                    >
                      <Plus size={13} className="mr-0.5" />
                      Add
                    </Button>
                  </div>
                </div>
              </section>

              {/* ────── MODULE 3: MULTI-CHART EVIDENCE (QUICKLOOK) ────── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Multi-Chart Evidence
                  </h4>
                  {screenshots.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2 text-xs font-medium"
                    >
                      <Plus size={12} className="mr-1" /> Add Image
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {screenshots.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-6 text-center transition-all hover:bg-secondary/40 active:scale-[0.99]",
                      isDragging && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
                      <UploadCloud size={20} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-foreground">
                      Drop chart screenshots here, or <span className="underline">browse</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Supports PNG, JPG, WebP • Paste anytime with <kbd className="font-mono text-[10px]">Ctrl+V</kbd>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {screenshots.map((src, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-video overflow-hidden rounded-xl border border-border/70 bg-black/40 shadow-xs"
                        >
                          <img
                            src={src}
                            alt={`Trade screenshot ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.2 text-[9px] font-bold text-white backdrop-blur-xs">
                            #{idx + 1}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setLightboxIndex(idx)}
                              className="flex size-7 items-center justify-center rounded-lg bg-white/20 text-white transition hover:bg-white/30"
                              title="View full size"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshot(idx)}
                              className="flex size-7 items-center justify-center rounded-lg bg-rose-500/80 text-white transition hover:bg-rose-500"
                              title="Delete screenshot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition"
                    >
                      <Camera size={13} />
                      <span>Drag &amp; drop more charts or paste with Ctrl+V</span>
                    </div>
                  </div>
                )}
              </section>

              {/* ────── MODULE 4: RETROSPECTIVE REFLECTIONS ────── */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Retrospective Reflection
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="review-went-well" className="text-xs font-medium text-foreground">
                      Wins &amp; What Went Well
                    </Label>
                    <textarea
                      id="review-went-well"
                      value={whatWentWell}
                      onChange={(e) => setWhatWentWell(e.target.value)}
                      placeholder="Waited for 5m candle close confirmation, honored planned stop loss without hesitation..."
                      rows={2}
                      className="w-full rounded-xl border border-input bg-card/60 p-3 text-xs leading-relaxed text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="review-improve" className="text-xs font-medium text-foreground">
                      Critical Leak or Mistake to Eliminate
                    </Label>
                    <textarea
                      id="review-improve"
                      value={whatToImprove}
                      onChange={(e) => setWhatToImprove(e.target.value)}
                      placeholder="Cut winner too early on fear of pullback instead of trailing structural pivot..."
                      rows={2}
                      className="w-full rounded-xl border border-input bg-card/60 p-3 text-xs leading-relaxed text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="review-lesson" className="text-xs font-medium text-foreground">
                      Actionable Takeaway Rule for Next Time
                    </Label>
                    <textarea
                      id="review-lesson"
                      value={lessonsLearned}
                      onChange={(e) => setLessonsLearned(e.target.value)}
                      placeholder="Do not enter in the first 5 minutes of NY Open without HTF directional trend confirmation..."
                      rows={2}
                      className="w-full rounded-xl border border-input bg-card/60 p-3 text-xs leading-relaxed text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* ═══════════════ 3. FIXED GLASS FOOTER ═══════════════ */}
            <div className="shrink-0 border-t border-border/70 bg-card/85 px-5 py-3.5 backdrop-blur-xl sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  {trade.reviewStatus === "reviewed" && (
                    <button
                      type="button"
                      onClick={handleMarkUnreviewed}
                      disabled={saving}
                      className="text-xs font-medium text-muted-foreground transition hover:text-destructive underline"
                    >
                      Reset to Unreviewed
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                    className="h-9 px-4 text-xs font-medium"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="h-9 gap-1.5 px-5 text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        {hasNext ? "Save & Next" : "Save Review"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* ═══════════════ APPLE QUICKLOOK LIGHTBOX ═══════════════ */}
          {lightboxIndex !== null && screenshots[lightboxIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Enlarged screenshot preview"
              className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-md"
              onClick={() => setLightboxIndex(null)}
            >
              <div
                className="flex w-full max-w-5xl items-center justify-between pb-3 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium tabular-nums">
                    Chart {lightboxIndex + 1} of {screenshots.length}
                  </span>
                  <span className="text-xs text-white/70">
                    {trade.symbol} • QuickLook
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveScreenshot(lightboxIndex)}
                    className="h-7 border-destructive/40 bg-destructive/15 text-xs text-destructive hover:bg-destructive/30 hover:text-white"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Delete
                  </Button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(null)}
                    className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div
                className="relative flex max-h-[82vh] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={screenshots[lightboxIndex]}
                  alt={`Trade chart screenshot ${lightboxIndex + 1}`}
                  className="max-h-[80vh] w-auto max-w-full object-contain"
                />

                {screenshots.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((prev) =>
                          prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1
                        )
                      }
                      className="absolute left-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/90 active:scale-95"
                      title="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((prev) =>
                          prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/90 active:scale-95"
                      title="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
