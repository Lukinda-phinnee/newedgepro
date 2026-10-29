"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Plus,
  Search,
  Shield,
  Layers,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ChecklistItem,
  CreateStrategyInput,
  Strategy,
  StrategyCategory,
  StrategyStatus,
} from "@/types/strategy";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import { cn } from "@/lib/utils";

interface AddStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: (saved: Strategy) => void;
  editingStrategy?: Strategy | null;
}

interface InstrumentItem {
  symbol: string;
  rawSymbol?: string;
  name: string;
  type: string;
  exchange: string;
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  Futures: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Forex: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Crypto: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Equity: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ETF: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Index: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
};

const SESSION_OPTIONS = [
  "London Open",
  "New York AM",
  "New York PM",
  "Asia Session",
  "London Close",
];

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const STATUS_OPTIONS: { value: StrategyStatus; label: string; desc: string }[] = [
  { value: "ACTIVE", label: "Active", desc: "Deployed with full position sizing" },
  { value: "CALIBRATING", label: "Calibrating", desc: "Paper or reduced size while gathering data" },
];

// Spring for step transitions
const springStep = { type: "spring" as const, damping: 26, stiffness: 280 };

type Step = 1 | 2 | 3 | 4 | 5;

export function AddStrategyModal({
  open,
  onOpenChange,
  onSaveSuccess,
  editingStrategy,
}: AddStrategyModalProps) {
  const { showFeedback } = useOperationFeedback();
  const isEditing = !!editingStrategy;
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // ─── Step 1: Core Identity ───
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [status, setStatus] = useState<StrategyStatus>("CALIBRATING");
  const [assets, setAssets] = useState<string[]>([]);
  const [marketRegime, setMarketRegime] = useState("High Volatility Trend");

  // Instrument Search & Select State
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [assetSearchResults, setAssetSearchResults] = useState<InstrumentItem[]>([]);
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [assetSelectedIndex, setAssetSelectedIndex] = useState(0);
  const assetContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (assetContainerRef.current && !assetContainerRef.current.contains(e.target as Node)) {
        setAssetDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Online search with debounce
  useEffect(() => {
    if (!assetDropdownOpen) return;

    const trimmed = assetSearchQuery.trim();
    if (!trimmed) {
      setAssetSearchLoading(true);
      fetch(`/api/instruments/search?q=NQ`)
        .then((r) => r.json())
        .then((data) => {
          setAssetSearchResults(data.instruments || []);
          setAssetSelectedIndex(0);
        })
        .catch(() => setAssetSearchResults([]))
        .finally(() => setAssetSearchLoading(false));
      return;
    }

    setAssetSearchLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/instruments/search?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data) => {
          setAssetSearchResults(data.instruments || []);
          setAssetSelectedIndex(0);
        })
        .catch(() => {
          setAssetSearchResults([]);
        })
        .finally(() => {
          setAssetSearchLoading(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [assetSearchQuery, assetDropdownOpen]);

  // ─── Step 2: Edge Targets ───
  const [winRateTarget, setWinRateTarget] = useState(60);
  const [expectancyR, setExpectancyR] = useState(0.85);
  const [edgeScore, setEdgeScore] = useState(75);

  // ─── Step 3: Risk Guardrails ───
  const [maxRiskPercent, setMaxRiskPercent] = useState(1.0);
  const [minRrRatio, setMinRrRatio] = useState(2.0);
  const [invalidationRule, setInvalidationRule] = useState("");
  const [killSwitchRule, setKillSwitchRule] = useState("");

  // ─── Step 4: Execution Window ───
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["New York AM"]);
  const [killZoneStart, setKillZoneStart] = useState("09:30");
  const [killZoneEnd, setKillZoneEnd] = useState("11:30");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Tuesday", "Wednesday", "Thursday"]);
  const [newsBlackoutRule, setNewsBlackoutRule] = useState("Blackout 15m before/after high-impact news");
  const [thesis, setThesis] = useState("");

  // ─── Step 5: Playbook & Exit Rules (Optional) ───
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCriterion, setNewCriterion] = useState("");
  const [newPhase, setNewPhase] = useState<"PRE_CONDITION" | "TRIGGER" | "CONFIRMATION">("TRIGGER");
  const [tp1Ratio, setTp1Ratio] = useState(1.5);
  const [tp1Percent, setTp1Percent] = useState(50);
  const [tp2Ratio, setTp2Ratio] = useState(3.0);
  const [tp2Percent, setTp2Percent] = useState(35);
  const [runnerRule, setRunnerRule] = useState("Trail 15m structure pivot");
  const [breakevenRule, setBreakevenRule] = useState("Move to breakeven after TP1");
  const [timeStopMinutes, setTimeStopMinutes] = useState<number | undefined>(45);

  useEffect(() => {
    if (open && editingStrategy) {
      setStep(1);
      setName(editingStrategy.name || "");
      const existingCats = editingStrategy.category
        ? editingStrategy.category.split(/,\s*/).map((c) => c.trim()).filter(Boolean)
        : [];
      setCategories(existingCats);
      setCategoryInput("");
      setStatus(editingStrategy.status || "CALIBRATING");
      setAssets(editingStrategy.assetUniverse || []);
      setMarketRegime(editingStrategy.marketRegime || "High Volatility Trend");
      setWinRateTarget(editingStrategy.winRateTarget ?? 60);
      setExpectancyR(editingStrategy.expectancyR ?? 0.85);
      setEdgeScore(editingStrategy.edgeScore ?? 75);
      setMaxRiskPercent(editingStrategy.maxRiskPercent ?? 1.0);
      setMinRrRatio(editingStrategy.minRrRatio ?? 2.0);
      setInvalidationRule(editingStrategy.invalidationRule || "");
      setKillSwitchRule(editingStrategy.killSwitchRule || "");
      setSelectedSessions(editingStrategy.tradingSessions || ["New York AM"]);
      setKillZoneStart(editingStrategy.killZoneStart || "09:30");
      setKillZoneEnd(editingStrategy.killZoneEnd || "11:30");
      setSelectedDays(editingStrategy.daysOfWeek || ["Tuesday", "Wednesday", "Thursday"]);
      setNewsBlackoutRule(
        editingStrategy.newsBlackoutRule || "Blackout 15m before/after high-impact news"
      );
      setThesis(editingStrategy.thesis || "");
      setChecklist(editingStrategy.entryChecklist || []);
      setNewCriterion("");
      setNewPhase("TRIGGER");
      setTp1Ratio(editingStrategy.exitStrategy?.tp1Ratio ?? 1.5);
      setTp1Percent(editingStrategy.exitStrategy?.tp1Percent ?? 50);
      setTp2Ratio(editingStrategy.exitStrategy?.tp2Ratio ?? 3.0);
      setTp2Percent(editingStrategy.exitStrategy?.tp2Percent ?? 35);
      setRunnerRule(editingStrategy.exitStrategy?.runnerRule || "Trail 15m structure pivot");
      setBreakevenRule(editingStrategy.exitStrategy?.breakevenRule || "Move to breakeven after TP1");
      setTimeStopMinutes(editingStrategy.exitStrategy?.timeStopMinutes ?? 45);
      setAssetSearchQuery("");
      setAssetDropdownOpen(false);
      setSaving(false);
    } else if (open && !editingStrategy) {
      resetForm();
    }
  }, [open, editingStrategy]);

  const resetForm = () => {
    setStep(1);
    setName("");
    setCategories([]);
    setCategoryInput("");
    setStatus("CALIBRATING");
    setAssets([]);
    setAssetSearchQuery("");
    setAssetDropdownOpen(false);
    setMarketRegime("High Volatility Trend");
    setWinRateTarget(60);
    setExpectancyR(0.85);
    setEdgeScore(75);
    setMaxRiskPercent(1.0);
    setMinRrRatio(2.0);
    setInvalidationRule("");
    setKillSwitchRule("");
    setSelectedSessions(["New York AM"]);
    setKillZoneStart("09:30");
    setKillZoneEnd("11:30");
    setSelectedDays(["Tuesday", "Wednesday", "Thursday"]);
    setNewsBlackoutRule("Blackout 15m before/after high-impact news");
    setThesis("");
    setChecklist([]);
    setNewCriterion("");
    setNewPhase("TRIGGER");
    setTp1Ratio(1.5);
    setTp1Percent(50);
    setTp2Ratio(3.0);
    setTp2Percent(35);
    setRunnerRule("Trail 15m structure pivot");
    setBreakevenRule("Move to breakeven after TP1");
    setTimeStopMinutes(45);
    setSaving(false);
  };

  const handleAddCategory = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
    setCategories((prev) => {
      const existingLower = new Set(prev.map((c) => c.toLowerCase()));
      const toAdd = parts.filter((p) => !existingLower.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setCategoryInput("");
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories((prev) => prev.filter((c) => c !== catToRemove));
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleSelectAsset = (sym: string) => {
    const upper = sym.trim().toUpperCase();
    if (upper && !assets.includes(upper)) {
      setAssets((prev) => [...prev, upper]);
    }
    setAssetSearchQuery("");
    setAssetDropdownOpen(false);
  };

  const handleRemoveAsset = (sym: string) => {
    setAssets((prev) => prev.filter((a) => a !== sym));
  };

  const handleAssetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!assetDropdownOpen) {
        setAssetDropdownOpen(true);
        return;
      }
      setAssetSelectedIndex((prev) =>
        prev < assetSearchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAssetSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        assetDropdownOpen &&
        assetSearchResults.length > 0 &&
        assetSearchResults[assetSelectedIndex]
      ) {
        handleSelectAsset(assetSearchResults[assetSelectedIndex].symbol);
      } else if (assetSearchQuery.trim()) {
        handleSelectAsset(assetSearchQuery.trim());
      }
    } else if (e.key === "Escape") {
      setAssetDropdownOpen(false);
    }
  };

  const handleAddCriterion = () => {
    const trimmed = newCriterion.trim();
    if (!trimmed) return;
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: trimmed,
      phase: newPhase,
      required: true,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewCriterion("");
  };

  const handleRemoveCriterion = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSession = (session: string) => {
    setSelectedSessions((prev) =>
      prev.includes(session)
        ? prev.filter((s) => s !== session)
        : [...prev, session]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const canProceed = (s: Step): boolean => {
    switch (s) {
      case 1:
        return (
          !!name.trim() &&
          (categories.length > 0 || !!categoryInput.trim()) &&
          assets.length > 0
        );
      case 2:
        return winRateTarget > 0 && expectancyR > 0;
      case 3:
        return maxRiskPercent > 0 && minRrRatio > 0;
      case 4:
        return selectedSessions.length > 0 && selectedDays.length > 0;
      case 5:
        return true; // Completely optional!
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const finalCategories = [...categories];
    if (categoryInput.trim()) {
      const parts = categoryInput.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (!finalCategories.some((c) => c.toLowerCase() === p.toLowerCase())) {
          finalCategories.push(p);
        }
      }
    }

    const inputData = {
      accountId: editingStrategy ? editingStrategy.accountId : null,
      name: name.trim(),
      category: finalCategories.length > 0 ? finalCategories.join(", ") : "General",
      version: editingStrategy ? editingStrategy.version : "v1.0",
      status,
      description: editingStrategy ? editingStrategy.description : null,
      thesis: thesis.trim() || null,
      assetUniverse: assets,
      marketRegime,
      edgeScore,
      expectancyR,
      winRateTarget,
      profitFactor: editingStrategy ? editingStrategy.profitFactor : 2.1,
      sampleSize: editingStrategy ? editingStrategy.sampleSize : 0,
      edgeStateNotes: editingStrategy ? editingStrategy.edgeStateNotes : null,
      maxRiskPercent,
      minRrRatio,
      invalidationRule: invalidationRule.trim() || null,
      stopLossLogic: editingStrategy ? editingStrategy.stopLossLogic : null,
      killSwitchRule: killSwitchRule.trim() || null,
      tradingSessions: selectedSessions,
      killZoneStart,
      killZoneEnd,
      timeZone: editingStrategy ? editingStrategy.timeZone : "EST (UTC-5)",
      daysOfWeek: selectedDays,
      newsBlackoutRule: newsBlackoutRule.trim() || null,
      entryChecklist: checklist,
      disqualifiers: editingStrategy ? editingStrategy.disqualifiers : [],
      exitStrategy: {
        tp1Ratio: Number(tp1Ratio) || 1.5,
        tp1Percent: Number(tp1Percent) || 50,
        tp2Ratio: Number(tp2Ratio) || 3.0,
        tp2Percent: Number(tp2Percent) || 35,
        runnerRule: runnerRule.trim() || undefined,
        breakevenRule: breakevenRule.trim() || "Move to breakeven after TP1",
        timeStopMinutes: timeStopMinutes ? Number(timeStopMinutes) : undefined,
      },
      refinements: editingStrategy ? editingStrategy.refinements : [],
      tradeManagementRules: editingStrategy ? (editingStrategy.tradeManagementRules || []) : [],
      entryModelImages: editingStrategy ? (editingStrategy.entryModelImages || []) : [],
    };

    try {
      let saved: Strategy;
      if (editingStrategy) {
        const res = await fetch(`/api/strategies/${editingStrategy.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update strategy");
        }

        const data = await res.json();
        saved = data.strategy;
      } else {
        const res = await fetch("/api/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create strategy");
        }

        const data = await res.json();
        saved = data.strategy;
      }

      onSaveSuccess(saved);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      showFeedback({ kind: "failure", title: "Strategy wasn’t saved", description: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const stepLabels: Record<Step, { title: string; subtitle: string }> = {
    1: {
      title: "Core Identity",
      subtitle: isEditing
        ? "Edit edge identity and asset universe"
        : "Name your edge and define its asset universe",
    },
    2: {
      title: "Edge Baseline Targets",
      subtitle: isEditing
        ? "Adjust statistical performance benchmarks"
        : "Set statistical performance benchmarks",
    },
    3: {
      title: "Risk Guardrails",
      subtitle: isEditing
        ? "Update hard risk limits and invalidation rules"
        : "Define hard risk limits and invalidation rules",
    },
    4: {
      title: "Execution Window & Thesis",
      subtitle: isEditing
        ? "Refine market timing and theoretical premise"
        : "Time your edge and document the premise",
    },
    5: {
      title: "Playbook & Exit Rules (Optional)",
      subtitle: isEditing
        ? "Optionally refine entry checklist and exit targets"
        : "Optionally add entry criteria & scale-outs, or skip to finish",
    },
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Layers size={18} />
              </span>
              <div>
                <DialogTitle className="text-base text-foreground font-semibold">
                  {isEditing ? `Edit Strategy: ${editingStrategy.name}` : "New Trading Strategy"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {stepLabels[step].subtitle}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { resetForm(); onOpenChange(false); }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-1.5 mt-5 mb-4">
            {([1, 2, 3, 4, 5] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => { if (isEditing || s < step) setStep(s); }}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[11px] font-bold border transition-all cursor-pointer",
                    s === step
                      ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30"
                      : isEditing || s < step
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-white/[0.04] text-muted-foreground border-border/60"
                  )}
                >
                  {s < step ? <Check size={13} /> : s}
                </button>
                {s < 5 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 rounded-full",
                      s < step ? "bg-emerald-500/40" : "bg-border/50"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-5 pb-5 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={springStep}
            >
              {/* ─── Step 1: Core Identity ─── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Strategy Name *
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. London Liquidity Sweep & Displacement"
                      className="h-10 text-sm text-foreground font-medium"
                      autoFocus
                    />
                  </div>

                  {/* Setup Categories (Multi-category / Custom Add) */}
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                      <span>Setup Categories *</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Add one or multiple setup categories</span>
                    </Label>

                    {/* Active Categories Badges */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-white/[0.02] border border-border/40">
                        {categories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-500/15 text-foreground border border-violet-500/30 shadow-xs"
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              aria-label={`Remove category ${cat}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Input
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onKeyDown={handleCategoryKeyDown}
                        placeholder="Type setup category (e.g. Silver Bullet, Liquidity Sweep) and press Enter..."
                        className="h-10 text-sm text-foreground font-medium flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!categoryInput.trim()}
                        className="h-10 px-3.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Asset Universe with Search & Select (Live API Connected) */}
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                      <span>Asset Universe *</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Search and select instruments</span>
                    </Label>

                    <div ref={assetContainerRef} className="relative w-full">
                      <div className="relative flex items-center">
                        <Search
                          size={14}
                          className="pointer-events-none absolute left-3 text-muted-foreground/60"
                        />
                        <input
                          type="text"
                          value={assetSearchQuery}
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="Search pairs & markets (e.g. NQ, EURUSD, AAPL, Gold)..."
                          onFocus={() => setAssetDropdownOpen(true)}
                          onChange={(e) => {
                            setAssetSearchQuery(e.target.value);
                            if (!assetDropdownOpen) setAssetDropdownOpen(true);
                          }}
                          onKeyDown={handleAssetKeyDown}
                          className="flex h-9 w-full min-w-0 rounded-lg border border-border/80 bg-background/50 pl-8 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        />
                        <div className="absolute right-2.5 flex items-center gap-1">
                          {assetSearchLoading && (
                            <Loader2 size={13} className="animate-spin text-violet-400" />
                          )}
                          {assetSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAssetSearchQuery("")}
                              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Results from API */}
                      {assetDropdownOpen && (
                        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-md p-1">
                          {assetSearchResults.length > 0 ? (
                            assetSearchResults.map((item, idx) => {
                              const isSelected = assets.includes(item.symbol.toUpperCase());
                              const isHighlighted = idx === assetSelectedIndex;

                              return (
                                <button
                                  key={item.symbol + idx}
                                  type="button"
                                  onClick={() => handleSelectAsset(item.symbol)}
                                  onMouseEnter={() => setAssetSelectedIndex(idx)}
                                  className={cn(
                                    "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer",
                                    isHighlighted ? "bg-violet-500/15 text-foreground" : "text-foreground/90 hover:bg-white/[0.04]"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono font-bold text-foreground text-xs">
                                      {item.symbol}
                                    </span>
                                    <span className="truncate text-[11px] text-muted-foreground">
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className={cn("text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold", TYPE_BADGE_STYLES[item.type] || "bg-white/[0.05] text-muted-foreground border-border/40")}>
                                      {item.type}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono">
                                      {item.exchange}
                                    </span>
                                    {isSelected && (
                                      <Check size={12} className="text-emerald-400 ml-1" />
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                              {assetSearchLoading ? "Searching instruments..." : `Press Enter to add "${assetSearchQuery.trim().toUpperCase()}"`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Assets Pill List */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap min-h-[28px]">
                      {assets.map((sym) => (
                        <span
                          key={sym}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 text-foreground border border-violet-500/25 text-xs font-mono font-semibold"
                        >
                          {sym}
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(sym)}
                            className="text-muted-foreground hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      {assets.length === 0 && (
                        <span className="text-[11px] text-muted-foreground italic">
                          No instruments selected yet. Search and select above.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Market Regime
                      </Label>
                      <Input
                        value={marketRegime}
                        onChange={(e) => setMarketRegime(e.target.value)}
                        placeholder="e.g. Session Expansion"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Initial Status
                      </Label>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(opt.value)}
                            className={cn(
                              "flex-1 text-[11px] font-medium px-2 py-2 rounded-xl border text-center transition-all",
                              status === opt.value
                                ? opt.value === "ACTIVE"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                  : "bg-amber-500/15 text-amber-400 border-amber-500/40"
                                : "bg-white/[0.03] text-muted-foreground border-border/60 hover:text-foreground"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Step 2: Baseline Edge Targets ─── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Win Rate Target
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={winRateTarget}
                          onChange={(e) => setWinRateTarget(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-foreground focus:outline-none focus:border-violet-500"
                          min={1}
                          max={100}
                          step={1}
                        />
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Expectancy (R)
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={expectancyR}
                          onChange={(e) => setExpectancyR(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-foreground focus:outline-none focus:border-violet-500"
                          min={-5}
                          max={10}
                          step={0.05}
                        />
                        <span className="text-muted-foreground text-sm">R</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Starting Score
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={edgeScore}
                          onChange={(e) => setEdgeScore(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-foreground focus:outline-none focus:border-violet-500"
                          min={0}
                          max={100}
                          step={5}
                        />
                        <span className="text-muted-foreground text-xs">/100</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-border/40">
                    <strong className="text-foreground">Expectancy formula:</strong>{" "}
                    E = (Win% × Avg Win R) − (Loss% × 1.0R). Set conservative initial
                    targets. You&apos;ll refine these with real trade data over your sample window.
                  </p>
                </div>
              )}

              {/* ─── Step 3: Risk Guardrails ─── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Max Risk per Trade
                      </Label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={maxRiskPercent}
                          onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-rose-400 focus:outline-none focus:border-violet-500"
                          min={0.1}
                          max={5}
                          step={0.25}
                        />
                        <span className="text-muted-foreground text-sm">% equity</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Min Required R:R
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">1 :</span>
                        <input
                          type="number"
                          value={minRrRatio}
                          onChange={(e) => setMinRrRatio(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-emerald-400 focus:outline-none focus:border-violet-500"
                          min={0.5}
                          max={10}
                          step={0.5}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Structural Invalidation Rule
                    </Label>
                    <textarea
                      value={invalidationRule}
                      onChange={(e) => setInvalidationRule(e.target.value)}
                      placeholder="e.g. 5m candle close beyond the sweep wick extreme voids the thesis"
                      className="w-full text-xs p-2.5 rounded-xl bg-white/[0.03] border border-border/60 text-foreground resize-none h-16 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Kill-Switch / Cooling Off Protocol
                    </Label>
                    <Input
                      value={killSwitchRule}
                      onChange={(e) => setKillSwitchRule(e.target.value)}
                      placeholder="e.g. 2 consecutive stops freezes strategy for 24h"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ─── Step 4: Execution Window & Thesis ─── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Active Sessions
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SESSION_OPTIONS.map((session) => (
                        <button
                          key={session}
                          type="button"
                          onClick={() => toggleSession(session)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                            selectedSessions.includes(session)
                              ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                              : "bg-white/[0.03] text-muted-foreground border-border/60 hover:text-foreground"
                          )}
                        >
                          {session}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Kill Zone Start
                      </Label>
                      <Input
                        type="time"
                        value={killZoneStart}
                        onChange={(e) => setKillZoneStart(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Kill Zone End
                      </Label>
                      <Input
                        type="time"
                        value={killZoneEnd}
                        onChange={(e) => setKillZoneEnd(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Active Days
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_OPTIONS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                            selectedDays.includes(day)
                              ? "bg-violet-500/15 text-violet-300 border-violet-500/40"
                              : "bg-white/[0.03] text-muted-foreground border-border/60 hover:text-foreground"
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Edge Thesis — Why does this market anomaly exist?
                    </Label>
                    <textarea
                      value={thesis}
                      onChange={(e) => setThesis(e.target.value)}
                      placeholder="Document the core thesis (e.g. institutional participants need to sweep resting retail stop orders to engineer fill liquidity...)"
                      className="w-full text-xs p-2.5 rounded-xl bg-white/[0.03] border border-border/60 text-foreground resize-none h-20 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              )}

              {/* ─── Step 5: Playbook & Exit Rules (Optional) ─── */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
                    <Layers size={14} className="shrink-0 text-violet-400" />
                    <span>
                      <strong>Optional step:</strong> You can add initial entry criteria &amp; scale-outs now or customize your complete Playbook anytime on the strategy page.
                    </span>
                  </div>

                  {/* Initial Entry Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Check size={13} className="text-violet-400" />
                        Initial Entry Checklist Criteria
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {checklist.length} criteria defined
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={newPhase}
                        onChange={(e) => setNewPhase(e.target.value as any)}
                        aria-label="Criteria Phase"
                        className="h-8 rounded-lg bg-card border border-border/70 text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-violet-500 shrink-0"
                      >
                        <option value="PRE_CONDITION">Pre-Condition</option>
                        <option value="TRIGGER">Trigger</option>
                        <option value="CONFIRMATION">Confirmation</option>
                      </select>

                      <Input
                        value={newCriterion}
                        onChange={(e) => setNewCriterion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCriterion();
                          }
                        }}
                        placeholder="e.g. 15m FVG swept with displacement"
                        className="h-8 text-xs flex-1"
                      />

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCriterion}
                        disabled={!newCriterion.trim()}
                        className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white shrink-0"
                      >
                        <Plus size={13} className="mr-1" />
                        Add
                      </Button>
                    </div>

                    {/* Criteria List */}
                    {checklist.length > 0 ? (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                        {checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03] border border-border/60 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded font-mono shrink-0",
                                  item.phase === "PRE_CONDITION"
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                    : item.phase === "TRIGGER"
                                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                )}
                              >
                                {item.phase.replace("_", " ")}
                              </span>
                              <span className="truncate text-foreground font-medium text-[11px]">
                                {item.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCriterion(item.id)}
                              className="text-muted-foreground hover:text-rose-400 transition-colors p-1"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-dashed border-border/60 text-center text-[11px] text-muted-foreground">
                        No criteria added yet. Press Enter or click &ldquo;Add&rdquo; above, or skip and define rules later.
                      </div>
                    )}
                  </div>

                  {/* Exit Strategy & Targets */}
                  <div>
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Target size={13} className="text-violet-400" />
                      Exit Targets &amp; Scale-Out Strategy
                    </Label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">TP1 Target (R)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.5"
                          value={tp1Ratio}
                          onChange={(e) => setTp1Ratio(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">TP1 Size (%)</Label>
                        <Input
                          type="number"
                          step="5"
                          min="0"
                          max="100"
                          value={tp1Percent}
                          onChange={(e) => setTp1Percent(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">TP2 Target (R)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="1.0"
                          value={tp2Ratio}
                          onChange={(e) => setTp2Ratio(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">TP2 Size (%)</Label>
                        <Input
                          type="number"
                          step="5"
                          min="0"
                          max="100"
                          value={tp2Percent}
                          onChange={(e) => setTp2Percent(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">Breakeven Rule</Label>
                        <Input
                          value={breakevenRule}
                          onChange={(e) => setBreakevenRule(e.target.value)}
                          placeholder="e.g. Move to BE after TP1"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">Runner / Trailing Rule</Label>
                        <Input
                          value={runnerRule}
                          onChange={(e) => setRunnerRule(e.target.value)}
                          placeholder="e.g. Trail 15m structure pivot"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3.5">
          <div className="text-[11px] text-muted-foreground font-mono">
            Step {step} of 5 &mdash; {stepLabels[step].title}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((step - 1) as Step)}
                className="h-8 text-xs"
              >
                Back
              </Button>
            )}

            {step === 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving || !canProceed(4)}
                className="h-8 text-xs border-border/70 text-muted-foreground hover:text-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Skip to Create"
                )}
              </Button>
            )}

            {step < 5 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (step === 1 && categoryInput.trim()) {
                    handleAddCategory();
                  }
                  setStep((step + 1) as Step);
                }}
                disabled={!canProceed(step)}
                className="h-8 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale disabled:opacity-40"
              >
                {step === 4 ? "Next: Playbook (Optional)" : "Continue"}
                <ArrowRight size={13} className="ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving || !canProceed(step)}
                className="h-8 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={13} className="mr-1.5" />
                    {isEditing ? "Save Changes" : "Create Strategy"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
