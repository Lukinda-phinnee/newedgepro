"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useActiveAccount } from "@/components/active-account-context";
import { InstrumentSearchSelect } from "@/components/trade-log/instrument-search-select";
import { calculatePipInfo } from "@/lib/pips";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

function compressImage(file: File): Promise<string> {
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

interface LogTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTradeLogged: (trade: Trade) => void;
}

const POPULAR_STRATEGIES = [
  "None",
  "Opening Range Breakout",
  "VWAP Rejection",
  "Fair Value Gap",
  "Break & Retest",
  "Liquidity Sweep",
  "Key Level Reversal",
  "Trend Continuation",
  "Other / Custom",
];

const MARKET_SESSIONS = [
  "Sydney",
  "Tokyo",
  "London",
  "New York",
  "London / New York Overlap",
  "Off-Hours",
];

const MARKET_CONDITIONS = [
  "Trend",
  "Range",
  "Breakout",
  "Reversal",
  "Choppy",
  "Low Volatility",
  "High Volatility",
  "News-Driven",
];

export function LogTradeDialog({
  open,
  onOpenChange,
  onTradeLogged,
}: LogTradeDialogProps) {
  const { showFeedback } = useOperationFeedback();
  const { accounts, activeAccount } = useActiveAccount();

  const [accountId, setAccountId] = useState(activeAccount?.id || accounts[0]?.id || "");
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("0.1");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [plannedEntry, setPlannedEntry] = useState("");
  const [isPlanned, setIsPlanned] = useState<boolean>(true);
  const [strategy, setStrategy] = useState("None");
  const [customStrategy, setCustomStrategy] = useState("");
  const [marketSession, setMarketSession] = useState("");
  const [marketCondition, setMarketCondition] = useState("Trend");
  const [confidence, setConfidence] = useState<number>(0);
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global paste handler: Ctrl+V chart screenshots directly while logging trade
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

  // Handle files compression & addition
  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    try {
      const compressedList = await Promise.all(list.map((f) => compressImage(f)));
      setScreenshots((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error("Error processing screenshots:", err);
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

  // Live PnL calculation
  const entryNum = Number(entryPrice) || 0;
  const exitNum = Number(exitPrice) || 0;
  const qtyNum = Number(quantity) || 1;

  let calculatedPnl = 0;
  let calculatedPnlPercent = 0;
  if (entryNum > 0 && exitNum > 0) {
    calculatedPnl = side === "long" ? (exitNum - entryNum) * qtyNum : (entryNum - exitNum) * qtyNum;
    calculatedPnlPercent = (calculatedPnl / (entryNum * qtyNum)) * 100;
  }

  // Live auto calculation of pips and risk/reward
  const pipInfo = useMemo(() => {
    return calculatePipInfo(
      symbol,
      entryNum,
      exitNum > 0 ? exitNum : null,
      side,
      stopLoss ? Number(stopLoss) : null,
      takeProfit ? Number(takeProfit) : null
    );
  }, [symbol, entryNum, exitNum, side, stopLoss, takeProfit]);

  const resetForm = () => {
    setSymbol("");
    setSide("long");
    setEntryPrice("");
    setExitPrice("");
    setQuantity("0.1");
    setStopLoss("");
    setTakeProfit("");
    setPlannedEntry("");
    setIsPlanned(true);
    setStrategy("None");
    setCustomStrategy("");
    setMarketSession("");
    setMarketCondition("Trend");
    setConfidence(0);
    setOpenedAt(new Date().toISOString().slice(0, 16));
    setNotes("");
    setScreenshots([]);
    setLightboxIndex(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError("Please select a trading account.");
      return;
    }
    if (!symbol.trim()) {
      setError("Please search and select an instrument.");
      return;
    }
    if (entryNum <= 0) {
      setError("Entry price must be greater than 0.");
      return;
    }
    if (qtyNum <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const chosenStrategy =
        strategy === "Other / Custom" ? customStrategy.trim() || null
        : strategy === "None" ? null
        : strategy || null;

      const formattedNotes = notes.trim()
        ? (!isPlanned && !notes.includes("[Unplanned]") ? `[Unplanned] ${notes.trim()}` : notes.trim())
        : (!isPlanned ? "[Unplanned Trade]" : null);

      const tradePayload = {
        accountId,
        symbol: symbol.trim().toUpperCase(),
        side,
        entryPrice: entryNum,
        exitPrice: exitNum > 0 ? exitNum : null,
        quantity: qtyNum,
        stopLoss: stopLoss ? Number(stopLoss) : null,
        takeProfit: takeProfit ? Number(takeProfit) : null,
        plannedEntry: plannedEntry ? Number(plannedEntry) : null,
        pnl: exitNum > 0 ? calculatedPnl : 0,
        pnlPercentage: exitNum > 0 ? calculatedPnlPercent : 0,
        status: exitNum > 0 ? "closed" : "open",
        strategy: chosenStrategy,
        marketSession: marketSession || null,
        marketCondition: marketCondition || null,
        confidence: confidence > 0 ? confidence : null,
        notes: formattedNotes,
        openedAt: new Date(openedAt).toISOString(),
        closedAt: exitNum > 0 ? new Date().toISOString() : null,
        reviewStatus: "unreviewed" as const,
        screenshots,
      };

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log trade");
      }

      onTradeLogged(data.trade);
      handleClose();
    } catch (err: unknown) {
      showFeedback({ kind: "failure", title: "Trade wasn’t logged", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ───── Section label helper ───── */
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
        <div className="relative border-b border-border/80 bg-gradient-to-b from-card to-card/60 p-5 sm:p-6">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
          >
            <X size={18} />
          </button>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Log New Trade
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a new execution to your journal
          </DialogDescription>

          {/* ─── DIRECTION ─── */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">DIRECTION</Label>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-background/50 p-1">
                <button
                  type="button"
                  onClick={() => setSide("long")}
                  className={`flex h-7 items-center justify-center gap-1 rounded-md text-xs font-semibold transition ${
                    side === "long"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowUpRight size={13} />
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => setSide("short")}
                  className={`flex h-7 items-center justify-center gap-1 rounded-md text-xs font-semibold transition ${
                    side === "short"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowDownLeft size={13} />
                  Short
                </button>
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Trading Account</Label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* ═══════════════ MARKET SELECTION & EXECUTION ═══════════════ */}
          <SectionLabel>Market Selection &amp; Execution</SectionLabel>

          {/* Instrument & Volume */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-symbol" className="text-xs">
                INSTRUMENT
              </Label>
              <InstrumentSearchSelect
                id="trade-symbol"
                value={symbol}
                onChange={(sym) => setSymbol(sym)}
                placeholder="Search pair (e.g. NQ, EURUSD, AAPL)..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trade-qty" className="text-xs">
                TRADE VOLUME (LOTS)
              </Label>
              <Input
                id="trade-qty"
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="h-9 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Trade Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-time" className="text-xs">
                TRADE DATE
              </Label>
              <Input
                id="trade-time"
                type="datetime-local"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Entry & Exit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-entry" className="text-xs">
                ENTRY PRICE
              </Label>
              <Input
                id="trade-entry"
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Entry price"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trade-exit" className="text-xs">
                EXIT PRICE <span className="text-muted-foreground">(Required for outcome)</span>
              </Label>
              <Input
                id="trade-exit"
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="Required for outcome"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Live PnL Preview Banner with Auto Pips */}
          {exitNum > 0 && entryNum > 0 && (
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-2.5 rounded-xl border p-3 sm:p-3.5 transition",
                calculatedPnl >= 0
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold">Estimated Realized P&L:</span>
                {pipInfo.pipsFormatted && (
                  <span className="rounded-md border border-current/25 bg-background/60 px-2 py-0.5 text-xs font-bold tracking-tight">
                    {pipInfo.pipsFormatted}
                  </span>
                )}
                {pipInfo.rMultiple !== null && (
                  <span className="text-xs font-medium opacity-85">
                    ({pipInfo.rMultiple >= 0 ? "+" : ""}{pipInfo.rMultiple}R)
                  </span>
                )}
              </div>
              <span className="text-sm font-extrabold tracking-tight">
                {calculatedPnl >= 0 ? "+" : ""}${calculatedPnl.toFixed(2)} (
                {calculatedPnlPercent >= 0 ? "+" : ""}
                {calculatedPnlPercent.toFixed(2)}%)
              </span>
            </div>
          )}

          {/* ═══════════════ PLAN VERIFICATION ═══════════════ */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Plan Verification
            </span>

            {/* Planned vs Unplanned Tabs */}
            <div className="inline-flex rounded-lg border border-border/80 bg-background/60 p-0.5">
              <button
                type="button"
                onClick={() => setIsPlanned(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition",
                  isPlanned
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CheckCircle2 size={13} />
                Planned Trade
              </button>
              <button
                type="button"
                onClick={() => setIsPlanned(false)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition",
                  !isPlanned
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-rose-400"
                )}
              >
                <AlertTriangle size={13} />
                Unplanned Trade
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-planned-entry" className="text-xs">
                PLANNED ENTRY
              </Label>
              <Input
                id="trade-planned-entry"
                type="number"
                step="any"
                value={plannedEntry}
                onChange={(e) => setPlannedEntry(e.target.value)}
                placeholder="Planned entry"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="trade-sl" className="text-xs">
                  STOP LOSS
                </Label>
                {pipInfo.slPips !== null && (
                  <span className="text-[10px] font-semibold text-rose-400">
                    -{pipInfo.slPips} {pipInfo.unit}
                  </span>
                )}
              </div>
              <Input
                id="trade-sl"
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Stop loss"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="trade-tp" className="text-xs">
                  TAKE PROFIT
                </Label>
                {pipInfo.tpPips !== null && (
                  <span className="text-[10px] font-semibold text-emerald-400">
                    +{pipInfo.tpPips} {pipInfo.unit}
                  </span>
                )}
              </div>
              <Input
                id="trade-tp"
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Take profit"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Planned Risk to Reward summary pill */}
          {pipInfo.riskRewardRatio && (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="text-[11px]">Planned Risk / Reward Ratio:</span>
              <span className="font-semibold text-foreground">
                {pipInfo.riskRewardRatio} R
              </span>
            </div>
          )}

          {/* Rule Engine Discipline Pre-flight Check */}
          {entryPrice && (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition duration-200">
              {stopLoss ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span className="text-[11px] font-medium">
                    Rule Guardrail: Stop Loss defined (${Number(stopLoss).toLocaleString()}). Compliant with safety criteria.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span className="text-[11px] font-medium">
                    Rule Warning: No stop loss defined. Will register as a rule discipline deviation upon logging.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ STRATEGY & CONTEXT ═══════════════ */}
          <SectionLabel>Strategy &amp; Context</SectionLabel>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-strat" className="text-xs">
                STRATEGY
              </Label>
              <select
                id="trade-strat"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {POPULAR_STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trade-session" className="text-xs">
                MARKET SESSION
              </Label>
              <select
                id="trade-session"
                value={marketSession}
                onChange={(e) => setMarketSession(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select session...</option>
                {MARKET_SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {strategy === "Other / Custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="trade-custom-strat" className="text-xs">
                Specify Strategy Name
              </Label>
              <Input
                id="trade-custom-strat"
                value={customStrategy}
                onChange={(e) => setCustomStrategy(e.target.value)}
                placeholder="e.g. Asia High Sweep, News Spike"
                className="h-9 text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trade-condition" className="text-xs">
                CONDITION
              </Label>
              <select
                id="trade-condition"
                value={marketCondition}
                onChange={(e) => setMarketCondition(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {MARKET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">CONFIDENCE</Label>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidence(confidence === level ? 0 : level)}
                    className={`rounded-md p-1 transition ${
                      level <= confidence
                        ? "text-amber-400 hover:text-amber-300"
                        : "text-muted-foreground/30 hover:text-muted-foreground/60"
                    }`}
                    title={`Confidence: ${level}/5`}
                  >
                    <Star
                      size={18}
                      fill={level <= confidence ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
                {confidence > 0 && (
                  <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                    {confidence}/5
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="trade-notes" className="text-xs">
              Trade Notes & Psychology <span className="text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="trade-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you observe? Why did you enter? Did you follow your rules?"
              rows={2}
              className="flex w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Trade Screenshots & Evidence Upload */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Trade Screenshots &amp; Charts <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              {screenshots.length > 0 && (
                <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                  {screenshots.length} {screenshots.length === 1 ? "Image" : "Images"}
                </span>
              )}
            </div>

            {/* Hidden multiple file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {screenshots.length === 0 ? (
              /* Dropzone Placeholder when no images */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all",
                  isDragging
                    ? "border-violet-500 bg-violet-500/10 scale-[0.99]"
                    : "border-border/80 bg-secondary/15 hover:border-violet-500/50 hover:bg-secondary/30"
                )}
              >
                <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-inner transition group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:text-violet-300">
                  <UploadCloud size={22} />
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-xs font-bold text-foreground">
                    Upload trade screenshots, or{" "}
                    <span className="text-violet-400 underline decoration-violet-500/40 underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Attach multiple charts (entry, exit, HTF context). Paste directly with Ctrl+V.
                  </p>
                </div>
              </div>
            ) : (
              /* Grid of preview images + matching-size 'Add Another' card */
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {screenshots.map((src, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-border/80 bg-black/60 shadow-xs transition hover:border-violet-500/50"
                  >
                    <img
                      src={src}
                      alt={`Trade chart ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute top-1.5 left-1.5 z-10 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-xs">
                      #{idx + 1}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 backdrop-blur-2xs transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="flex size-7 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                        title="View Fullscreen"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot(idx)}
                        className="flex size-7 items-center justify-center rounded-lg bg-rose-500/80 text-white backdrop-blur-sm transition hover:bg-rose-500"
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 'Add Another Image' button - EXACT same aspect-video size as the image previews */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "group relative aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
                    isDragging
                      ? "border-violet-500 bg-violet-500/15"
                      : "border-border/70 bg-secondary/15 hover:border-violet-500/60 hover:bg-secondary/30"
                  )}
                  title="Add Another Image"
                >
                  <div className="flex size-8 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground shadow-xs transition group-hover:border-violet-500/40 group-hover:bg-violet-500/15 group-hover:text-violet-300 group-hover:scale-110">
                    <Plus size={16} />
                  </div>
                  <span className="mt-1.5 text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                    Add Image
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 gap-1.5 bg-violet-600 px-5 text-xs font-medium text-white shadow-sm hover:bg-violet-500"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving trade...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Record Trade
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Fullscreen Screenshot Lightbox Modal */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-[92vw] flex-col items-center"
          >
            {/* Lightbox Controls Header */}
            <div className="mb-2 flex w-full items-center justify-between text-xs text-white/90">
              <span className="rounded-md bg-white/10 px-2.5 py-1 font-semibold backdrop-blur-sm">
                Chart #{lightboxIndex + 1} of {screenshots.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="flex size-8 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lightbox Image */}
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-black/80 shadow-2xl">
              <img
                src={screenshots[lightboxIndex]}
                alt={`Screenshot #${lightboxIndex + 1}`}
                className="max-h-[80vh] max-w-[90vw] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
