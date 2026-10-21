"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  Sliders,
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
import {
  RULE_CATEGORY_SCHEMAS,
  type CategorySchema,
  type ComparisonOperator,
  type ConsequenceType,
  type EvaluationScope,
  type MetricDefinition,
  type Rule,
  type RuleCategory,
  type SeverityLevel,
} from "@/types/rules";
import { cn } from "@/lib/utils";

interface RuleEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleSetId: string;
  initialRule?: Rule | null;
  onSaveSuccess: (savedRule: Rule) => void;
}

const CATEGORIES: RuleCategory[] = [
  "Risk",
  "Frequency",
  "Eligibility",
  "Recovery",
  "Discipline",
  "Checklist",
];

const SEVERITIES: SeverityLevel[] = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const CONSEQUENCE_CONFIGS: Record<
  ConsequenceType,
  { label: string; icon: typeof Shield; color: string; desc: string }
> = {
  BLOCK_TRADE: {
    label: "Block Trade",
    icon: ShieldAlert,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    desc: "Hard stop: prevents trade execution",
  },
  BLOCK: {
    label: "Block",
    icon: ShieldAlert,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    desc: "Rejects order submission",
  },
  WARN: {
    label: "Warning",
    icon: AlertTriangle,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    desc: "Permits trade with alert notice",
  },
  REDUCE_RISK: {
    label: "Reduce Risk",
    icon: Sliders,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    desc: "Caps sizing to half nominal risk",
  },
  COOLDOWN: {
    label: "Cooldown",
    icon: Clock,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    desc: "Enforces mandatory pause",
  },
  LOCK_ACCOUNT: {
    label: "Lock Account",
    icon: Lock,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    desc: "Halts all new orders for session",
  },
  REQUIRE_REVIEW: {
    label: "Require Review",
    icon: CheckCircle2,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    desc: "Must log prior trade first",
  },
  LIMIT_TRADES: {
    label: "Limit Trades",
    icon: Clock,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    desc: "Throttles daily order rate",
  },
  SIZE_REDUCTION: {
    label: "Size Reduction",
    icon: Sliders,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    desc: "Cuts lot size to comply with risk limit",
  },
  AUDIT_FAIL: {
    label: "Audit Flag",
    icon: Shield,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    desc: "Marks trade for post-analysis",
  },
};

const springPill = { type: "spring" as const, damping: 28, stiffness: 350 };
const springSwitch = { type: "spring" as const, damping: 25, stiffness: 320 };

export function RuleEditorModal({
  open,
  onOpenChange,
  ruleSetId,
  initialRule,
  onSaveSuccess,
}: RuleEditorModalProps) {
  const [category, setCategory] = useState<RuleCategory>(
    initialRule?.ruleCategory || "Risk",
  );
  const currentSchema: CategorySchema = RULE_CATEGORY_SCHEMAS[category];

  const [selectedMetricId, setSelectedMetricId] = useState<string>(
    initialRule?.condition || currentSchema.metrics[0].id,
  );
  const currentMetric: MetricDefinition =
    currentSchema.metrics.find((m) => m.id === selectedMetricId) ||
    currentSchema.metrics[0];

  const [ruleName, setRuleName] = useState(initialRule?.ruleName || "");
  const [description, setDescription] = useState(initialRule?.description || "");
  const [operator, setOperator] = useState<ComparisonOperator>(
    initialRule?.comparisonOperator || currentMetric.defaultOperator,
  );
  const [scope, setScope] = useState<EvaluationScope>(
    initialRule?.evaluationScope || currentMetric.defaultScope,
  );
  const [severity, setSeverity] = useState<SeverityLevel>(
    initialRule?.severity || currentMetric.defaultSeverity,
  );
  const [consequence, setConsequence] = useState<ConsequenceType>(
    initialRule?.consequence || currentMetric.defaultConsequence,
  );
  const [userMessage, setUserMessage] = useState(
    initialRule?.userMessage || currentMetric.defaultMessage,
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialRule?.consequenceDuration || 60,
  );
  const [isActive, setIsActive] = useState(
    initialRule ? initialRule.isActive : true,
  );

  // Threshold state
  const [numericThreshold, setNumericThreshold] = useState<number>(() => {
    if (typeof initialRule?.thresholdValue === "number") {
      return initialRule.thresholdValue;
    }
    return typeof currentMetric.defaultThreshold === "number"
      ? (currentMetric.defaultThreshold as number)
      : 2;
  });

  const [listThreshold, setListThreshold] = useState<string[]>(() => {
    if (Array.isArray(initialRule?.thresholdValue)) {
      return initialRule.thresholdValue.map(String);
    }
    if (Array.isArray(currentMetric.defaultThreshold)) {
      return (currentMetric.defaultThreshold as string[]).map(String);
    }
    return ["EURUSD", "GBPUSD", "NQ", "ES"];
  });
  const [newItemInput, setNewItemInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when editing or reopening
  useEffect(() => {
    if (initialRule) {
      setCategory(initialRule.ruleCategory);
      setSelectedMetricId(initialRule.condition);
      setRuleName(initialRule.ruleName);
      setDescription(initialRule.description || "");
      setOperator(initialRule.comparisonOperator);
      setScope(initialRule.evaluationScope);
      setSeverity(initialRule.severity);
      setConsequence(initialRule.consequence);
      setUserMessage(initialRule.userMessage || "");
      setDurationMinutes(initialRule.consequenceDuration || 60);
      setIsActive(initialRule.isActive);

      if (typeof initialRule.thresholdValue === "number") {
        setNumericThreshold(initialRule.thresholdValue);
      } else if (Array.isArray(initialRule.thresholdValue)) {
        setListThreshold(initialRule.thresholdValue.map(String));
      }
    } else {
      const metric = currentSchema.metrics[0];
      setSelectedMetricId(metric.id);
      setRuleName(metric.label);
      setDescription(metric.description);
      setOperator(metric.defaultOperator);
      setScope(metric.defaultScope);
      setSeverity(metric.defaultSeverity);
      setConsequence(metric.defaultConsequence);
      setUserMessage(metric.defaultMessage);
      if (typeof metric.defaultThreshold === "number") {
        setNumericThreshold(metric.defaultThreshold);
      } else if (Array.isArray(metric.defaultThreshold)) {
        setListThreshold(metric.defaultThreshold);
      }
    }
  }, [initialRule, open]);

  const handleCategoryChange = (newCat: RuleCategory) => {
    setCategory(newCat);
    const newSchema = RULE_CATEGORY_SCHEMAS[newCat];
    const metric = newSchema.metrics[0];
    setSelectedMetricId(metric.id);
    setRuleName(metric.label);
    setDescription(metric.description);
    setOperator(metric.defaultOperator);
    setScope(metric.defaultScope);
    setSeverity(metric.defaultSeverity);
    setConsequence(metric.defaultConsequence);
    setUserMessage(metric.defaultMessage);
    if (typeof metric.defaultThreshold === "number") {
      setNumericThreshold(metric.defaultThreshold);
    } else if (Array.isArray(metric.defaultThreshold)) {
      setListThreshold(metric.defaultThreshold);
    }
  };

  const handleMetricChange = (metricId: string) => {
    const metric = currentSchema.metrics.find((m) => m.id === metricId);
    if (!metric) return;
    setSelectedMetricId(metricId);
    setRuleName(metric.label);
    setDescription(metric.description);
    setOperator(metric.defaultOperator);
    setScope(metric.defaultScope);
    setSeverity(metric.defaultSeverity);
    setConsequence(metric.defaultConsequence);
    setUserMessage(metric.defaultMessage);
    if (typeof metric.defaultThreshold === "number") {
      setNumericThreshold(metric.defaultThreshold);
    } else if (Array.isArray(metric.defaultThreshold)) {
      setListThreshold(metric.defaultThreshold);
    }
  };

  const handleAddListItem = () => {
    if (!newItemInput.trim()) return;
    const clean = newItemInput.trim().toUpperCase();
    if (!listThreshold.includes(clean)) {
      setListThreshold([...listThreshold, clean]);
    }
    setNewItemInput("");
  };

  const handleRemoveListItem = (item: string) => {
    setListThreshold(listThreshold.filter((i) => i !== item));
  };

  const handleSave = async () => {
    if (!ruleName.trim()) {
      setErrorMsg("Rule title cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const thresholdVal =
      currentMetric.unit === "list"
        ? listThreshold
        : currentMetric.unit === "boolean"
          ? true
          : Number(numericThreshold);

    const payload = {
      id: initialRule?.id,
      ruleName: ruleName.trim(),
      description: description.trim() || null,
      ruleType: currentSchema.ruleType,
      ruleCategory: category,
      condition: selectedMetricId,
      comparisonOperator: operator,
      thresholdValue: thresholdVal,
      evaluationScope: scope,
      severity,
      consequence,
      consequenceDuration:
        consequence === "COOLDOWN" || consequence === "LOCK_ACCOUNT"
          ? durationMinutes
          : null,
      userMessage: userMessage.trim() || null,
      isActive,
    };

    try {
      const url = initialRule
        ? `/api/rules/sets/${ruleSetId}/rules/${initialRule.id}`
        : `/api/rules/sets/${ruleSetId}/rules`;
      const method = initialRule ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save rule");
      }

      const { rule } = await res.json();
      onSaveSuccess(rule);
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const thresholdDisplay =
    currentMetric.unit === "list"
      ? `[${listThreshold.join(", ")}]`
      : currentMetric.unit === "boolean"
        ? "Required"
        : `${numericThreshold}${currentMetric.unit === "%" ? "%" : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-0 sm:max-w-xl">
        {/* Header - Apple style: Clean, purposeful, zero gimmicks */}
        <div className="relative border-b border-border/80 bg-card p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground transition press-scale-sm"
          >
            <X size={18} />
          </button>

          <DialogTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {initialRule ? "Edit Guardrail" : "New Guardrail"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            {initialRule
              ? "Modify the trigger condition or enforcement consequence."
              : "Define a deterministic constraint to protect risk and execution discipline."}
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="space-y-5 p-5 sm:p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Apple Shortcuts-style Live Rule Sentence Preview */}
          <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Rule Statement
            </span>
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap leading-relaxed">
              <span className="text-muted-foreground">IF</span>
              <span className="font-semibold text-foreground">{currentMetric.label}</span>
              <span className="font-bold text-violet-400">{operator}</span>
              <span className="font-semibold text-foreground bg-white/[0.06] px-1.5 py-0.5 rounded">
                {thresholdDisplay}
              </span>
              <ArrowRight size={12} className="text-muted-foreground shrink-0" />
              <span className="font-semibold text-rose-400">
                {CONSEQUENCE_CONFIGS[consequence]?.label || consequence}
              </span>
            </div>
          </div>

          {/* Category Segmented Control (Apple iOS Segmented Control) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Rule Category</Label>
            <div className="relative flex p-1 rounded-xl bg-card border border-border/70 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "relative flex-1 min-w-[70px] py-1.5 text-xs font-medium rounded-lg text-center transition-colors press-scale-sm z-10",
                      isSelected
                        ? "text-white font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="rule-category-pill"
                        className="absolute inset-0 rounded-lg bg-violet-600 shadow-sm"
                        transition={springPill}
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 1: Condition & Threshold */}
          <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Condition & Threshold
            </span>

            {/* Metric Selection */}
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Target Metric</Label>
              <select
                value={selectedMetricId}
                onChange={(e) => handleMetricChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/70 bg-background/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {currentSchema.metrics.map((m) => (
                  <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                    {m.label} ({m.unit})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted-foreground/70 leading-relaxed">
                {currentMetric.description}
              </p>
            </div>

            {/* Operator + Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground block mb-1">Comparator</Label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ComparisonOperator)}
                  className="w-full h-9 rounded-lg border border-border/70 bg-background/50 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {currentMetric.allowedOperators.map((op) => (
                    <option key={op} value={op} className="bg-neutral-900 text-white font-mono">
                      {op} ({op === ">" ? "Greater" : op === "<" ? "Less" : op === ">=" ? "At least" : op === "<=" ? "At most" : op === "==" ? "Equals" : op === "IN" ? "Matches in" : "Not in list"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground block mb-1">
                  Threshold ({currentMetric.unit})
                </Label>
                {currentMetric.unit === "list" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddListItem())}
                        placeholder="Add ticker or session (e.g. EURUSD)"
                        className="h-9 text-xs bg-background/50 border-border/70 uppercase font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddListItem}
                        className="h-9 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white press-scale-sm"
                      >
                        <Plus size={14} className="mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-background/50 border border-border/60">
                      {listThreshold.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono bg-violet-500/15 text-violet-300 border border-violet-500/25"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleRemoveListItem(item)}
                            className="hover:text-white"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      {listThreshold.length === 0 && (
                        <span className="text-[11px] text-muted-foreground/60 italic">
                          No items added. Add at least one item.
                        </span>
                      )}
                    </div>
                  </div>
                ) : currentMetric.unit === "boolean" ? (
                  <div className="flex items-center h-9 px-3 rounded-lg border border-border/70 bg-background/50 text-xs text-emerald-400">
                    <CheckCircle2 size={14} className="mr-2 shrink-0" /> Required checklist gate
                  </div>
                ) : (
                  <Input
                    type="number"
                    step="0.1"
                    value={numericThreshold}
                    onChange={(e) => setNumericThreshold(Number(e.target.value))}
                    className="h-9 text-xs bg-background/50 border-border/70 font-mono"
                  />
                )}
              </div>
            </div>

            {/* Scope */}
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Evaluation Scope</Label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as EvaluationScope)}
                className="w-full h-9 rounded-lg border border-border/70 bg-background/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {currentMetric.allowedScopes.map((s) => (
                  <option key={s} value={s} className="bg-neutral-900 text-white">
                    {s === "TRADE" && "Single Trade Intent (Evaluated pre-entry)"}
                    {s === "DAILY" && "Daily Rolling Window (24h accumulation)"}
                    {s === "SESSION" && "Market Session Window"}
                    {s === "ACCOUNT" && "Account Lifetime / Equity Curve"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group 2: Enforcement & Action */}
          <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Enforcement & Actions
            </span>

            {/* Consequence selector */}
            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Action on Breach</Label>
              <select
                value={consequence}
                onChange={(e) => setConsequence(e.target.value as ConsequenceType)}
                className="w-full h-9 rounded-lg border border-border/70 bg-background/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {currentSchema.allowedConsequences.map((c) => {
                  const cfg = CONSEQUENCE_CONFIGS[c];
                  return (
                    <option key={c} value={c} className="bg-neutral-900 text-white">
                      {cfg?.label || c} — {cfg?.desc}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Duration if cooldown or lock */}
            {(consequence === "COOLDOWN" || consequence === "LOCK_ACCOUNT") && (
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Label className="text-xs text-muted-foreground block mb-1">
                    Duration (Minutes)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="h-9 text-xs bg-background/50 border-border/70 font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground pt-5">
                  Trading remains halted until the cooldown timer expires.
                </p>
              </div>
            )}

            {/* Severity Pill Selector */}
            <div>
              <Label className="text-xs text-muted-foreground block mb-1.5">Severity Level</Label>
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-background/50 border border-border/60">
                {SEVERITIES.map((sev) => {
                  const isSel = severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={cn(
                        "py-1.5 text-[11px] font-semibold rounded-lg text-center transition press-scale-sm",
                        isSel
                          ? sev === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : sev === "HIGH"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-violet-600 text-white"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Group 3: Labeling & Toggle */}
          <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Identity & Messaging
            </span>

            <div>
              <Label className="text-xs text-muted-foreground block mb-1">Rule Name</Label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Max Risk per Trade (2%)"
                className="h-9 text-xs bg-background/50 border-border/70"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground block mb-1">
                Trader Warning Notice (Optional)
              </Label>
              <Input
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Notice displayed to trader on breach"
                className="h-9 text-xs bg-background/50 border-border/70"
              />
            </div>

            {/* Apple Spring Toggle Switch */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Enable Guardrail
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Active rules are evaluated in real-time on all trade intents.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none press-scale-sm",
                  isActive ? "bg-violet-600" : "bg-neutral-800",
                )}
              >
                <motion.span
                  layout
                  transition={springSwitch}
                  className={cn(
                    "pointer-events-none inline-block size-5 rounded-full bg-white shadow-md ring-0",
                    isActive ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border/80 bg-muted/20 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground press-scale-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white press-scale-sm shadow-sm shadow-violet-950/30"
          >
            {isSubmitting ? "Saving..." : initialRule ? "Save Changes" : "Create Guardrail"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
