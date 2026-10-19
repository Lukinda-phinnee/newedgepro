"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, CircleDollarSign, ClipboardCheck,
  Compass, LoaderCircle, LockKeyhole, Plus, ShieldCheck, Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"];
const steps = ["Account details", "Guardrails", "First trade plan", "Pre-market routine"];

export function AccountOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [accountName, setAccountName] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState("");
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState("");
  const [profitTarget, setProfitTarget] = useState("");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("");
  const [riskPerTradePercent, setRiskPerTradePercent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const accountAmount = Number(startingBalance);
  const validateAccountDetails = () => {
    if (!Number.isFinite(accountAmount) || accountAmount <= 0) {
      setError("Enter a starting balance greater than zero.");
      return false;
    }
    setError("");
    return true;
  };

  const validateGuardrails = () => {
    const dailyLossPercent = Number(maxDailyLossPercent);
    const drawdownPercent = Number(maxDrawdownPercent);
    const target = Number(profitTarget);
    const tradesPerDay = Number(maxTradesPerDay);
    const riskPercent = Number(riskPerTradePercent);
    if (!Number.isFinite(dailyLossPercent) || dailyLossPercent <= 0 || dailyLossPercent > 100 || !Number.isFinite(drawdownPercent) || drawdownPercent <= 0 || drawdownPercent > 100 || !Number.isFinite(target) || target <= 0 || target > 1000 || !Number.isInteger(tradesPerDay) || tradesPerDay <= 0 || !Number.isFinite(riskPercent) || riskPercent <= 0 || riskPercent > 100) {
      setError("Enter risk limits between 0 and 100%, a profit target up to 1,000%, and a whole number of trades per day.");
      return false;
    }
    setError("");
    return true;
  };

  const createAccount = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: "demo",
          name: accountName.trim() || undefined,
          startingBalance: accountAmount,
          currency,
          maxDailyLossPercent: Number(maxDailyLossPercent),
          maxDrawdownPercent: Number(maxDrawdownPercent),
          profitTargetPercent: Number(profitTarget),
          maxTradesPerDay: Number(maxTradesPerDay),
          riskPerTradePercent: Number(riskPerTradePercent),
        }),
      });
      let result: { error?: string };
      try {
        result = await response.json();
      } catch {
        setError("We couldn’t create your account right now. Please try again.");
        return;
      }
      if (!response.ok) {
        setError(result.error ?? "We couldn’t create your demo account. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn’t connect to the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-xl p-0">
        <div className="max-h-[92svh] overflow-y-auto">
          <header className="border-b border-border px-5 py-5 sm:px-7">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><TrendingUp size={18}/></span>
              <span className="text-sm font-semibold tracking-tight">Edge<span className="text-primary">Pro</span><span className="ml-2 text-xs font-normal text-muted-foreground">Account setup</span></span>
            </div>
            {step === 0 ? (
              <>
                <DialogTitle>Let’s set up your first trading account</DialogTitle>
                <DialogDescription className="mt-1.5">Choose how you’d like to get started. You can connect a live account later.</DialogDescription>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Step {step} of {steps.length}</span><span>{steps[step - 1]}</span></div>
                <div className="mb-5 grid grid-cols-4 gap-1.5" aria-label={`Step ${step} of ${steps.length}`}>
                  {steps.map((item, index) => <div key={item} className={`h-1 rounded-full ${index < step ? "bg-primary" : "bg-muted"}`} />)}
                </div>
                <DialogTitle>{step === 1 ? "Demo account details" : step === 2 ? "Set your guardrails" : step === 3 ? "First Trade Plan" : "Pre-Market Routine"}</DialogTitle>
                <DialogDescription className="mt-1.5">
                  {step === 1 && "Choose a name, starting balance, and currency for your demo account."}
                  {step === 2 && "These rules will protect both your demo and live accounts."}
                  {step === 3 && "Create your first trade plan before entering the market. Planning first helps you trade with intention instead of emotion."}
                  {step === 4 && "Complete your pre-market routine to review the market, confirm your bias, and prepare for your first protected trading session."}
                </DialogDescription>
              </>
            )}
          </header>

          <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            {step === 0 && <div className="space-y-3">
              <Button type="button" variant="outline" size="lg" disabled className="h-auto min-h-16 w-full justify-between px-4 py-3 text-left opacity-70">
                <span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><LockKeyhole size={17}/></span><span><span className="block text-sm font-semibold">Connect a trading account</span><span className="mt-1 block text-xs font-normal text-muted-foreground">Live broker connections are coming soon</span></span></span><span className="text-xs text-muted-foreground">Soon</span>
              </Button>
              <Button type="button" size="lg" className="h-auto min-h-16 w-full justify-between px-4 py-3 text-left" onClick={() => { setError(""); setStep(1); }}>
                <span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15"><Plus size={17}/></span><span><span className="block text-sm font-semibold">Create a demo account</span><span className="mt-1 block text-xs font-normal text-primary-foreground/75">Practice with your own balance and risk rules</span></span></span><ArrowRight size={17}/>
              </Button>
            </div>}

            {step === 1 && <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="account-name">Account name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="account-name" value={accountName} onChange={(event) => setAccountName(event.target.value)} maxLength={100} placeholder="Auto-generate a name" autoComplete="off"/><p className="text-xs text-muted-foreground">Leave blank and we’ll name it Demo account 1.</p></div>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2"><Label htmlFor="starting-balance">Starting balance</Label><div className="relative"><CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input id="starting-balance" className="pl-9" type="number" min="0.01" step="0.01" inputMode="decimal" value={startingBalance} onChange={(event) => setStartingBalance(event.target.value)} placeholder="10,000"/></div></div>
                <div className="space-y-2"><Label htmlFor="account-currency">Currency</Label><select id="account-currency" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring" value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              </div>
            </div>}

            {step === 2 && <div className="space-y-4">
              <Card className="border-border bg-muted/40 shadow-none"><CardContent className="flex gap-3 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary"/><p className="text-sm leading-relaxed text-muted-foreground">Set clear limits before you place your first trade. These guardrails are saved with this account and help keep risk visible.</p></CardContent></Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="max-daily-loss">Max daily loss (%)</Label><Input id="max-daily-loss" type="number" min="0.01" max="100" step="0.01" inputMode="decimal" value={maxDailyLossPercent} onChange={(event) => setMaxDailyLossPercent(event.target.value)} placeholder="3"/><p className="text-xs text-muted-foreground">Stop trading when this share of your balance is lost.</p></div>
                <div className="space-y-2"><Label htmlFor="max-drawdown">Max drawdown (%)</Label><Input id="max-drawdown" type="number" min="0.01" max="100" step="0.01" inputMode="decimal" value={maxDrawdownPercent} onChange={(event) => setMaxDrawdownPercent(event.target.value)} placeholder="10"/><p className="text-xs text-muted-foreground">Set the largest account decline you’ll allow.</p></div>
                <div className="space-y-2"><Label htmlFor="profit-target">Profit target (%)</Label><Input id="profit-target" type="number" min="0.01" max="1000" step="0.01" inputMode="decimal" value={profitTarget} onChange={(event) => setProfitTarget(event.target.value)} placeholder="10"/><p className="text-xs text-muted-foreground">Set your target as a share of the starting balance.</p></div>
                <div className="space-y-2"><Label htmlFor="max-trades">Max trades per day</Label><Input id="max-trades" type="number" min="1" step="1" inputMode="numeric" value={maxTradesPerDay} onChange={(event) => setMaxTradesPerDay(event.target.value)} placeholder="5"/><p className="text-xs text-muted-foreground">A daily cap helps prevent overtrading.</p></div>
                <div className="space-y-2"><Label htmlFor="risk-per-trade">Risk per trade (%)</Label><Input id="risk-per-trade" type="number" min="0.01" max="100" step="0.01" inputMode="decimal" value={riskPerTradePercent} onChange={(event) => setRiskPerTradePercent(event.target.value)} placeholder="1"/><p className="text-xs text-muted-foreground">Maximum planned loss as a share of your balance.</p></div>
              </div>
            </div>}

            {step === 3 && <Card className="border-border bg-muted/40 shadow-none"><CardContent className="space-y-4 p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Compass size={19}/></span>
              <p className="text-sm leading-relaxed text-foreground">Before you enter the market, decide what you’re looking for and what would invalidate your idea.</p>
              <ul className="space-y-2 text-sm text-muted-foreground"><li className="flex items-center gap-2"><Check size={15} className="text-primary"/>Define your setup and market context</li><li className="flex items-center gap-2"><Check size={15} className="text-primary"/>Plan your entry, exit, and risk</li><li className="flex items-center gap-2"><Check size={15} className="text-primary"/>Write down what would invalidate the trade</li></ul>
              <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">This is a reminder to plan with intention. You can create and save the plan from your workspace.</p>
            </CardContent></Card>}

            {step === 4 && <Card className="border-border bg-muted/40 shadow-none"><CardContent className="space-y-4 p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck size={19}/></span>
              <p className="text-sm leading-relaxed text-foreground">A consistent pre-market routine helps you prepare before the session starts.</p>
              <ul className="space-y-2 text-sm text-muted-foreground"><li className="flex items-center gap-2"><Check size={15} className="text-primary"/>Review the market and key levels</li><li className="flex items-center gap-2"><Check size={15} className="text-primary"/>Confirm your directional bias</li><li className="flex items-center gap-2"><Check size={15} className="text-primary"/>Check your account limits and readiness</li></ul>
              <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Take a moment to prepare before your first protected trading session.</p>
            </CardContent></Card>}

            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}

            {step > 0 && <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={() => { setError(""); setStep((current) => current - 1); }}><ArrowLeft/>Back</Button>
              {step === 1 ? <Button type="button" onClick={() => validateAccountDetails() && setStep(2)}>Next<ArrowRight/></Button> : step === 2 ? <Button type="button" onClick={() => validateGuardrails() && setStep(3)}>Next<ArrowRight/></Button> : step === 3 ? <Button type="button" onClick={() => { setError(""); setStep(4); }}>Next<ArrowRight/></Button> : <Button type="button" disabled={saving} onClick={createAccount}>{saving ? <><LoaderCircle className="animate-spin"/>Creating account…</> : <>Create account<ArrowRight/></>}</Button>}
            </div>}
            {step === 0 && <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><Sparkles size={13}/>You can connect a live account any time when that feature is available.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
