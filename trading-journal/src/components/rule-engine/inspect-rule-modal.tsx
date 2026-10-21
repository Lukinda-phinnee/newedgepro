"use client";

import { AlertTriangle, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Rule } from "@/types/rules";
import { cn } from "@/lib/utils";

interface InspectRuleModalProps {
  rule: Rule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (rule: Rule) => void;
}

export function InspectRuleModal({
  rule,
  open,
  onOpenChange,
  onEdit,
}: InspectRuleModalProps) {
  if (!rule) return null;

  const thresholdDisplay = Array.isArray(rule.thresholdValue)
    ? rule.thresholdValue.join(", ")
    : String(rule.thresholdValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-0 sm:max-w-lg">
        {/* Header - Clean, professional, no badge */}
        <div className="relative border-b border-border/80 bg-card p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground transition press-scale-sm"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 flex-wrap pr-8">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {rule.ruleName}
            </DialogTitle>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                rule.isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700",
              )}
            >
              {rule.isActive ? "Active" : "Disabled"}
            </span>
          </div>

          {rule.description ? (
            <DialogDescription className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {rule.description}
            </DialogDescription>
          ) : (
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              {rule.ruleCategory} guardrail configuration and enforcement details.
            </DialogDescription>
          )}
        </div>

        {/* Content - Structured Spec Sheet */}
        <div className="space-y-4 p-5 sm:p-6">
          {/* Logic Expression Bar */}
          <div className="rounded-lg border border-border/70 bg-background/50 px-3.5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Trigger Logic
            </span>
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              <span className="font-semibold text-foreground">{rule.condition}</span>
              <span className="text-violet-400 font-bold">{rule.comparisonOperator}</span>
              <span className="font-semibold text-foreground bg-white/[0.06] px-1.5 py-0.5 rounded">
                {thresholdDisplay}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-rose-400 font-semibold">{rule.consequence}</span>
            </div>
          </div>

          {/* Properties Table */}
          <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/60">
            <div className="flex items-center justify-between px-4 py-2.5 bg-card/40 text-xs">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium text-foreground">{rule.ruleCategory}</span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-card/20 text-xs">
              <span className="text-muted-foreground">Evaluation Scope</span>
              <span className="font-mono text-foreground capitalize">
                {rule.evaluationScope.toLowerCase()}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-card/40 text-xs">
              <span className="text-muted-foreground">Severity Level</span>
              <span
                className={cn(
                  "font-semibold text-[11px] px-2 py-0.5 rounded",
                  rule.severity === "CRITICAL"
                    ? "bg-rose-500/15 text-rose-400"
                    : rule.severity === "HIGH"
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-amber-500/15 text-amber-400",
                )}
              >
                {rule.severity}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-card/20 text-xs">
              <span className="text-muted-foreground">Enforcement Action</span>
              <span className="font-medium text-foreground">
                {rule.consequence}
                {rule.consequenceDuration ? ` (${rule.consequenceDuration} mins)` : ""}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-card/40 text-xs">
              <span className="text-muted-foreground">Rule ID</span>
              <span className="font-mono text-[11px] text-muted-foreground/70">
                {rule.id}
              </span>
            </div>
          </div>

          {/* Trader Notice if defined */}
          {rule.userMessage && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs">
              <div className="text-[11px] font-semibold text-amber-300/90 mb-1 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                Alert Notice Displayed on Breach
              </div>
              <p className="text-muted-foreground italic leading-relaxed pl-3 border-l border-amber-500/30">
                "{rule.userMessage}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border/80 bg-muted/20 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground press-scale-sm"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit(rule);
            }}
            className="text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white press-scale-sm shadow-sm shadow-violet-950/30"
          >
            <Edit2 size={13} className="mr-1.5" />
            Edit Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
