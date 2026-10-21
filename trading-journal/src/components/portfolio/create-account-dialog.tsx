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
import {
  BriefcaseBusiness,
  DollarSign,
  Loader2,
  Plus,
  ShieldAlert,
  X,
} from "lucide-react";
import type { TradingAccount } from "@/types/account";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"] as const;

const POPULAR_BROKERS = [
  "EdgePro Simulated",
  "Apex Trader Funding",
  "Topstep",
  "Interactive Brokers",
  "Tradovate",
  "NinjaTrader",
  "MetaTrader 5",
  "TradeStation",
  "Binance / Crypto",
];

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: (account: TradingAccount) => void;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  onAccountCreated,
}: CreateAccountDialogProps) {
  const [accountType, setAccountType] = useState<"demo" | "live">("demo");
  const [name, setName] = useState("");
  const [brokerName, setBrokerName] = useState("EdgePro Simulated");
  const [customBroker, setCustomBroker] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [startingBalance, setStartingBalance] = useState("50000");
  const [currency, setCurrency] = useState("USD");

  // Guardrails
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState("2.0");
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState("6.0");
  const [profitTargetPercent, setProfitTargetPercent] = useState("10.0");
  const [riskPerTradePercent, setRiskPerTradePercent] = useState("1.0");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("3");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balanceNum = Number(startingBalance) || 0;
  const dailyLossNum = balanceNum * ((Number(maxDailyLossPercent) || 0) / 100);
  const drawdownNum = balanceNum * ((Number(maxDrawdownPercent) || 0) / 100);
  const profitTargetNum = balanceNum * ((Number(profitTargetPercent) || 0) / 100);
  const riskTradeNum = balanceNum * ((Number(riskPerTradePercent) || 0) / 100);

  const resetForm = () => {
    setName("");
    setBrokerName(accountType === "demo" ? "EdgePro Simulated" : "Interactive Brokers");
    setCustomBroker("");
    setAccountNumber("");
    setStartingBalance("50000");
    setCurrency("USD");
    setMaxDailyLossPercent("2.0");
    setMaxDrawdownPercent("6.0");
    setProfitTargetPercent("10.0");
    setRiskPerTradePercent("1.0");
    setMaxTradesPerDay("3");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (balanceNum <= 0) {
      setError("Please specify a valid starting balance greater than 0.");
      return;
    }

    const dailyLossVal = Number(maxDailyLossPercent);
    if (!dailyLossVal || dailyLossVal <= 0 || dailyLossVal > 100) {
      setError("Max daily loss must be between 0.01% and 100%.");
      return;
    }

    const drawdownVal = Number(maxDrawdownPercent);
    if (!drawdownVal || drawdownVal <= 0 || drawdownVal > 100) {
      setError("Max drawdown must be between 0.01% and 100%.");
      return;
    }

    const targetVal = Number(profitTargetPercent);
    if (!targetVal || targetVal <= 0 || targetVal > 1000) {
      setError("Profit target must be between 0.01% and 1000%.");
      return;
    }

    const riskVal = Number(riskPerTradePercent);
    if (!riskVal || riskVal <= 0 || riskVal > 100) {
      setError("Risk per trade must be between 0.01% and 100%.");
      return;
    }

    const tradesDayVal = Number(maxTradesPerDay);
    if (!tradesDayVal || tradesDayVal <= 0) {
      setError("Max trades per day must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const chosenBroker =
        brokerName === "Custom" ? customBroker.trim() || null : brokerName || null;

      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          name: name.trim() || undefined,
          brokerName: chosenBroker,
          accountNumber: accountNumber.trim() || undefined,
          startingBalance: balanceNum,
          currency,
          maxDailyLossPercent: dailyLossVal,
          maxDrawdownPercent: drawdownVal,
          profitTargetPercent: targetVal,
          riskPerTradePercent: riskVal,
          maxTradesPerDay: Math.round(tradesDayVal),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      onAccountCreated(data.account);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
        <div className="relative border-b border-border/80 bg-gradient-to-b from-card to-card/60 p-5 sm:p-6">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
          >
            <X size={18} />
          </button>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Add New Account
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a new trading account and configure risk guardrails.
          </DialogDescription>

          {/* Account Type Toggle */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border/80 bg-background/50 p-1.5">
            <button
              type="button"
              onClick={() => {
                setAccountType("demo");
                setBrokerName("EdgePro Simulated");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                accountType === "demo"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-950/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BriefcaseBusiness size={14} />
              <span>Demo / Practice / Combine</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountType("live");
                setBrokerName("Interactive Brokers");
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                accountType === "live"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign size={14} />
              <span>Live Broker Account</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <ShieldAlert size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Account Identity & Broker
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-account-name" className="text-xs">
                  Account Name <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="create-account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={accountType === "demo" ? "e.g. Apex 50k Combine 1" : "e.g. IBKR Main Futures"}
                  maxLength={100}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-account-broker" className="text-xs">
                  Broker / Prop Firm
                </Label>
                <select
                  id="create-account-broker"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {POPULAR_BROKERS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Custom">Other / Custom</option>
                </select>
              </div>
            </div>

            {brokerName === "Custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="create-account-custom-broker" className="text-xs">
                  Specify Broker / Firm Name
                </Label>
                <Input
                  id="create-account-custom-broker"
                  value={customBroker}
                  onChange={(e) => setCustomBroker(e.target.value)}
                  placeholder="e.g. Tradovate, FTMO, Bybit"
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-account-balance" className="text-xs">
                  Starting Capital / Balance
                </Label>
                <div className="relative">
                  <Input
                    id="create-account-balance"
                    type="number"
                    min="1"
                    step="any"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    placeholder="50000"
                    required
                    className="h-9 pr-14 text-xs font-semibold"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                    {currency}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-account-currency" className="text-xs">
                  Base Currency
                </Label>
                <select
                  id="create-account-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Guardrails Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Risk Guardrails & Targets
                </h4>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  Rules enforced by EdgePro to keep your drawdown and emotional capital secure.
                </p>
              </div>
              <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                Active Protection
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Daily Loss */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label htmlFor="max-daily-loss" className="text-xs text-foreground/90">
                    Max Daily Loss (%)
                  </Label>
                  <span className="text-[11px] font-semibold text-rose-400">
                    -${dailyLossNum.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <Input
                  id="max-daily-loss"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={maxDailyLossPercent}
                  onChange={(e) => setMaxDailyLossPercent(e.target.value)}
                  className="mt-2 h-8 text-xs font-medium"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Lock trading if daily losses exceed this threshold.
                </p>
              </div>

              {/* Max Drawdown */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label htmlFor="max-drawdown" className="text-xs text-foreground/90">
                    Max Drawdown (%)
                  </Label>
                  <span className="text-[11px] font-semibold text-amber-400">
                    -${drawdownNum.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <Input
                  id="max-drawdown"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={maxDrawdownPercent}
                  onChange={(e) => setMaxDrawdownPercent(e.target.value)}
                  className="mt-2 h-8 text-xs font-medium"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Total account drop before breach warning / stop.
                </p>
              </div>

              {/* Profit Target */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label htmlFor="profit-target" className="text-xs text-foreground/90">
                    Profit Target (%)
                  </Label>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    +${profitTargetNum.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <Input
                  id="profit-target"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="1000"
                  value={profitTargetPercent}
                  onChange={(e) => setProfitTargetPercent(e.target.value)}
                  className="mt-2 h-8 text-xs font-medium"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Milestone goal (e.g. combine pass target or monthly goal).
                </p>
              </div>

              {/* Risk per trade */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <Label htmlFor="risk-per-trade" className="text-xs text-foreground/90">
                    Risk Per Trade (%)
                  </Label>
                  <span className="text-[11px] font-semibold text-violet-300">
                    ${riskTradeNum.toLocaleString("en-US", { maximumFractionDigits: 0 })} / trade
                  </span>
                </div>
                <Input
                  id="risk-per-trade"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={riskPerTradePercent}
                  onChange={(e) => setRiskPerTradePercent(e.target.value)}
                  className="mt-2 h-8 text-xs font-medium"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Maximum permitted loss size per setup.
                </p>
              </div>
            </div>

            {/* Max trades per day */}
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/50 p-3">
              <div>
                <Label htmlFor="max-trades-day" className="text-xs font-medium text-foreground/90">
                  Daily Execution Cap
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Maximum executions per day to curb overtrading.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="max-trades-day"
                  type="number"
                  min="1"
                  max="100"
                  value={maxTradesPerDay}
                  onChange={(e) => setMaxTradesPerDay(e.target.value)}
                  className="h-8 w-20 text-center text-xs font-semibold"
                />
                <span className="text-xs text-muted-foreground">trades</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
                  Creating account...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create Account
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
