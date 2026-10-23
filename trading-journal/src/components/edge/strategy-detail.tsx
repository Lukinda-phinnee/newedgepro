"use client";

import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  FileText,
  GitBranch,
  Layers,
  ListChecks,
  ListOrdered,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Shield,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  ChecklistItem,
  DisqualifierItem,
  ExitStrategyConfig,
  RefinementLogItem,
  Strategy,
  StrategyCategory,
  StrategyStatus,
  TradeManagementRule,
} from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyDetailProps {
  strategy: Strategy;
  onUpdateStrategy: (updated: Partial<Strategy>) => void;
  onOpenEdit?: (strategy: Strategy) => void;
}

const TRADE_MANAGEMENT_RULE_TYPES = [
  { value: "BREAKEVEN", label: "Breakeven", color: "bg-blue-500/15 border-blue-500/30 text-blue-400" },
  { value: "TRAILING", label: "Trailing Stop", color: "bg-violet-500/15 border-violet-500/30 text-violet-400" },
  { value: "SCALE_OUT", label: "Scale-Out", color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
  { value: "POSITION_SIZE", label: "Add Size", color: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" },
  { value: "TIME_STOP", label: "Time Stop", color: "bg-amber-500/15 border-amber-500/30 text-amber-400" },
  { value: "GENERAL", label: "General Rule", color: "bg-muted border-border/70 text-foreground" },
];

const CATEGORIES: StrategyCategory[] = [
  "Liquidity Sweep",
  "Trend Continuation",
  "Breakout & Momentum",
  "Mean Reversion",
  "Range Bound",
  "News Catalyst",
];

const statusToggle: Record<StrategyStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500" },
  CALIBRATING: { label: "Calibrating", color: "bg-amber-400" },
  PROBATION: { label: "Probation", color: "bg-rose-400" },
  ARCHIVED: { label: "Archived", color: "bg-neutral-500" },
};

const DEFAULT_NOTES = [
  "Bias is a plan + invalidation, not a prediction.",
  "If you can't say your bias in one sentence, you don't have one.",
  "If invalidation hits, reset. No coping, no revenge trade.",
  "You don't build trust in your system with affirmations. You build it with data.",
  "Conviction → confidence → competence → consistency.",
];

export function StrategyDetail({
  strategy,
  onUpdateStrategy,
  onOpenEdit,
}: StrategyDetailProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isReviewed, setIsReviewed] = useState(false);

  // ─── 1. Plan Type & Metadata Inline States ───
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory>(strategy.category);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState("");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState(strategy.description || "");

  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetSymbol, setNewAssetSymbol] = useState("");

  const [isEditingRegime, setIsEditingRegime] = useState(false);
  const [regimeText, setRegimeText] = useState(strategy.marketRegime || "");

  // ─── 2. Charting Process / Thesis Steps ───
  const thesisSteps = strategy.thesis
    ? strategy.thesis.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const [editingThesisIdx, setEditingThesisIdx] = useState<number | null>(null);
  const [editingThesisText, setEditingThesisText] = useState("");
  const [isAddingThesisStep, setIsAddingThesisStep] = useState(false);
  const [newThesisStep, setNewThesisStep] = useState("");

  // ─── 3. Entry Criteria (Checklist) ───
  const checklist = strategy.entryChecklist || [];
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingCriterionText, setEditingCriterionText] = useState("");
  const [editingCriterionPhase, setEditingCriterionPhase] = useState<
    "PRE_CONDITION" | "TRIGGER" | "CONFIRMATION"
  >("TRIGGER");
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [newCriterionText, setNewCriterionText] = useState("");
  const [newCriterionPhase, setNewCriterionPhase] = useState<
    "PRE_CONDITION" | "TRIGGER" | "CONFIRMATION"
  >("TRIGGER");

  // ─── 4. Trade Management Rules ───
  const tradeManagementRules = strategy.tradeManagementRules || [];
  const [editingRuleKey, setEditingRuleKey] = useState<
    "stopLossLogic" | "invalidationRule" | "killSwitchRule" | null
  >(null);
  const [editingRuleText, setEditingRuleText] = useState("");

  const [editingTradeRuleId, setEditingTradeRuleId] = useState<string | null>(null);
  const [editingTradeRuleText, setEditingTradeRuleText] = useState("");
  const [editingTradeRuleCategory, setEditingTradeRuleCategory] = useState<string>("BREAKEVEN");

  const [isAddingTradeRule, setIsAddingTradeRule] = useState(false);
  const [newTradeRuleText, setNewTradeRuleText] = useState("");
  const [newTradeRuleCategory, setNewTradeRuleCategory] = useState<string>("BREAKEVEN");

  // ─── 5. Exit Criteria ───
  const [isEditingExit, setIsEditingExit] = useState(false);
  const [exitTp1Ratio, setExitTp1Ratio] = useState(strategy.exitStrategy?.tp1Ratio ?? 1.5);
  const [exitTp1Percent, setExitTp1Percent] = useState(strategy.exitStrategy?.tp1Percent ?? 50);
  const [exitTp2Ratio, setExitTp2Ratio] = useState(strategy.exitStrategy?.tp2Ratio ?? 3.0);
  const [exitTp2Percent, setExitTp2Percent] = useState(strategy.exitStrategy?.tp2Percent ?? 35);
  const [exitBreakevenRule, setExitBreakevenRule] = useState(
    strategy.exitStrategy?.breakevenRule ?? "Move to breakeven after TP1"
  );
  const [exitRunnerRule, setExitRunnerRule] = useState(
    strategy.exitStrategy?.runnerRule ?? "Trail 15m structure pivot"
  );

  // ─── 6. Disqualifiers ───
  const disqualifiers = strategy.disqualifiers || [];
  const [editingDisqualifierId, setEditingDisqualifierId] = useState<string | null>(null);
  const [editingDisCondition, setEditingDisCondition] = useState("");
  const [editingDisSeverity, setEditingDisSeverity] = useState<
    "FATAL_EXIT" | "REDUCE_SIZE" | "SKIP_TRADE"
  >("SKIP_TRADE");
  const [isAddingDisqualifier, setIsAddingDisqualifier] = useState(false);
  const [newDisCondition, setNewDisCondition] = useState("");
  const [newDisSeverity, setNewDisSeverity] = useState<
    "FATAL_EXIT" | "REDUCE_SIZE" | "SKIP_TRADE"
  >("SKIP_TRADE");

  // ─── 7. Trading Notes ───
  const notes = strategy.edgeStateNotes
    ? strategy.edgeStateNotes.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
    : DEFAULT_NOTES;
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  // ─── 8. Version History ───
  const refinements = strategy.refinements || [];
  const [isAddingRefinement, setIsAddingRefinement] = useState(false);
  const [newRefVersion, setNewRefVersion] = useState("v1.1");
  const [newRefSummary, setNewRefSummary] = useState("");

  const isActive = strategy.status === "ACTIVE";

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Plan Type handlers ───
  const categoriesList = strategy.category
    ? strategy.category.split(/,\s*/).map((c) => c.trim()).filter(Boolean)
    : [];

  const handleSaveCategory = () => {
    onUpdateStrategy({ category: selectedCategory.trim() });
    setIsEditingCategory(false);
  };

  const handleAddCategoryTag = () => {
    const trimmed = newCategoryText.trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }
    const parts = trimmed.split(/,\s*/).map((c) => c.trim()).filter(Boolean);
    const existingLower = new Set(categoriesList.map((c) => c.toLowerCase()));
    const toAdd = parts.filter((c) => !existingLower.has(c.toLowerCase()));
    const updated = [...categoriesList, ...toAdd];
    onUpdateStrategy({ category: updated.join(", ") });
    setNewCategoryText("");
    setIsAddingCategory(false);
  };

  const handleRemoveCategoryTag = (catToRemove: string) => {
    const updated = categoriesList.filter((c) => c !== catToRemove);
    onUpdateStrategy({ category: updated.length > 0 ? updated.join(", ") : "General" });
  };

  const handleSaveDesc = () => {
    onUpdateStrategy({ description: descText.trim() || null });
    setIsEditingDesc(false);
  };

  const handleAddAsset = () => {
    const trimmed = newAssetSymbol.trim().toUpperCase();
    if (trimmed && !(strategy.assetUniverse || []).includes(trimmed)) {
      onUpdateStrategy({
        assetUniverse: [...(strategy.assetUniverse || []), trimmed],
      });
    }
    setNewAssetSymbol("");
    setIsAddingAsset(false);
  };

  const handleRemoveAsset = (sym: string) => {
    onUpdateStrategy({
      assetUniverse: (strategy.assetUniverse || []).filter((s) => s !== sym),
    });
  };

  const handleSaveRegime = () => {
    onUpdateStrategy({ marketRegime: regimeText.trim() || "High Volatility Trend" });
    setIsEditingRegime(false);
  };

  // ─── Charting Process / Thesis handlers ───
  const handleSaveThesisStep = (idx: number) => {
    const updated = [...thesisSteps];
    if (!editingThesisText.trim()) {
      updated.splice(idx, 1);
    } else {
      updated[idx] = editingThesisText.trim();
    }
    onUpdateStrategy({ thesis: updated.join(". ") });
    setEditingThesisIdx(null);
  };

  const handleDeleteThesisStep = (idx: number) => {
    const updated = thesisSteps.filter((_, i) => i !== idx);
    onUpdateStrategy({ thesis: updated.join(". ") });
  };

  const handleAddThesisStep = () => {
    if (!newThesisStep.trim()) return;
    const updated = [...thesisSteps, newThesisStep.trim()];
    onUpdateStrategy({ thesis: updated.join(". ") });
    setNewThesisStep("");
    setIsAddingThesisStep(false);
  };

  // ─── Entry Criteria handlers ───
  const handleSaveCriterion = (id: string) => {
    if (!editingCriterionText.trim()) {
      handleDeleteCriterion(id);
      return;
    }
    const updated = checklist.map((c) =>
      c.id === id
        ? { ...c, label: editingCriterionText.trim(), phase: editingCriterionPhase }
        : c
    );
    onUpdateStrategy({ entryChecklist: updated });
    setEditingCriterionId(null);
  };

  const handleDeleteCriterion = (id: string) => {
    onUpdateStrategy({
      entryChecklist: checklist.filter((c) => c.id !== id),
    });
  };

  const handleAddCriterion = () => {
    if (!newCriterionText.trim()) return;
    const newItem: ChecklistItem = {
      id: "c_" + Date.now(),
      label: newCriterionText.trim(),
      phase: newCriterionPhase,
      required: true,
    };
    onUpdateStrategy({
      entryChecklist: [...checklist, newItem],
    });
    setNewCriterionText("");
    setIsAddingCriterion(false);
  };

  // ─── Trade Management Rules handlers ───
  const handleSaveRule = (key: "stopLossLogic" | "invalidationRule" | "killSwitchRule") => {
    onUpdateStrategy({ [key]: editingRuleText.trim() || null });
    setEditingRuleKey(null);
  };

  const handleSaveTradeRule = (id: string) => {
    if (!editingTradeRuleText.trim()) {
      handleDeleteTradeRule(id);
      return;
    }
    const updated = tradeManagementRules.map((r) =>
      r.id === id
        ? { ...r, rule: editingTradeRuleText.trim(), category: editingTradeRuleCategory }
        : r
    );
    onUpdateStrategy({ tradeManagementRules: updated });
    setEditingTradeRuleId(null);
  };

  const handleDeleteTradeRule = (id: string) => {
    onUpdateStrategy({
      tradeManagementRules: tradeManagementRules.filter((r) => r.id !== id),
    });
  };

  const handleAddTradeRule = () => {
    if (!newTradeRuleText.trim()) return;
    const newItem: TradeManagementRule = {
      id: "tm_" + Date.now(),
      rule: newTradeRuleText.trim(),
      category: newTradeRuleCategory,
    };
    onUpdateStrategy({
      tradeManagementRules: [...tradeManagementRules, newItem],
    });
    setNewTradeRuleText("");
    setIsAddingTradeRule(false);
  };

  // ─── Exit Strategy handlers ───
  const handleSaveExitStrategy = () => {
    onUpdateStrategy({
      exitStrategy: {
        tp1Ratio: Number(exitTp1Ratio) || 1.5,
        tp1Percent: Number(exitTp1Percent) || 50,
        tp2Ratio: Number(exitTp2Ratio) || 3.0,
        tp2Percent: Number(exitTp2Percent) || 35,
        breakevenRule: exitBreakevenRule.trim() || "Move to breakeven after TP1",
        runnerRule: exitRunnerRule.trim() || "Trail 15m structure pivot",
        timeStopMinutes: strategy.exitStrategy?.timeStopMinutes ?? 45,
      },
    });
    setIsEditingExit(false);
  };

  // ─── Disqualifiers handlers ───
  const handleSaveDisqualifier = (id: string) => {
    if (!editingDisCondition.trim()) {
      handleDeleteDisqualifier(id);
      return;
    }
    const updated = disqualifiers.map((d) =>
      d.id === id
        ? { ...d, condition: editingDisCondition.trim(), severity: editingDisSeverity }
        : d
    );
    onUpdateStrategy({ disqualifiers: updated });
    setEditingDisqualifierId(null);
  };

  const handleDeleteDisqualifier = (id: string) => {
    onUpdateStrategy({
      disqualifiers: disqualifiers.filter((d) => d.id !== id),
    });
  };

  const handleAddDisqualifier = () => {
    if (!newDisCondition.trim()) return;
    const newItem: DisqualifierItem = {
      id: "dis_" + Date.now(),
      condition: newDisCondition.trim(),
      severity: newDisSeverity,
    };
    onUpdateStrategy({
      disqualifiers: [...disqualifiers, newItem],
    });
    setNewDisCondition("");
    setIsAddingDisqualifier(false);
  };

  // ─── Trading Notes handlers ───
  const handleSaveNote = (idx: number) => {
    const updated = [...notes];
    if (!editingNoteText.trim()) {
      updated.splice(idx, 1);
    } else {
      updated[idx] = editingNoteText.trim();
    }
    onUpdateStrategy({ edgeStateNotes: updated.join(". ") });
    setEditingNoteIdx(null);
  };

  const handleDeleteNote = (idx: number) => {
    const updated = notes.filter((_, i) => i !== idx);
    onUpdateStrategy({ edgeStateNotes: updated.join(". ") });
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const updated = [...notes, newNoteText.trim()];
    onUpdateStrategy({ edgeStateNotes: updated.join(". ") });
    setNewNoteText("");
    setIsAddingNote(false);
  };

  // ─── Version / Refinement handlers ───
  const handleAddRefinement = () => {
    if (!newRefSummary.trim()) return;
    const newItem: RefinementLogItem = {
      id: "ref_" + Date.now(),
      version: newRefVersion.trim() || "v1.1",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      changeSummary: newRefSummary.trim(),
      hypothesis: "Optimize edge execution parameters based on recent performance.",
      status: "IMPLEMENTED",
    };
    onUpdateStrategy({
      refinements: [newItem, ...refinements],
      version: newRefVersion.trim() || strategy.version,
    });
    setNewRefSummary("");
    setIsAddingRefinement(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Top Header ─── */}
      <div className="flex items-center justify-between px-6 lg:px-8 pt-5 pb-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "size-3 rounded-full shrink-0",
              statusToggle[strategy.status].color
            )}
          />
          <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
            {strategy.name}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Active Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdateStrategy({
                status: isActive ? "CALIBRATING" : "ACTIVE",
              })
            }
            className="flex items-center gap-2 press-scale-sm cursor-pointer"
          >
            <div
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors",
                isActive ? "bg-violet-500" : "bg-white/[0.12]"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                  isActive ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-xs font-semibold text-foreground">
              {statusToggle[strategy.status].label}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEdit?.(strategy)}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-medium"
          >
            <Edit3 size={13} />
            Full Edit
          </button>
        </div>
      </div>

      {/* ─── Scrollable Playbook Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 lg:px-8 py-6 space-y-6 max-w-3xl">

          {/* ─── Section 1: Plan Type / Strategy Overview ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 shrink-0">
                  <Layers size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Plan Type
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Categories (Multi-Tag Display) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-foreground text-[11px] font-semibold">Categories:</span>
                {categoriesList.map((cat) => (
                  <span
                    key={cat}
                    className="group/cat inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-xs font-semibold text-foreground"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryTag(cat)}
                      className="opacity-0 group-hover/cat:opacity-100 text-foreground/70 hover:text-rose-400 p-0.5 transition-opacity cursor-pointer"
                      aria-label={`Remove category ${cat}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}

                {/* Inline Add Category */}
                {isAddingCategory ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newCategoryText}
                      onChange={(e) => setNewCategoryText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCategoryTag();
                        if (e.key === "Escape") {
                          setIsAddingCategory(false);
                          setNewCategoryText("");
                        }
                      }}
                      placeholder="New category..."
                      className="h-7 text-xs px-2 w-40 text-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategoryTag}
                      className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Check size={12} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setIsAddingCategory(false); setNewCategoryText(""); }}
                      className="h-7 px-1.5 text-xs text-foreground"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-dashed border-border/70 text-[11px] text-foreground/70 hover:text-foreground hover:border-violet-500/50 transition-colors cursor-pointer"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                )}
              </div>

              {/* Description Inline */}
              <div className="group flex items-start gap-2">
                {isEditingDesc ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={descText}
                      onChange={(e) => setDescText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveDesc();
                        if (e.key === "Escape") setIsEditingDesc(false);
                      }}
                      placeholder="Add brief description of how this edge behaves..."
                      className="h-8 text-xs flex-1 text-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveDesc}
                      className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Check size={12} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDesc(false)}
                      className="h-7 px-1.5 text-xs"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <span>
                      {strategy.description || (
                        <span className="italic text-foreground/70 font-normal">
                          + Add brief description...
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDescText(strategy.description || "");
                        setIsEditingDesc(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-foreground/70 hover:text-foreground p-0.5 transition-opacity cursor-pointer"
                      title="Edit Description"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Assets & Regime Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Assets List */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-foreground text-[11px] font-semibold">Assets:</span>
                  {(strategy.assetUniverse || []).map((sym) => (
                    <span
                      key={sym}
                      className="group/sym flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 dark:bg-white/[0.08] border border-border/70 text-xs font-mono font-semibold text-foreground"
                    >
                      {sym}
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(sym)}
                        className="opacity-0 group-hover/sym:opacity-100 text-foreground/70 hover:text-rose-400 p-0.5 transition-opacity cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}

                  {/* Inline Add Asset */}
                  {isAddingAsset ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={newAssetSymbol}
                        onChange={(e) => setNewAssetSymbol(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAsset();
                          if (e.key === "Escape") setIsAddingAsset(false);
                        }}
                        placeholder="SYMBOL"
                        className="h-6 w-20 text-[11px] font-mono px-1.5 text-foreground"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddAsset}
                        className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingAsset(false)}
                        className="p-1 text-foreground/70 hover:text-foreground cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingAsset(true)}
                      className="flex items-center gap-1 text-[11px] text-foreground font-medium hover:text-violet-400 px-1.5 py-0.5 rounded border border-dashed border-border/80 hover:border-violet-500/60 transition-colors cursor-pointer"
                    >
                      <Plus size={10} />
                      Add symbol
                    </button>
                  )}
                </div>

                {/* Regime Pill */}
                <div className="group/reg flex items-center gap-1.5 text-xs text-foreground bg-muted/60 dark:bg-white/[0.08] border border-border/70 px-2.5 py-1 rounded-lg ml-auto sm:ml-0">
                  <span className="text-foreground text-[11px] font-semibold">Regime:</span>
                  {isEditingRegime ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={regimeText}
                        onChange={(e) => setRegimeText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRegime();
                          if (e.key === "Escape") setIsEditingRegime(false);
                        }}
                        className="h-6 w-36 text-xs px-1.5 text-foreground"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveRegime}
                        className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                      >
                        <Check size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingRegime(false)}
                        className="text-foreground/70 hover:text-foreground p-0.5 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-foreground">{strategy.marketRegime || "General"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRegimeText(strategy.marketRegime || "");
                          setIsEditingRegime(true);
                        }}
                        className="opacity-0 group-hover/reg:opacity-100 text-foreground/70 hover:text-foreground p-0.5 transition-opacity cursor-pointer"
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ─── Section 2: Charting Process / Thesis ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 shrink-0">
                  <BarChart3 size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Charting Process
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {thesisSteps.map((sentence, idx) => (
                <div key={idx} className="group flex items-start gap-3">
                  <span className="flex size-5 items-center justify-center rounded bg-violet-500/10 text-violet-400 text-[10px] font-bold font-mono shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  {editingThesisIdx === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingThesisText}
                        onChange={(e) => setEditingThesisText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveThesisStep(idx);
                          if (e.key === "Escape") setEditingThesisIdx(null);
                        }}
                        className="h-8 text-sm flex-1 text-foreground"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveThesisStep(idx)}
                        className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                      >
                        <Check size={12} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingThesisIdx(null)}
                        className="h-7 px-1.5 text-xs cursor-pointer"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 flex-1">
                      <p className="text-sm text-foreground font-medium leading-relaxed">
                        {sentence}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingThesisIdx(idx);
                            setEditingThesisText(sentence);
                          }}
                          className="p-1 text-foreground/70 hover:text-foreground cursor-pointer"
                          title="Edit step"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteThesisStep(idx)}
                          className="p-1 text-foreground/70 hover:text-rose-400 cursor-pointer"
                          title="Delete step"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {thesisSteps.length === 0 && !isAddingThesisStep && (
                <p className="text-sm text-foreground/80 italic mb-2">
                  Document your charting process and bias determination steps.
                </p>
              )}

              {/* Inline Add Charting Step */}
              {isAddingThesisStep ? (
                <div className="flex items-center gap-2 pt-2">
                  <span className="flex size-5 items-center justify-center rounded bg-violet-500/20 text-violet-400 text-[10px] font-bold font-mono shrink-0">
                    {thesisSteps.length + 1}
                  </span>
                  <Input
                    value={newThesisStep}
                    onChange={(e) => setNewThesisStep(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddThesisStep();
                      if (e.key === "Escape") setIsAddingThesisStep(false);
                    }}
                    placeholder="e.g. Determine 4H liquidity draw and align with 15m orderflow"
                    className="h-8 text-sm flex-1 text-foreground"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddThesisStep}
                    disabled={!newThesisStep.trim()}
                    className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Add Step
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingThesisStep(false)}
                    className="h-8 px-2 text-xs cursor-pointer"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingThesisStep(true)}
                  className="flex items-center gap-1.5 text-xs text-foreground font-medium hover:text-violet-400 transition-colors pt-2 cursor-pointer"
                >
                  <Plus size={13} />
                  Add charting step
                </button>
              )}
            </div>
          </section>

          {/* ─── Section 3: Entry Criteria (Interactive Checklist) ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 shrink-0">
                  <ListChecks size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Entry Criteria
                </h3>
              </div>
              <span className="text-[11px] font-mono text-foreground font-semibold">
                {checklist.filter((i) => checkedItems[i.id]).length} / {checklist.length} verified
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item, idx) => {
                const isChecked = !!checkedItems[item.id];
                const isEditing = editingCriterionId === item.id;

                return (
                  <div
                    key={item.id}
                    className="group flex items-start gap-3 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded border mt-0.5 transition-all cursor-pointer",
                        isChecked
                          ? "bg-violet-500 border-violet-500 text-white"
                          : "border-border/80 bg-transparent hover:border-violet-400"
                      )}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </button>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={editingCriterionPhase}
                          onChange={(e) => setEditingCriterionPhase(e.target.value as any)}
                          aria-label="Criteria Phase"
                          className="h-8 rounded bg-card border border-border/70 text-xs px-1.5 font-mono text-foreground font-semibold"
                        >
                          <option value="PRE_CONDITION">Pre-Condition</option>
                          <option value="TRIGGER">Trigger</option>
                          <option value="CONFIRMATION">Confirmation</option>
                        </select>
                        <Input
                          value={editingCriterionText}
                          onChange={(e) => setEditingCriterionText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCriterion(item.id);
                            if (e.key === "Escape") setEditingCriterionId(null);
                          }}
                          className="h-8 text-sm flex-1 text-foreground"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveCriterion(item.id)}
                          className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCriterionId(null)}
                          className="h-7 px-1.5 text-xs"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold",
                              item.phase === "PRE_CONDITION"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : item.phase === "CONFIRMATION"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                            )}
                          >
                            {item.phase.replace("_", " ")}
                          </span>
                          <span
                            className={cn(
                              "text-sm leading-relaxed font-medium",
                              isChecked
                                ? "text-foreground/60 line-through"
                                : "text-foreground"
                            )}
                          >
                            {idx + 1}. {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCriterionId(item.id);
                              setEditingCriterionText(item.label);
                              setEditingCriterionPhase(item.phase);
                            }}
                            className="p-1 text-foreground/70 hover:text-foreground cursor-pointer"
                            title="Edit criterion"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCriterion(item.id)}
                            className="p-1 text-foreground/70 hover:text-rose-400 cursor-pointer"
                            title="Delete criterion"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {checklist.length === 0 && !isAddingCriterion && (
                <p className="text-sm text-foreground/80 italic">
                  No criteria defined. Add rule requirements below.
                </p>
              )}

              {/* Inline Add Criterion Row */}
              {isAddingCriterion ? (
                <div className="flex items-center gap-2 pt-2">
                  <select
                    value={newCriterionPhase}
                    onChange={(e) => setNewCriterionPhase(e.target.value as any)}
                    aria-label="Criteria Phase"
                    className="h-8 rounded bg-card border border-border/70 text-xs px-2 font-mono text-foreground font-semibold shrink-0"
                  >
                    <option value="PRE_CONDITION">Pre-Condition</option>
                    <option value="TRIGGER">Trigger</option>
                    <option value="CONFIRMATION">Confirmation</option>
                  </select>
                  <Input
                    value={newCriterionText}
                    onChange={(e) => setNewCriterionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCriterion();
                      if (e.key === "Escape") setIsAddingCriterion(false);
                    }}
                    placeholder="e.g. Asymmetric Risk to Reward (press Enter)..."
                    className="h-8 text-sm flex-1 text-foreground"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCriterion}
                    disabled={!newCriterionText.trim()}
                    className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCriterion(false)}
                    className="h-8 px-2 text-xs cursor-pointer"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCriterion(true)}
                  className="flex items-center gap-1.5 text-xs text-foreground font-medium hover:text-violet-400 transition-colors pt-2 cursor-pointer"
                >
                  <Plus size={13} />
                  Add entry criterion
                </button>
              )}
            </div>
          </section>

          {/* ─── Section 4: Trade Management Rules ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 shrink-0">
                  <Shield size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Trade Management Rules
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. Stop Loss Logic */}
              <div className="group rounded-xl p-3 bg-muted/40 dark:bg-white/[0.04] border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase text-foreground font-bold">
                    Stop Loss Placement
                  </span>
                  {editingRuleKey !== "stopLossLogic" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleKey("stopLossLogic");
                        setEditingRuleText(strategy.stopLossLogic || "");
                      }}
                      className="opacity-0 group-hover:opacity-100 text-foreground/70 hover:text-foreground p-0.5 transition-opacity cursor-pointer"
                    >
                      <Pencil size={11} />
                    </button>
                  )}
                </div>

                {editingRuleKey === "stopLossLogic" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={editingRuleText}
                      onChange={(e) => setEditingRuleText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRule("stopLossLogic");
                        if (e.key === "Escape") setEditingRuleKey(null);
                      }}
                      placeholder="e.g. 1 tick beyond invalidation candle wick"
                      className="h-8 text-xs flex-1 text-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveRule("stopLossLogic")}
                      className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Check size={12} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRuleKey(null)}
                      className="h-7 px-1.5 text-xs text-foreground"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-foreground font-medium">
                    {strategy.stopLossLogic || (
                      <span className="text-foreground/70 italic font-normal">
                        Click to define stop placement rules...
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* 2. Invalidation Rule */}
              <div className="group rounded-xl p-3 bg-rose-500/[0.05] border border-rose-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">
                    Hard Structural Invalidation
                  </span>
                  {editingRuleKey !== "invalidationRule" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleKey("invalidationRule");
                        setEditingRuleText(strategy.invalidationRule || "");
                      }}
                      className="opacity-0 group-hover:opacity-100 text-foreground/70 hover:text-rose-400 p-0.5 transition-opacity cursor-pointer"
                    >
                      <Pencil size={11} />
                    </button>
                  )}
                </div>

                {editingRuleKey === "invalidationRule" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={editingRuleText}
                      onChange={(e) => setEditingRuleText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRule("invalidationRule");
                        if (e.key === "Escape") setEditingRuleKey(null);
                      }}
                      placeholder="e.g. 5m candle closing beyond the sweep high/low voids the setup immediately"
                      className="h-8 text-xs flex-1 text-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveRule("invalidationRule")}
                      className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Check size={12} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRuleKey(null)}
                      className="h-7 px-1.5 text-xs text-foreground"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-foreground font-medium">
                    {strategy.invalidationRule || (
                      <span className="text-foreground/70 italic font-normal">
                        Click to define hard invalidation rule...
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* 3. Kill Switch Rule */}
              <div className="group rounded-xl p-3 bg-muted/40 dark:bg-white/[0.04] border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase text-foreground font-bold">
                    Daily Stand-Down / Kill Switch
                  </span>
                  {editingRuleKey !== "killSwitchRule" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleKey("killSwitchRule");
                        setEditingRuleText(strategy.killSwitchRule || "");
                      }}
                      className="opacity-0 group-hover:opacity-100 text-foreground/70 hover:text-foreground p-0.5 transition-opacity cursor-pointer"
                    >
                      <Pencil size={11} />
                    </button>
                  )}
                </div>

                {editingRuleKey === "killSwitchRule" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={editingRuleText}
                      onChange={(e) => setEditingRuleText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRule("killSwitchRule");
                        if (e.key === "Escape") setEditingRuleKey(null);
                      }}
                      placeholder="e.g. Stop trading after 2 consecutive R losses in a session"
                      className="h-8 text-xs flex-1 text-foreground"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveRule("killSwitchRule")}
                      className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      <Check size={12} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRuleKey(null)}
                      className="h-7 px-1.5 text-xs text-foreground"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-foreground font-medium">
                    {strategy.killSwitchRule || (
                      <span className="text-foreground/70 italic font-normal">
                        Click to define daily kill switch rule...
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* 4. Custom Trade Management Rules */}
              {tradeManagementRules.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono uppercase text-foreground font-bold block">
                    Execution & Position Rules
                  </span>
                  {tradeManagementRules.map((rule) => {
                    const isEditing = editingTradeRuleId === rule.id;
                    const catConfig =
                      TRADE_MANAGEMENT_RULE_TYPES.find(
                        (c) => c.value === rule.category
                      ) || TRADE_MANAGEMENT_RULE_TYPES[0];

                    return (
                      <div
                        key={rule.id}
                        className="group flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 dark:bg-white/[0.04] border border-border/60 hover:border-violet-500/40 transition-colors"
                      >
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 mt-0.5 border",
                            catConfig.color
                          )}
                        >
                          {catConfig.label}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={editingTradeRuleCategory}
                              onChange={(e) =>
                                setEditingTradeRuleCategory(e.target.value)
                              }
                              aria-label="Trade Management Rule Category"
                              className="h-8 rounded bg-card border border-border/70 text-xs px-2 font-mono text-foreground font-semibold shrink-0 cursor-pointer"
                            >
                              {TRADE_MANAGEMENT_RULE_TYPES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                            <Input
                              value={editingTradeRuleText}
                              onChange={(e) =>
                                setEditingTradeRuleText(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveTradeRule(rule.id);
                                if (e.key === "Escape")
                                  setEditingTradeRuleId(null);
                              }}
                              className="h-8 text-xs flex-1 text-foreground"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveTradeRule(rule.id)}
                              className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTradeRuleId(null)}
                              className="h-7 px-1.5 text-xs text-foreground cursor-pointer"
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2 flex-1">
                            <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed font-sans">
                              {rule.rule}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTradeRuleId(rule.id);
                                  setEditingTradeRuleText(rule.rule);
                                  setEditingTradeRuleCategory(
                                    rule.category || "BREAKEVEN"
                                  );
                                }}
                                className="p-1 text-foreground/70 hover:text-foreground cursor-pointer"
                                title="Edit rule"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTradeRule(rule.id)}
                                className="p-1 text-foreground/70 hover:text-rose-400 cursor-pointer"
                                title="Delete rule"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline Add Trade Management Rule Row */}
              {isAddingTradeRule ? (
                <div className="flex items-center gap-2 pt-2">
                  <select
                    value={newTradeRuleCategory}
                    onChange={(e) => setNewTradeRuleCategory(e.target.value)}
                    aria-label="New Trade Management Rule Category"
                    className="h-8 rounded bg-card border border-border/70 text-xs px-2 font-mono text-foreground font-semibold shrink-0 cursor-pointer"
                  >
                    {TRADE_MANAGEMENT_RULE_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newTradeRuleText}
                    onChange={(e) => setNewTradeRuleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTradeRule();
                      if (e.key === "Escape") setIsAddingTradeRule(false);
                    }}
                    placeholder="e.g. Move stop to Breakeven (+0.1R) once TP1 is hit (press Enter)..."
                    className="h-8 text-xs flex-1 text-foreground"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTradeRule}
                    disabled={!newTradeRuleText.trim()}
                    className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingTradeRule(false)}
                    className="h-8 px-2 text-xs cursor-pointer text-foreground"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTradeRule(true)}
                  className="flex items-center gap-1.5 text-xs text-foreground font-medium hover:text-violet-400 transition-colors pt-2 cursor-pointer"
                >
                  <Plus size={13} />
                  Add trade management rule
                </button>
              )}
            </div>
          </section>

          {/* ─── Section 5: Exit Criteria ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Target size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Exit Criteria & Scale-Outs
                </h3>
              </div>

              {!isEditingExit && (
                <button
                  type="button"
                  onClick={() => {
                    setExitTp1Ratio(strategy.exitStrategy?.tp1Ratio ?? 1.5);
                    setExitTp1Percent(strategy.exitStrategy?.tp1Percent ?? 50);
                    setExitTp2Ratio(strategy.exitStrategy?.tp2Ratio ?? 3.0);
                    setExitTp2Percent(strategy.exitStrategy?.tp2Percent ?? 35);
                    setExitBreakevenRule(
                      strategy.exitStrategy?.breakevenRule ?? "Move to breakeven after TP1"
                    );
                    setExitRunnerRule(
                      strategy.exitStrategy?.runnerRule ?? "Trail 15m structure pivot"
                    );
                    setIsEditingExit(true);
                  }}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-medium"
                >
                  <Pencil size={11} />
                  Edit Rules
                </button>
              )}
            </div>

            {isEditingExit ? (
              <div className="p-3.5 rounded-xl border border-violet-500/40 bg-violet-500/[0.04] space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-foreground font-semibold uppercase block mb-1">TP1 Target (R)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={exitTp1Ratio}
                      onChange={(e) => setExitTp1Ratio(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground font-semibold uppercase block mb-1">TP1 Scale (%)</span>
                    <Input
                      type="number"
                      step="5"
                      value={exitTp1Percent}
                      onChange={(e) => setExitTp1Percent(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground font-semibold uppercase block mb-1">TP2 Target (R)</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={exitTp2Ratio}
                      onChange={(e) => setExitTp2Ratio(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground font-semibold uppercase block mb-1">TP2 Scale (%)</span>
                    <Input
                      type="number"
                      step="5"
                      value={exitTp2Percent}
                      onChange={(e) => setExitTp2Percent(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-foreground font-semibold block mb-1">Breakeven Protocol</span>
                    <Input
                      value={exitBreakevenRule}
                      onChange={(e) => setExitBreakevenRule(e.target.value)}
                      placeholder="Move stop to entry after TP1 hits"
                      className="h-8 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground font-semibold block mb-1">Runner Trailing Rule</span>
                    <Input
                      value={exitRunnerRule}
                      onChange={(e) => setExitRunnerRule(e.target.value)}
                      placeholder="Trail 15m structure pivot"
                      className="h-8 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingExit(false)}
                    className="h-7 text-xs cursor-pointer text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveExitStrategy}
                    className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Save Targets
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 dark:bg-white/[0.04] border border-border/60">
                    <span className="text-[10px] text-foreground font-mono uppercase font-bold block">
                      Target 1
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {strategy.exitStrategy?.tp1Ratio ?? 1.5}R
                      </span>
                      <span className="text-xs text-foreground font-semibold">
                        scale {strategy.exitStrategy?.tp1Percent ?? 50}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 dark:bg-white/[0.04] border border-border/60">
                    <span className="text-[10px] text-foreground font-mono uppercase font-bold block">
                      Target 2
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {strategy.exitStrategy?.tp2Ratio ?? 3.0}R
                      </span>
                      <span className="text-xs text-foreground font-semibold">
                        scale {strategy.exitStrategy?.tp2Percent ?? 35}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-foreground font-medium pt-1">
                  <p>
                    <strong className="text-foreground font-bold">Breakeven Protocol:</strong>{" "}
                    {strategy.exitStrategy?.breakevenRule || "Move to breakeven after TP1 hits."}
                  </p>
                  {strategy.exitStrategy?.runnerRule && (
                    <p className="text-foreground font-medium">
                      <strong className="text-foreground font-bold">Runner Management:</strong>{" "}
                      {strategy.exitStrategy.runnerRule}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ─── Section 6: Disqualifiers / Stand-Down Protocol ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                  <AlertOctagon size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Disqualifiers & Anti-Patterns
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {disqualifiers.map((dis) => {
                const isEditing = editingDisqualifierId === dis.id;

                return (
                  <div
                    key={dis.id}
                    className="group flex items-start gap-2.5 p-2.5 rounded-xl bg-black/20 border border-rose-500/20"
                  >
                    <AlertTriangle
                      size={14}
                      className="text-amber-400 shrink-0 mt-0.5"
                    />

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={editingDisSeverity}
                          onChange={(e) => setEditingDisSeverity(e.target.value as any)}
                          aria-label="Disqualifier Severity"
                          className="h-8 rounded bg-card border border-border/70 text-xs px-2 font-mono text-foreground font-semibold shrink-0"
                        >
                          <option value="SKIP_TRADE">Skip Trade</option>
                          <option value="FATAL_EXIT">Fatal Exit</option>
                          <option value="REDUCE_SIZE">Reduce Size</option>
                        </select>
                        <Input
                          value={editingDisCondition}
                          onChange={(e) => setEditingDisCondition(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveDisqualifier(dis.id);
                            if (e.key === "Escape") setEditingDisqualifierId(null);
                          }}
                          className="h-8 text-xs flex-1 text-foreground"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveDisqualifier(dis.id)}
                          className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDisqualifierId(null)}
                          className="h-7 px-1.5 text-xs text-foreground"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2 flex-1">
                        <div className="min-w-0">
                          <p className="text-xs text-foreground font-semibold">
                            {dis.condition}
                          </p>
                          {dis.explanation && (
                            <p className="text-[11px] text-foreground font-medium mt-0.5">
                              {dis.explanation}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-bold">
                            {dis.severity.replace("_", " ")}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDisqualifierId(dis.id);
                                setEditingDisCondition(dis.condition);
                                setEditingDisSeverity(dis.severity);
                              }}
                              className="p-1 text-foreground/70 hover:text-foreground cursor-pointer"
                              title="Edit disqualifier"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDisqualifier(dis.id)}
                              className="p-1 text-foreground/70 hover:text-rose-400 cursor-pointer"
                              title="Delete disqualifier"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {disqualifiers.length === 0 && !isAddingDisqualifier && (
                <p className="text-sm text-foreground/80 italic mb-2">
                  No disqualifiers defined. Specify market conditions when to stand down.
                </p>
              )}

              {/* Inline Add Disqualifier Row */}
              {isAddingDisqualifier ? (
                <div className="flex items-center gap-2 pt-2">
                  <select
                    value={newDisSeverity}
                    onChange={(e) => setNewDisSeverity(e.target.value as any)}
                    aria-label="Disqualifier Severity"
                    className="h-8 rounded bg-card border border-border/70 text-xs px-2 font-mono text-foreground font-semibold shrink-0"
                  >
                    <option value="SKIP_TRADE">Skip Trade</option>
                    <option value="FATAL_EXIT">Fatal Exit</option>
                    <option value="REDUCE_SIZE">Reduce Size</option>
                  </select>
                  <Input
                    value={newDisCondition}
                    onChange={(e) => setNewDisCondition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddDisqualifier();
                      if (e.key === "Escape") setIsAddingDisqualifier(false);
                    }}
                    placeholder="e.g. Major economic release in under 15 minutes (press Enter)..."
                    className="h-8 text-xs flex-1 text-foreground"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddDisqualifier}
                    disabled={!newDisCondition.trim()}
                    className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingDisqualifier(false)}
                    className="h-8 px-2 text-xs cursor-pointer text-foreground"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingDisqualifier(true)}
                  className="flex items-center gap-1.5 text-xs text-foreground font-medium hover:text-amber-400 transition-colors pt-2 cursor-pointer"
                >
                  <Plus size={13} />
                  Add disqualifier
                </button>
              )}
            </div>
          </section>

          {/* ─── Section 7: Trading Notes / Psychology ─── */}
          <section className="pb-6 border-b border-border/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 shrink-0">
                  <MessageSquareText size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Trading Notes & Mindset
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {notes.map((note, idx) => (
                <div key={idx} className="group flex items-start gap-2.5">
                  <span className="size-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />

                  {editingNoteIdx === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveNote(idx);
                          if (e.key === "Escape") setEditingNoteIdx(null);
                        }}
                        className="h-8 text-xs flex-1 text-foreground"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveNote(idx)}
                        className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                      >
                        <Check size={12} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNoteIdx(null)}
                        className="h-7 px-1.5 text-xs text-foreground"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 flex-1">
                      <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed font-sans">
                        {note}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteIdx(idx);
                            setEditingNoteText(note);
                          }}
                          className="p-1 text-foreground/70 hover:text-foreground cursor-pointer"
                          title="Edit note"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(idx)}
                          className="p-1 text-foreground/70 hover:text-rose-400 cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Inline Add Note Row */}
              {isAddingNote ? (
                <div className="flex items-center gap-2 pt-2">
                  <span className="size-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                  <Input
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNote();
                      if (e.key === "Escape") setIsAddingNote(false);
                    }}
                    placeholder="Add trading rule or psychological reminder (press Enter)..."
                    className="h-8 text-xs flex-1 text-foreground"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNoteText.trim()}
                    className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingNote(false)}
                    className="h-8 px-2 text-xs cursor-pointer text-foreground"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center gap-1.5 text-xs text-foreground font-medium hover:text-violet-400 transition-colors pt-2 cursor-pointer"
                >
                  <Plus size={13} />
                  Add trading note
                </button>
              )}
            </div>
          </section>

          {/* ─── Section 8: Version History ─── */}
          <section className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 shrink-0">
                  <GitBranch size={14} />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Version History
                </h3>
                <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 rounded border border-violet-500/20 ml-1 font-semibold">
                  {strategy.version}
                </span>
              </div>

              {!isAddingRefinement && (
                <button
                  type="button"
                  onClick={() => setIsAddingRefinement(true)}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-medium"
                >
                  <Plus size={12} />
                  Add Version Log
                </button>
              )}
            </div>

            {isAddingRefinement && (
              <div className="p-3 mb-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.04] space-y-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={newRefVersion}
                    onChange={(e) => setNewRefVersion(e.target.value)}
                    placeholder="Version (e.g. v1.1)"
                    className="h-8 w-24 text-xs font-mono text-foreground"
                  />
                  <Input
                    value={newRefSummary}
                    onChange={(e) => setNewRefSummary(e.target.value)}
                    placeholder="Change summary (e.g. Tightened invalidation criteria after 20 trades sample)"
                    className="h-8 text-xs flex-1 text-foreground"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingRefinement(false)}
                    className="h-7 text-xs cursor-pointer text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddRefinement}
                    disabled={!newRefSummary.trim()}
                    className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Save Log
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {refinements.slice(0, 4).map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                    {ref.version}
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground font-medium leading-relaxed text-xs">
                      {ref.changeSummary}
                    </p>
                    <span className="text-[10px] text-foreground/80 font-mono">
                      {ref.date}
                      {ref.impactObserved && ` · ${ref.impactObserved}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Spacer for bottom bar */}
          <div className="h-6" />
        </div>
      </div>

      {/* ─── Bottom Bar (Mark as reviewed) ─── */}
      <div className="shrink-0 border-t border-border/60 px-6 lg:px-8 py-3 flex items-center gap-3 bg-card/40 backdrop-blur-md">
        <Button
          type="button"
          size="sm"
          onClick={() => setIsReviewed(true)}
          disabled={isReviewed}
          className={cn(
            "h-9 text-xs font-semibold px-5 press-scale cursor-pointer",
            isReviewed
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30"
          )}
        >
          {isReviewed ? (
            <>
              <Check size={14} className="mr-1.5" />
              Reviewed
            </>
          ) : (
            <>
              <Check size={14} className="mr-1.5" />
              Mark as reviewed
            </>
          )}
        </Button>

        <span className="text-[11px] text-foreground font-medium">
          Last reviewed {isReviewed ? "just now" : "—"}
        </span>
      </div>
    </div>
  );
}
