"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, RotateCcw, X } from "lucide-react";
import type { TradingAccount } from "@/types/account";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

interface ResetAccountDialogProps {
  account: TradingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountReset: (updated: TradingAccount) => void;
}

export function ResetAccountDialog({
  account,
  open,
  onOpenChange,
  onAccountReset,
}: ResetAccountDialogProps) {
  const { showFeedback } = useOperationFeedback();
  const [resetToStarting, setResetToStarting] = useState(true);
  const [customBalance, setCustomBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetBalance = resetToStarting
      ? account.startingBalance
      : Number(customBalance);

    if (!Number.isFinite(targetBalance) || targetBalance <= 0) {
      setError("Please specify a valid balance greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBalance: targetBalance }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset balance");
      }

      onAccountReset(data.account);
      onOpenChange(false);
    } catch (err: unknown) {
      showFeedback({ kind: "failure", title: "Balance wasn’t reset", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="relative border-b border-border/80 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
            <RotateCcw size={12} />
            <span>Balance Reset</span>
          </div>
          <DialogTitle className="mt-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Reset Demo Account Balance
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Resetting {account.name} will restore simulated capital and clear active drawdown limits.
          </DialogDescription>
        </div>

        <form onSubmit={handleReset} className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3.5 cursor-pointer">
              <input
                type="radio"
                name="resetType"
                checked={resetToStarting}
                onChange={() => setResetToStarting(true)}
                className="mt-0.5"
              />
              <div>
                <span className="block text-xs font-semibold text-foreground">
                  Reset to Initial Starting Balance
                </span>
                <span className="mt-0.5 block text-xs font-medium text-violet-400">
                  {account.currency} {account.startingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3.5 cursor-pointer">
              <input
                type="radio"
                name="resetType"
                checked={!resetToStarting}
                onChange={() => setResetToStarting(false)}
                className="mt-0.5"
              />
              <div className="w-full">
                <span className="block text-xs font-semibold text-foreground">
                  Set Custom Balance
                </span>
                {!resetToStarting && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      step="any"
                      min="1"
                      value={customBalance}
                      onChange={(e) => setCustomBalance(e.target.value)}
                      placeholder="e.g. 100000"
                      className="h-8 text-xs font-medium"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 gap-1.5 bg-amber-600 px-4 text-xs font-medium text-white shadow-sm hover:bg-amber-500"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  Confirm Reset
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
