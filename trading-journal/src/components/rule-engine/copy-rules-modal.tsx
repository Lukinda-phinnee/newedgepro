"use client";

import { useState } from "react";
import { Copy, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TradingAccount } from "@/types/account";
import type { RuleSet } from "@/types/rules";

interface CopyRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceRuleSet: RuleSet | null;
  accounts: TradingAccount[];
  onCopySuccess: (newSet: RuleSet) => void;
}

export function CopyRulesModal({
  open,
  onOpenChange,
  sourceRuleSet,
  accounts,
  onCopySuccess,
}: CopyRulesModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!sourceRuleSet) return null;

  const targetAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleCopy = async () => {
    if (!selectedAccountId) {
      setErrorMsg("Please select a target trading account.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/rules/copy-to-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceRuleSetId: sourceRuleSet.id,
          targetAccountId: selectedAccountId,
          targetAccountName: targetAccount?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to copy rules");
      }

      const { ruleSet } = await res.json();
      onCopySuccess(ruleSet);
      onOpenChange(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error copying rules");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-md overflow-y-auto p-0 sm:max-w-md">
        {/* Header - Unified system gradient and borders */}
        <div className="relative border-b border-border/80 bg-gradient-to-b from-card to-card/60 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground transition press-scale-sm"
          >
            <X size={18} />
          </button>

          <DialogTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Connect Rules to Account
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Copy this rule set into dedicated guardrails for a specific account.
          </DialogDescription>
        </div>

        {/* Content - System unified background surfaces */}
        <div className="space-y-4 p-5 sm:p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-1 text-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">Source Rule Set:</span>
            <span className="font-semibold text-foreground block text-sm">
              {sourceRuleSet.name}
            </span>
            <span className="text-muted-foreground block text-[11px]">
              {sourceRuleSet.rules?.length || sourceRuleSet.ruleCount || 0} active rules will be duplicated.
            </span>
          </div>

          <div>
            <Label className="text-xs font-medium text-foreground">
              Select Target Trading Account
            </Label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-xl border border-border/70 bg-background/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-neutral-900 text-white">
                  {acc.name} ({acc.currency} {acc.startingBalance.toLocaleString()} — {acc.accountType})
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            By default, the Rule Engine applies system-wide. Connecting rules to an account creates an account-specific rule set so that this account enforces custom constraints independently of global rules.
          </p>
        </div>

        {/* Footer - Unified system muted background and borders */}
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
            onClick={handleCopy}
            disabled={isSubmitting}
            className="text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale-sm"
          >
            {isSubmitting ? "Connecting..." : "Duplicate to Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
