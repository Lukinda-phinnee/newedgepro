"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileImage,
  Flame,
  Image as LucideImage,
  Layers,
  Loader2,
  Maximize2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
    desc: "Flawless textbook execution, zero hesitation, honored trading plan and risk to the tick.",
    color: "text-emerald-300",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
  },
  "A": {
    label: "A Grade",
    desc: "High quality execution according to playbook with solid risk management and discipline.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
  },
  "B": {
    label: "B Grade",
    desc: "Valid setup and good execution with minor imperfections, slight slippage or hesitation.",
    color: "text-violet-300",
    bg: "bg-violet-500/20",
    border: "border-violet-500/40",
  },
  "C": {
    label: "C Grade",
    desc: "Suboptimal entry or marginal setup, but risk was controlled without catastrophic loss.",
    color: "text-amber-300",
    bg: "bg-amber-500/20",
    border: "border-amber-500/40",
  },
  "D": {
    label: "D Grade",
    desc: "Poor execution, chased or hesitated, rule discipline breakdown, avoided discipline.",
    color: "text-rose-300",
    bg: "bg-rose-500/20",
    border: "border-rose-500/40",
  },
  "F": {
    label: "F Grade",
    desc: "Severe rule violation, emotional gambling, moved stop loss, or impulsive revenge trade.",
    color: "text-rose-400",
    bg: "bg-rose-500/25",
    border: "border-rose-500/60",
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
      setFollowedRules(trade.followedRules || "yes");
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

  // Handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onOpenChange(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, lightboxIndex, onOpenChange]);

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

  if (!open || !trade) return null;

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
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Right Slide Panel (50% Width on Desktop) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Review Trade ${trade.symbol}`}
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border/80 bg-background text-foreground shadow-2xl transition-transform duration-300 ease-in-out sm:w-4/5 lg:w-1/2 animate-in slide-in-from-right duration-300"
      >
        {/* ═══════════════ 1. FIXED TOP HEADER ═══════════════ */}
        <div className="shrink-0 border-b border-border/70 bg-card/95 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Title & Queue Counter */}
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Trade Review
              </h3>
              {typeof currentIndex === "number" && typeof totalInQueue === "number" && (
                <span className="rounded-md border border-border/70 bg-secondary/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {currentIndex + 1} of {totalInQueue}
                </span>
              )}
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-1.5">
              {/* Prev / Next Queue navigation */}
              <div className="flex items-center rounded-lg border border-border/70 bg-secondary/40 p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!hasPrev || saving}
                  onClick={onNavigatePrev}
                  className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                  title="Previous trade in queue"
                >
                  <ChevronLeft size={15} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!hasNext || saving}
                  onClick={onNavigateNext}
                  className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                  title="Next trade in queue"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>

              {/* Flag Bookmark */}
              <button
                type="button"
                onClick={() => setIsFlagged((prev) => !prev)}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition",
                  isFlagged
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                    : "border-border/70 bg-secondary/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
                title="Flag trade for weekend deep-dive"
              >
                <Bookmark size={13} fill={isFlagged ? "currentColor" : "none"} />
                <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Flag"}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Trade Execution Hero Card ── */}
          <div className="mt-3.5 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Column: Symbol & Meta Pills */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-border/80 bg-secondary px-2.5 py-1 text-sm font-extrabold tracking-tight text-foreground">
                    {trade.symbol}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase",
                      trade.side === "long"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    )}
                  >
                    {trade.side === "long" ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                    {trade.side}
                  </span>
                  {trade.strategy && (
                    <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {trade.strategy}
                    </span>
                  )}
                  {trade.marketSession && (
                    <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
                      {trade.marketSession}
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  suppressHydrationWarning
                >
                  <Clock size={12} />
                  <span>{dateStr}</span>
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>
              </div>

              {/* Right Column: P&L & R-Multiple */}
              <div className="flex items-baseline justify-between gap-4 border-t border-border/40 pt-2 sm:border-0 sm:pt-0 sm:text-right">
                <div>
                  <div
                    className={cn(
                      "text-xl font-extrabold tracking-tight sm:text-2xl",
                      isProfitable ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-muted-foreground"
                    )}
                  >
                    {isProfitable ? "+" : ""}
                    ${trade.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {isProfitable ? "+" : ""}
                    {trade.pnlPercentage.toFixed(2)}%
                    {trade.rMultiple !== undefined && (
                      <span className="font-semibold text-foreground/80">
                        {" "}
                        • {trade.rMultiple >= 0 ? "+" : ""}
                        {trade.rMultiple}R
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Strip */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-2.5 text-xs sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Entry: </span>
                <span className="font-semibold text-foreground">
                  ${trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Exit: </span>
                <span className="font-semibold text-foreground">
                  {trade.exitPrice !== null ? (
                    `$${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  ) : (
                    <span className="italic text-muted-foreground/80">Open</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Size: </span>
                <span className="font-semibold text-foreground">{trade.quantity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stop: </span>
                <span className="font-semibold text-foreground">
                  {trade.stopLoss ? `$${trade.stopLoss.toLocaleString("en-US")}` : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ 2. SCROLLABLE REVIEW BODY ═══════════════ */}
        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* ────── SECTION 1: RULE ADHERENCE AUDIT ────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-[11px] font-bold text-violet-300">
                1
              </span>
              <h4 className="text-sm font-bold tracking-tight text-foreground">
                Rule Adherence &amp; Discipline Audit
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Did you follow your trading plan, setup criteria, and risk parameters?
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setFollowedRules("yes")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition",
                  followedRules === "yes"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-xs"
                    : "border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    size={16}
                    className={followedRules === "yes" ? "text-emerald-400" : "text-muted-foreground"}
                  />
                  <span className="text-xs font-bold text-foreground">Followed 100%</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Honored setup, plan, stop loss, and position size without drift.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFollowedRules("partial")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition",
                  followedRules === "partial"
                    ? "border-amber-500 bg-amber-500/10 text-amber-300 shadow-xs"
                    : "border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldAlert
                    size={16}
                    className={followedRules === "partial" ? "text-amber-400" : "text-muted-foreground"}
                  />
                  <span className="text-xs font-bold text-foreground">Minor Deviation</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Valid setup but slight hesitation, late entry, or micro-management.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFollowedRules("no")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition",
                  followedRules === "no"
                    ? "border-rose-500 bg-rose-500/10 text-rose-300 shadow-xs"
                    : "border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Flame
                    size={16}
                    className={followedRules === "no" ? "text-rose-400" : "text-muted-foreground"}
                  />
                  <span className="text-xs font-bold text-foreground">Broke Rules</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Emotional trade, FOMO, chasing, moving stop loss, or revenge.
                </p>
              </button>
            </div>
          </section>

          {/* ────── SECTION 2: EXECUTION QUALITY & GRADE ────── */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-[11px] font-bold text-violet-300">
                  2
                </span>
                <h4 className="text-sm font-bold tracking-tight text-foreground">
                  Execution Quality &amp; Score
                </h4>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Score: <span className="font-bold text-foreground">{reviewRating}/5</span>
                </span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={cn(
                        "p-0.5 transition",
                        star <= reviewRating
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-muted-foreground/25 hover:text-muted-foreground/60"
                      )}
                      title={`${star} Star Score`}
                    >
                      <Star size={15} fill={star <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade Selection Buttons */}
            <div className="grid grid-cols-6 gap-2">
              {(["A+", "A", "B", "C", "D", "F"] as ExecutionGrade[]).map((grade) => {
                const config = GRADE_CONFIG[grade];
                const isActive = executionGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setExecutionGrade(grade)}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl border text-sm font-extrabold transition",
                      isActive
                        ? cn(config.border, config.bg, config.color, "shadow-xs")
                        : "border-border/70 bg-card hover:bg-secondary/50 text-muted-foreground"
                    )}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>

            {/* Selected Grade Helper Box */}
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <span className={cn("font-bold mr-1.5", GRADE_CONFIG[executionGrade].color)}>
                {GRADE_CONFIG[executionGrade].label}:
              </span>
              <span>{GRADE_CONFIG[executionGrade].desc}</span>
            </div>
          </section>

          {/* ────── SECTION 3: BEHAVIORAL & TACTICAL TAGS ────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-[11px] font-bold text-violet-300">
                3
              </span>
              <h4 className="text-sm font-bold tracking-tight text-foreground">
                Behavioral &amp; Tactical Tags
              </h4>
            </div>

            {/* Strengths & Disciplined Habits */}
            <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3 sm:p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ThumbsUp size={13} />
                  <span>Strengths &amp; Disciplined Habits</span>
                </div>
                {selectedStrengths.length > 0 && (
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    {selectedStrengths.length} selected
                  </span>
                )}
              </div>

              {/* Strength pills (Predefined + Custom) */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {POSITIVE_HABIT_TAGS.map((tag) => {
                  const isSelected = selectedStrengths.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleStrength(tag)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                        isSelected
                          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 shadow-xs"
                          : "border-border/60 bg-card/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span>{tag}</span>
                      {isSelected && <span className="text-[10px] font-bold text-emerald-400">✓</span>}
                    </button>
                  );
                })}

                {/* Custom Strengths added by user */}
                {customStrengthsList.map((customTag) => {
                  const isSelected = selectedStrengths.includes(customTag);
                  return (
                    <div
                      key={customTag}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                        isSelected
                          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 shadow-xs"
                          : "border-border/60 bg-card/80 text-muted-foreground"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStrength(customTag)}
                        className="flex items-center gap-1"
                      >
                        <span>{customTag}</span>
                        {isSelected && <span className="text-[10px] font-bold text-emerald-400">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCustomStrength(customTag)}
                        className="ml-1 text-muted-foreground/70 hover:text-rose-400 transition"
                        title="Remove custom strength"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom Strength Input */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={customStrengthInput}
                  onChange={(e) => setCustomStrengthInput(e.target.value)}
                  placeholder="Add custom strength (e.g. Scaled out at 2R target)..."
                  className="h-8 text-xs bg-background/70 border-border/70 focus-visible:ring-emerald-500/30"
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
                  className="h-8 shrink-0 px-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30"
                >
                  <Plus size={13} className="mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Psychological & Tactical Leaks */}
            <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-3 sm:p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <Flame size={13} />
                  <span>Execution Leaks &amp; Psychological Traps</span>
                </div>
                {selectedLeaks.length > 0 && (
                  <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    {selectedLeaks.length} selected
                  </span>
                )}
              </div>

              {/* Leak pills (Predefined + Custom) */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {LEAK_TAGS.map((tag) => {
                  const isSelected = selectedLeaks.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleLeak(tag)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                        isSelected
                          ? "border-rose-500/60 bg-rose-500/20 text-rose-200 shadow-xs"
                          : "border-border/60 bg-card/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span>{tag}</span>
                      {isSelected && <span className="text-[10px] font-bold text-rose-400">✓</span>}
                    </button>
                  );
                })}

                {/* Custom Leaks added by user */}
                {customLeaksList.map((customTag) => {
                  const isSelected = selectedLeaks.includes(customTag);
                  return (
                    <div
                      key={customTag}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                        isSelected
                          ? "border-rose-500/60 bg-rose-500/20 text-rose-200 shadow-xs"
                          : "border-border/60 bg-card/80 text-muted-foreground"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleLeak(customTag)}
                        className="flex items-center gap-1"
                      >
                        <span>{customTag}</span>
                        {isSelected && <span className="text-[10px] font-bold text-rose-400">✓</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCustomLeak(customTag)}
                        className="ml-1 text-muted-foreground/70 hover:text-rose-400 transition"
                        title="Remove custom leak"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom Leak Input */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={customLeakInput}
                  onChange={(e) => setCustomLeakInput(e.target.value)}
                  placeholder="Add custom leak (e.g. Traded into high-impact CPI release)..."
                  className="h-8 text-xs bg-background/70 border-border/70 focus-visible:ring-rose-500/30"
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
                  className="h-8 shrink-0 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                >
                  <Plus size={13} className="mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </section>

          {/* ────── SECTION 4: TRADE SCREENSHOTS & CHART EVIDENCE ────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-[11px] font-bold text-violet-300">
                  4
                </span>
                <h4 className="text-sm font-bold tracking-tight text-foreground">
                  Trade Screenshots &amp; Multi-Chart Evidence
                </h4>
              </div>

              {screenshots.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                    {screenshots.length} {screenshots.length === 1 ? "Image" : "Images"} Attached
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2 text-xs font-semibold"
                  >
                    <Plus size={12} className="mr-1" /> Add More
                  </Button>
                </div>
              )}
            </div>

            {/* Hidden File Input for Multiple Uploads */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Empty State / Upload Placeholder Dropzone */}
            {screenshots.length === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-7",
                  isDragging
                    ? "border-violet-500 bg-violet-500/10 scale-[0.99]"
                    : "border-border/80 bg-secondary/15 hover:border-violet-500/50 hover:bg-secondary/30"
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-inner transition group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:text-violet-300">
                  <UploadCloud size={24} />
                </div>

                <div className="mt-3.5 space-y-1">
                  <p className="text-xs font-bold text-foreground sm:text-sm">
                    Drop multiple chart screenshots here, or{" "}
                    <span className="text-violet-400 underline decoration-violet-500/40 underline-offset-2">
                      browse files
                    </span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground max-w-sm">
                    Attach HTF directional bias, execution entry, exit / tape, and trade management charts.
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="rounded-md border border-border/70 bg-card px-2 py-0.5 font-medium">
                    Supports Multiple Files
                  </span>
                  <span className="rounded-md border border-border/70 bg-card px-2 py-0.5 font-medium">
                    PNG, JPG, WebP
                  </span>
                  <span className="rounded-md border border-border/70 bg-card px-2 py-0.5 font-medium">
                    Paste with Ctrl+V
                  </span>
                </div>
              </div>
            ) : (
              /* Attached Screenshots Grid */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {screenshots.map((src, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video overflow-hidden rounded-xl border border-border/80 bg-black/60 shadow-xs transition hover:border-violet-500/50"
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={src}
                        alt={`Trade screenshot ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Chart Index Badge */}
                      <div className="absolute top-1.5 left-1.5 z-10 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-xs">
                        Chart #{idx + 1}
                      </div>

                      {/* Hover Overlay with Action Buttons */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 backdrop-blur-2xs transition-opacity duration-200 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="flex size-7 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                          title="View Fullscreen"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx)}
                          className="flex size-7 items-center justify-center rounded-lg bg-rose-500/80 text-white backdrop-blur-sm transition hover:bg-rose-500"
                          title="Remove Screenshot"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Secondary Dropzone Strip for adding more images */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 px-3 text-center transition",
                    isDragging
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-border/70 bg-secondary/15 hover:border-violet-500/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Camera size={14} className="text-violet-400" />
                  <span className="text-xs font-medium">
                    Drag &amp; drop more images or click to add • <kbd className="text-[10px] font-mono opacity-80">Ctrl+V</kbd> to paste
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ────── SECTION 5: RETROSPECTIVE REFLECTIONS ────── */}
          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-md bg-violet-500/15 text-[11px] font-bold text-violet-300">
                5
              </span>
              <h4 className="text-sm font-bold tracking-tight text-foreground">
                Retrospective Reflection &amp; Actionable Rules
              </h4>
            </div>

            <div className="space-y-3">
              {/* What Went Well */}
              <div className="space-y-1.5">
                <Label htmlFor="review-went-well" className="text-xs font-medium text-foreground">
                  What went well? <span className="text-emerald-400 font-semibold">(Wins &amp; Confirmation)</span>
                </Label>
                <textarea
                  id="review-went-well"
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  placeholder="e.g. Waited for 5m candle close confirmation, honored planned stop loss without hesitation."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Primary Leak to Fix */}
              <div className="space-y-1.5">
                <Label htmlFor="review-improve" className="text-xs font-medium text-foreground">
                  Primary leak or mistake to eliminate <span className="text-rose-400 font-semibold">(Critical Leak)</span>
                </Label>
                <textarea
                  id="review-improve"
                  value={whatToImprove}
                  onChange={(e) => setWhatToImprove(e.target.value)}
                  placeholder="e.g. Cut winner too early on fear of pullback instead of trailing structural pivot."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Actionable Rule for Next Time */}
              <div className="space-y-1.5">
                <Label htmlFor="review-lesson" className="text-xs font-medium text-foreground">
                  Actionable Rule for Next Time <span className="text-violet-400 font-semibold">(Takeaway Rule)</span>
                </Label>
                <textarea
                  id="review-lesson"
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="e.g. Do not enter in the first 5 minutes of NY Open without HTF directional trend confirmation."
                  rows={2}
                  className="w-full rounded-xl border border-input bg-card p-3 text-xs leading-relaxed text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ═══════════════ 3. FIXED BOTTOM FOOTER ═══════════════ */}
        <div className="shrink-0 border-t border-border/80 bg-card px-5 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {trade.reviewStatus === "reviewed" && (
                <button
                  type="button"
                  onClick={handleMarkUnreviewed}
                  disabled={saving}
                  className="text-xs font-medium text-muted-foreground transition hover:text-rose-400 underline"
                >
                  Reset trade to Unreviewed
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
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
                className="h-9 gap-1.5 bg-violet-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-violet-500"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    {hasNext ? "Save & Next Trade" : "Save Review"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════ LIGHTBOX MODAL ═══════════════ */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged screenshot preview"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar inside Lightbox */}
          <div
            className="flex w-full max-w-5xl items-center justify-between pb-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold">
                Chart #{lightboxIndex + 1} of {screenshots.length}
              </span>
              <span className="text-xs text-white/70 font-medium">
                {trade.symbol} • Screenshot Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleRemoveScreenshot(lightboxIndex);
                }}
                className="h-8 gap-1 border-rose-500/40 bg-rose-500/15 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 hover:text-white"
              >
                <Trash2 size={13} />
                Delete
              </Button>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                title="Close lightbox"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Image Container */}
          <div
            className="relative flex max-h-[82vh] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[lightboxIndex]}
              alt={`Trade chart screenshot ${lightboxIndex + 1}`}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />

            {/* Prev / Next controls */}
            {screenshots.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1
                    )
                  }
                  className="absolute left-3 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/90 hover:scale-105"
                  title="Previous image"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-3 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/90 hover:scale-105"
                  title="Next image"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
