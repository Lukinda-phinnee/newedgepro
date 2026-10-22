"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  FileCode,
  Layers,
  MoreVertical,
  Plus,
  Power,
  RotateCcw,
  Shield,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Rule, RuleCategory, RuleSet } from "@/types/rules";
import type { TradingAccount } from "@/types/account";
import { cn } from "@/lib/utils";

interface RuleSetsTabProps {
  ruleSet: RuleSet | null;
  ruleSets: RuleSet[];
  accounts: TradingAccount[];
  selectedCategoryFilter?: RuleCategory | "All";
  onSelectRuleSet: (ruleSetId: string) => void;
  onOpenCreateRule: () => void;
  onOpenEditRule: (rule: Rule) => void;
  onOpenInspectRule: (rule: Rule) => void;
  onOpenCopyModal: () => void;
  onRuleToggled: (ruleId: string, isActive: boolean) => void;
  onRuleDeleted: (ruleId: string) => void;
}

// Apple §4: Spring config for toggle animation
const springToggle = { type: "spring" as const, damping: 22, stiffness: 400 };

// Undo toast duration in ms (Apple §16.2: forgiveness via undo, not confirm dialogs)
const UNDO_TIMEOUT_MS = 5000;

const CATEGORIES: Array<RuleCategory | "All"> = [
  "All",
  "Risk",
  "Frequency",
  "Eligibility",
  "Recovery",
  "Discipline",
  "Checklist",
];

export function RuleSetsTab({
  ruleSet,
  ruleSets,
  accounts,
  selectedCategoryFilter = "All",
  onSelectRuleSet,
  onOpenCreateRule,
  onOpenEditRule,
  onOpenInspectRule,
  onOpenCopyModal,
  onRuleToggled,
  onRuleDeleted,
}: RuleSetsTabProps) {
  const [activeCategory, setActiveCategory] = useState<RuleCategory | "All">(
    selectedCategoryFilter,
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Apple §16.2 Agency: Undo-based deletion instead of confirm()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rules = ruleSet?.rules || [];

  // Active / inactive rule counts
  const activeCount = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);
  const inactiveCount = rules.length - activeCount;

  // Filter rules by selected category and active/inactive status
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchCat = activeCategory === "All" || r.ruleCategory === activeCategory;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && r.isActive) ||
        (statusFilter === "INACTIVE" && !r.isActive);
      return matchCat && matchStatus;
    });
  }, [rules, activeCategory, statusFilter]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: rules.length };
    for (const r of rules) {
      counts[r.ruleCategory] = (counts[r.ruleCategory] || 0) + 1;
    }
    return counts;
  }, [rules]);

  // Grouped by category for display
  const groupedRules = useMemo(() => {
    const groups: Partial<Record<RuleCategory, Rule[]>> = {};
    for (const r of filteredRules) {
      if (!groups[r.ruleCategory]) groups[r.ruleCategory] = [];
      groups[r.ruleCategory]!.push(r);
    }
    return groups;
  }, [filteredRules]);

  // Apple §16.2: Undo-based delete — optimistic removal with 5s undo window
  const handleDelete = useCallback(async (rule: Rule) => {
    // Immediately hide the rule (optimistic)
    setPendingDeleteId(rule.id);
    setPendingDeleteName(rule.ruleName);
    onRuleDeleted(rule.id);

    // Clear any existing timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Start undo countdown — after timeout, perform actual API delete
    undoTimerRef.current = setTimeout(async () => {
      setPendingDeleteId(null);
      setPendingDeleteName("");
      try {
        await fetch(`/api/rules/sets/${ruleSet?.id}/rules/${rule.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete rule:", err);
      }
    }, UNDO_TIMEOUT_MS);
  }, [ruleSet?.id, onRuleDeleted]);

  // Undo handler — re-add the rule and cancel the API delete
  const handleUndoDelete = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    // We need to re-fetch or reconstruct — for now, trigger a page-level refresh
    // by toggling the pending state (parent will re-render with original data on next fetch)
    setPendingDeleteId(null);
    setPendingDeleteName("");
    // Reload to restore — simplest correct approach
    window.location.reload();
  }, []);

  const handleToggle = async (rule: Rule) => {
    const nextState = !rule.isActive;
    onRuleToggled(rule.id, nextState);
    try {
      const res = await fetch(`/api/rules/sets/${ruleSet?.id}/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (!res.ok) {
        throw new Error(`Failed to toggle rule: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
      // Revert if error
      onRuleToggled(rule.id, rule.isActive);
    }
  };

  const accountScopeName = useMemo(() => {
    if (!ruleSet?.accountId) return "Global System Guardrails (Applies to All Accounts)";
    const acc = accounts.find((a) => a.id === ruleSet.accountId);
    return acc ? `Dedicated to: ${acc.name} (${acc.currency})` : "Account-Specific Rules";
  }, [ruleSet, accounts]);

  return (
    <div className="space-y-6">
      {/* Rule Set Header & Selector Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-foreground">
              {ruleSet?.name || "System Global Guardrails"}
            </h2>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                ruleSet?.isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700",
              )}
            >
              v{ruleSet?.version || 1} • {ruleSet?.isActive ? "Active" : "Draft"}
            </span>
            {!ruleSet?.accountId && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                System Default
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-violet-400" />
            {accountScopeName}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {ruleSets.length > 1 && (
            <select
              value={ruleSet?.id || ""}
              onChange={(e) => onSelectRuleSet(e.target.value)}
              className="h-8.5 rounded-lg border border-border/70 bg-background/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {ruleSets.map((rs) => (
                <option key={rs.id} value={rs.id} className="bg-neutral-900 text-white">
                  {rs.name} {!rs.accountId ? "(Global)" : "(Account)"}
                </option>
              ))}
            </select>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCopyModal}
            className="h-8.5 text-xs border-border/70 bg-white/[0.02] hover:bg-white/[0.06] text-foreground press-scale"
          >
            <Copy size={13} className="mr-1.5 text-muted-foreground" />
            Connect to Account
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenCreateRule}
            className="h-8.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale"
          >
            <Plus size={14} className="mr-1.5" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Category & Status Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const isSel = activeCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  isSel
                    ? "bg-violet-600 text-white shadow-sm font-semibold"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/60",
                )}
              >
                <span>{cat}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                    isSel ? "bg-white/20 text-white" : "bg-white/[0.05] text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active / Inactive Status Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/70 p-1 shrink-0 self-start md:self-auto text-xs shadow-sm">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => {
            const isSelected = statusFilter === status;
            const count =
              status === "ALL"
                ? rules.length
                : status === "ACTIVE"
                  ? activeCount
                  : inactiveCount;
            const labels = { ALL: "All", ACTIVE: "Active", INACTIVE: "Deactivated" };

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all press-scale-sm",
                  isSelected
                    ? status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : status === "INACTIVE"
                        ? "bg-neutral-800 text-neutral-300 border border-neutral-700 shadow-sm"
                        : "bg-white/10 text-white border border-white/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{labels[status]}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-black/30 text-white" : "bg-white/[0.06] text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-6">
        {Object.keys(groupedRules).length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
            <Shield size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-bold text-foreground">
              {statusFilter === "INACTIVE"
                ? "No deactivated rules found"
                : statusFilter === "ACTIVE"
                  ? "No active rules found"
                  : "No rules found in this category"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {statusFilter === "INACTIVE"
                ? "All guardrails in this view are currently active and enforcing discipline."
                : "Add your first rule to define constraints for this category and protect your process."}
            </p>
            {statusFilter === "INACTIVE" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusFilter("ALL")}
                className="mt-4 text-xs border-border/70"
              >
                View All Rules
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onOpenCreateRule}
                className="mt-4 text-xs bg-violet-600 hover:bg-violet-500 text-white"
              >
                <Plus size={13} className="mr-1.5" /> Create Rule
              </Button>
            )}
          </div>
        ) : (
          (Object.keys(groupedRules) as RuleCategory[]).map((cat) => {
            const catRules = groupedRules[cat] || [];
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {cat} Guardrails
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground/70">
                      ({catRules.length})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {catRules.map((rule) => {
                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all",
                          rule.isActive
                            ? "border-border/80 bg-card hover:border-violet-500/40 shadow-sm"
                            : "border-border/40 bg-card/60 opacity-75 hover:opacity-100",
                        )}
                      >
                        {/* Rule Main Information + Toggle Switch */}
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {/* Apple-style Interactive Toggle Switch */}
                          <div className="flex sm:flex-col items-center justify-center gap-1 shrink-0 self-start sm:self-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={rule.isActive}
                              aria-label={rule.isActive ? `Deactivate rule: ${rule.ruleName}` : `Activate rule: ${rule.ruleName}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(rule);
                              }}
                              title={rule.isActive ? "Click to deactivate rule" : "Click to activate rule"}
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500/50 press-scale-sm",
                                rule.isActive
                                  ? "bg-emerald-500 shadow-sm shadow-emerald-950/20"
                                  : "bg-neutral-800 border border-neutral-700/70",
                              )}
                            >
                              <motion.span
                                layout
                                transition={springToggle}
                                className={cn(
                                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-md ring-0",
                                  rule.isActive ? "translate-x-5" : "translate-x-0",
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                "text-[10px] font-bold tracking-wider uppercase select-none transition-colors",
                                rule.isActive ? "text-emerald-400" : "text-muted-foreground/60",
                              )}
                            >
                              {rule.isActive ? "Active" : "Off"}
                            </span>
                          </div>

                          <div className="min-w-0 space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={cn(
                                  "text-xs font-bold truncate transition-colors",
                                  rule.isActive ? "text-foreground" : "text-muted-foreground",
                                )}
                              >
                                {rule.ruleName}
                              </h4>

                              {/* Active Status Badge */}
                              <span
                                className={cn(
                                  "px-2 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider",
                                  rule.isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                    : "bg-neutral-800 text-neutral-400 border border-neutral-700",
                                )}
                              >
                                {rule.isActive ? "Active" : "Deactivated"}
                              </span>

                              {/* Severity Badge */}
                              <span
                                className={cn(
                                  "px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider",
                                  rule.severity === "CRITICAL"
                                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                    : rule.severity === "HIGH"
                                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30",
                                )}
                              >
                                {rule.severity}
                              </span>

                              {/* Consequence Badge */}
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-medium bg-white/[0.06] text-foreground">
                                {rule.consequence}
                              </span>

                              {/* Scope */}
                              <span className="text-[10px] text-muted-foreground/70 uppercase font-mono">
                                Scope: {rule.evaluationScope}
                              </span>
                            </div>

                            {/* Human readable condition equation */}
                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground flex-wrap">
                              <span className="text-violet-300 font-semibold">{rule.condition}</span>
                              <span className="text-muted-foreground/80">{rule.comparisonOperator}</span>
                              <span className="text-foreground font-semibold">
                                {Array.isArray(rule.thresholdValue)
                                  ? `[${rule.thresholdValue.join(", ")}]`
                                  : String(rule.thresholdValue)}
                              </span>
                              {rule.userMessage && (
                                <span className="text-muted-foreground/60 text-[11px] truncate max-w-sm">
                                  — "{rule.userMessage}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenInspectRule(rule)}
                            title="Inspect Rule Details"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground press-scale-sm"
                          >
                            <Eye size={14} className="mr-1" />
                            Inspect
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenEditRule(rule)}
                            title="Edit Rule Parameters"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground press-scale-sm"
                          >
                            <Edit2 size={13} className="mr-1" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === rule.id}
                            onClick={() => handleDelete(rule)}
                            title="Delete Rule"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-400 press-scale-sm"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Apple §16.2: Undo toast — appears after deletion, allows recovery */}
      <AnimatePresence>
        {pendingDeleteId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-card/95 backdrop-blur-lg px-4 py-3 shadow-2xl shadow-black/40"
          >
            <Trash2 size={15} className="text-rose-400 shrink-0" />
            <span className="text-xs text-foreground font-medium">
              Deleted <strong className="text-rose-400">{pendingDeleteName}</strong>
            </span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="ml-2 px-3 py-1 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white press-scale-sm"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
