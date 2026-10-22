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
  ListChecks,
  ListOrdered,
  Loader2,
  MessageSquareText,
  Pen,
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
  Strategy,
  StrategyStatus,
} from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyDetailProps {
  strategy: Strategy;
  onUpdateStrategy: (updated: Partial<Strategy>) => void;
}

const statusToggle: Record<StrategyStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500" },
  CALIBRATING: { label: "Calibrating", color: "bg-amber-400" },
  PROBATION: { label: "Probation", color: "bg-rose-400" },
  ARCHIVED: { label: "Archived", color: "bg-neutral-500" },
};

export function StrategyDetail({
  strategy,
  onUpdateStrategy,
}: StrategyDetailProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [newCriterionText, setNewCriterionText] = useState("");
  const [isAddingExitRule, setIsAddingExitRule] = useState(false);
  const [newExitRule, setNewExitRule] = useState("");
  const [isReviewed, setIsReviewed] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCriterion = () => {
    if (!newCriterionText.trim()) return;
    const newItem: ChecklistItem = {
      id: "c_" + Date.now(),
      label: newCriterionText.trim(),
      phase: "TRIGGER",
      required: true,
    };
    onUpdateStrategy({
      entryChecklist: [...(strategy.entryChecklist || []), newItem],
    });
    setNewCriterionText("");
    setIsAddingCriterion(false);
  };

  const handleDeleteCriterion = (id: string) => {
    onUpdateStrategy({
      entryChecklist: (strategy.entryChecklist || []).filter((c) => c.id !== id),
    });
  };

  const isActive = strategy.status === "ACTIVE";
  const checklist = strategy.entryChecklist || [];
  const disqualifiers = strategy.disqualifiers || [];
  const refinements = strategy.refinements || [];

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
            className="flex items-center gap-2 press-scale-sm"
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
            <span className="text-xs font-medium text-muted-foreground">
              {statusToggle[strategy.status].label}
            </span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Edit3 size={13} />
            Edit
          </button>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 lg:px-8 py-5 space-y-7 max-w-3xl">
          {/* Plan Type / Category */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Plan Type
            </span>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {strategy.category}
              {strategy.description && (
                <span className="font-normal text-muted-foreground">
                  {" · "}{strategy.description}
                </span>
              )}
            </p>
          </div>

          {/* ─── Section: Charting Process / Thesis ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Charting Process
              </h3>
            </div>

            {strategy.thesis ? (
              <div className="space-y-1.5">
                {strategy.thesis
                  .split(/(?<=[.!?])\s+/)
                  .filter(Boolean)
                  .map((sentence, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="flex size-5 items-center justify-center rounded bg-violet-500/10 text-violet-400 text-[10px] font-bold font-mono shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {sentence.trim()}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Document your charting process and bias determination steps.
              </p>
            )}
          </section>

          {/* ─── Section: Entry Criteria (Interactive Checklist) ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Entry Criteria
              </h3>
            </div>

            <div className="space-y-1.5">
              {checklist.map((item, idx) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    className="group flex items-start gap-3 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded border mt-0.5 transition-all",
                        isChecked
                          ? "bg-violet-500 border-violet-500 text-white"
                          : "border-border/80 bg-transparent hover:border-violet-400"
                      )}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </button>

                    <span
                      className={cn(
                        "text-sm leading-relaxed flex-1",
                        isChecked
                          ? "text-muted-foreground line-through"
                          : "text-foreground/90"
                      )}
                    >
                      {idx + 1}. {item.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteCriterion(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-400 transition-opacity shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {/* Add entry criterion */}
              {isAddingCriterion ? (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={newCriterionText}
                    onChange={(e) => setNewCriterionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCriterion();
                      if (e.key === "Escape") setIsAddingCriterion(false);
                    }}
                    placeholder="e.g. Asymmetric Risk to Reward"
                    className="h-8 text-sm flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCriterion}
                    className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCriterion(false)}
                    className="h-8 px-2 text-xs"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCriterion(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-400 transition-colors pt-1"
                >
                  <Plus size={13} />
                  Add entry criterion
                </button>
              )}
            </div>
          </section>

          {/* ─── Section: Trade Management Rules ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Trade Management Rules
              </h3>
            </div>

            <div className="space-y-2 text-sm text-foreground/90 leading-relaxed">
              {strategy.stopLossLogic && (
                <p>{strategy.stopLossLogic}</p>
              )}
              {strategy.invalidationRule && (
                <p>
                  If invalidation hits, you&apos;re done: exit and reassess, no &ldquo;one more trade to make it back&rdquo;
                </p>
              )}
              {strategy.killSwitchRule && (
                <p>{strategy.killSwitchRule}</p>
              )}
              {!strategy.stopLossLogic && !strategy.invalidationRule && !strategy.killSwitchRule && (
                <p className="text-muted-foreground italic">
                  Predefine risk before entry (fixed R, no resizing mid-trade). Add your trade management rules.
                </p>
              )}
            </div>
          </section>

          {/* ─── Section: Exit Criteria ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Exit Criteria
              </h3>
            </div>

            {strategy.exitStrategy?.tp1Ratio ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm text-foreground/90">
                  <span>
                    <strong className="text-emerald-400 font-mono">TP1</strong> at{" "}
                    {strategy.exitStrategy.tp1Ratio}R — scale{" "}
                    {strategy.exitStrategy.tp1Percent}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-foreground/90">
                  <span>
                    <strong className="text-emerald-400 font-mono">TP2</strong> at{" "}
                    {strategy.exitStrategy.tp2Ratio}R — scale{" "}
                    {strategy.exitStrategy.tp2Percent}%
                  </span>
                </div>
                {strategy.exitStrategy.breakevenRule && (
                  <p className="text-sm text-foreground/90">
                    {strategy.exitStrategy.breakevenRule}
                  </p>
                )}
                {strategy.exitStrategy.runnerRule && (
                  <p className="text-sm text-muted-foreground">
                    Runner: {strategy.exitStrategy.runnerRule}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add your exit rules so you don&apos;t freestyle
              </p>
            )}
          </section>

          {/* ─── Section: Disqualifiers / Stand-Down Protocol ─── */}
          {disqualifiers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertOctagon size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Disqualifiers
                </h3>
              </div>

              <div className="space-y-1.5">
                {disqualifiers.map((dis, idx) => (
                  <div key={dis.id || idx} className="flex items-start gap-2.5 py-0.5">
                    <AlertTriangle
                      size={13}
                      className="text-amber-400 shrink-0 mt-1"
                    />
                    <span className="text-sm text-foreground/90 leading-relaxed">
                      {dis.condition}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Section: Trading Notes / Psychology ─── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Trading Notes
              </h3>
            </div>

            <ul className="space-y-1.5 list-disc list-inside text-sm text-foreground/90 leading-relaxed marker:text-muted-foreground/60">
              {strategy.edgeStateNotes ? (
                strategy.edgeStateNotes
                  .split(/[.!?]+/)
                  .filter((s) => s.trim())
                  .map((note, idx) => (
                    <li key={idx}>{note.trim()}</li>
                  ))
              ) : (
                <>
                  <li>Bias is a plan + invalidation, not a prediction.</li>
                  <li>
                    If you can&apos;t say your bias in one sentence, you don&apos;t have one.
                  </li>
                  <li>If invalidation hits, reset. No coping, no revenge trade.</li>
                  <li>
                    &ldquo;You don&apos;t build trust in your system with affirmations. You build
                    it with data.&rdquo;
                  </li>
                  <li>
                    Conviction → confidence → competence → consistency.
                  </li>
                </>
              )}
            </ul>
          </section>

          {/* ─── Section: Refinement Log (Collapsed by default) ─── */}
          {refinements.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Version History
                </h3>
                <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 rounded">
                  {strategy.version}
                </span>
              </div>

              <div className="space-y-2.5">
                {refinements.slice(0, 3).map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                      {ref.version}
                    </span>
                    <div className="min-w-0">
                      <p className="text-foreground/90 leading-relaxed">
                        {ref.changeSummary}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {ref.date}
                        {ref.impactObserved && ` · ${ref.impactObserved}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
            "h-9 text-xs font-semibold px-5 press-scale",
            isReviewed
              ? "bg-emerald-600 hover:bg-emerald-600 text-white cursor-default"
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

        <span className="text-[11px] text-muted-foreground">
          Last reviewed {isReviewed ? "just now" : "—"}
        </span>
      </div>
    </div>
  );
}
