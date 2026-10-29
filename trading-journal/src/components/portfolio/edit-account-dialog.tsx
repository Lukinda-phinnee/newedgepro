"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  DollarSign,
  Loader2,
  ShieldCheck,
  Sliders,
  X,
} from "lucide-react";
import type { TradingAccount, AccountStatus } from "@/types/account";
import { useOperationFeedback } from "@/components/ui/operation-feedback";

interface EditAccountDialogProps {
  account: TradingAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountUpdated: (updated: TradingAccount) => void;
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  onAccountUpdated,
}: EditAccountDialogProps) {
  const { showFeedback } = useOperationFeedback();
  const [name, setName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [status, setStatus] = useState<AccountStatus>("active");
  const [notes, setNotes] = useState("");

  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState("2.0");
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState("6.0");
  const [profitTargetPercent, setProfitTargetPercent] = useState("10.0");
  const [riskPerTradePercent, setRiskPerTradePercent] = useState("1.0");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("3");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBrokerName(account.brokerName || "");
      setAccountNumber(account.accountNumber || "");
      setCurrentBalance(String(account.currentBalance));
      setStatus(account.status);
      setNotes(account.notes || "");
      setMaxDailyLossPercent(String(account.maxDailyLossPercent));
      setMaxDrawdownPercent(String(account.maxDrawdownPercent));
      setProfitTargetPercent(String(account.profitTargetPercent));
      setRiskPerTradePercent(String(account.riskPerTradePercent));
      setMaxTradesPerDay(String(account.maxTradesPerDay));
      setError(null);
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const balanceNum = Number(currentBalance);
    if (!Number.isFinite(balanceNum) || balanceNum < 0) {
      setError("Please specify a valid balance.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          brokerName: brokerName.trim() || null,
          accountNumber: accountNumber.trim() || null,
          currentBalance: balanceNum,
          status,
          notes: notes.trim() || null,
          maxDailyLossPercent: Number(maxDailyLossPercent),
          maxDrawdownPercent: Number(maxDrawdownPercent),
          profitTargetPercent: Number(profitTargetPercent),
          riskPerTradePercent: Number(riskPerTradePercent),
          maxTradesPerDay: Math.round(Number(maxTradesPerDay)),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update account");
      }

      onAccountUpdated(data.account);
      onOpenChange(false);
    } catch (err: unknown) {
      showFeedback({ kind: "failure", title: "Account wasn’t updated", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0 sm:max-w-xl">
        <div className="relative border-b border-border/80 bg-gradient-to-b from-card to-card/60 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
            <Sliders size={12} />
            <span>Account Settings</span>
          </div>
          <DialogTitle className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Edit Account & Guardrails
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Adjust limits, status, and details for {account.name}.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Account Details */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-account-name" className="text-xs">
                Account Name
              </Label>
              <Input
                id="edit-account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-broker-name" className="text-xs">
                Broker / Firm Name
              </Label>
              <Input
                id="edit-broker-name"
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                placeholder="e.g. Apex, IBKR"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-current-balance" className="text-xs">
                Current Equity / Balance ({account.currency})
              </Label>
              <Input
                id="edit-current-balance"
                type="number"
                step="any"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                required
                className="h-9 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-account-status" className="text-xs">
                Account Status
              </Label>
              <select
                id="edit-account-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="passed">Target Passed / Funded</option>
                <option value="breached">Breached</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Guardrails */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-violet-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Guardrail Rules
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="edit-max-daily-loss" className="text-[11px] text-muted-foreground">
                  Max Daily Loss (%)
                </Label>
                <Input
                  id="edit-max-daily-loss"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={maxDailyLossPercent}
                  onChange={(e) => setMaxDailyLossPercent(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-max-drawdown" className="text-[11px] text-muted-foreground">
                  Max Drawdown (%)
                </Label>
                <Input
                  id="edit-max-drawdown"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={maxDrawdownPercent}
                  onChange={(e) => setMaxDrawdownPercent(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-profit-target" className="text-[11px] text-muted-foreground">
                  Profit Target (%)
                </Label>
                <Input
                  id="edit-profit-target"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="1000"
                  value={profitTargetPercent}
                  onChange={(e) => setProfitTargetPercent(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-risk-trade" className="text-[11px] text-muted-foreground">
                  Risk Per Trade (%)
                </Label>
                <Input
                  id="edit-risk-trade"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={riskPerTradePercent}
                  onChange={(e) => setRiskPerTradePercent(e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="edit-max-trades" className="text-xs text-foreground/80">
                Max Trades Per Day
              </Label>
              <Input
                id="edit-max-trades"
                type="number"
                min="1"
                max="100"
                value={maxTradesPerDay}
                onChange={(e) => setMaxTradesPerDay(e.target.value)}
                className="h-8 w-20 text-center text-xs font-semibold"
              />
            </div>
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
              className="h-9 gap-1.5 bg-violet-600 px-5 text-xs font-medium text-white shadow-sm hover:bg-violet-500"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
