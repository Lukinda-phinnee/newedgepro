"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChartNoAxesCombined, CheckCircle2, Gauge, History, KeyRound, LoaderCircle, Plus, Save, ShieldAlert, TableProperties, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculatePropfirmTracker } from "@/lib/propfirm-tracker";
import { createDefaultTrackerData, type ChallengePhaseSettings, type PropfirmRecord, type PropfirmTrackerData, type PropfirmTrade } from "@/types/propfirm-tracker";

type Props = { firm: PropfirmRecord; onBack: () => void };
type SaveState = "saved" | "saving" | "error";
const SESSION_OPTIONS = ["", "Asia", "London", "New York", "Sydney", "Overlap", "Other"];
const OUTCOME_OPTIONS: [PropfirmTrade["outcome"], string][] = [["pending", "Pending"], ["full-win", "Full win"], ["partial-win", "Partial win"], ["loss", "Loss"], ["breakeven", "Break even"]];

const asMoney = (value: number | null) => value === null ? "—" : value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const asPercent = (value: number | null) => value === null ? "—" : `${value.toFixed(2)}%`;

function normalizeTrackerData(firm: PropfirmRecord, saved = firm.trackerData): PropfirmTrackerData {
  const defaults = createDefaultTrackerData(firm.phases);
  if (!saved) return defaults;
  return {
    startingBalance: saved.startingBalance ?? defaults.startingBalance,
    selectedPhaseIndex: Math.min(Math.max(0, saved.selectedPhaseIndex ?? 0), defaults.phaseSettings.length - 1),
    phaseSettings: defaults.phaseSettings.map((initial, index) => ({ ...initial, ...saved.phaseSettings?.[index] })),
    trades: Array.isArray(saved.trades) ? saved.trades.map((trade) => ({ ...trade, generated: trade.generated ?? false })) : [],
  };
}

function TrackerPanel({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-xl border border-border/70 bg-card ${className}`}>
    <header className="flex h-12 items-center gap-2.5 border-b border-border/70 bg-muted/20 px-4 text-xs font-normal uppercase tracking-[0.08em] text-foreground"><span className="text-blue-400">{icon}</span>{title}</header>
    {children}
  </section>;
}

function SheetBand({ children, className = "bg-blue-700" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex min-h-8 items-center justify-center px-3 text-center text-xs font-normal uppercase tracking-[0.1em] text-white ${className}`}>{children}</div>;
}

function SheetColumnHeader({ columns }: { columns: string[] }) {
  return <div className="grid border-b border-border/70 bg-muted/40 text-center text-[10px] font-normal uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: columns.map((column) => column).join(" ") }}>
    <div className="border-r border-border/70 px-2 py-1.5" />{columns.slice(1).map((_, index) => <div key={index} className="border-r border-border/70 px-2 py-1.5 last:border-r-0">{String.fromCharCode(65 + index)}</div>)}
  </div>;
}

function SheetRow({ row, cells, columns }: { row: number; cells: React.ReactNode[]; columns: string[] }) {
  return <div className="grid min-h-10 border-b border-border/60 text-xs last:border-b-0 [&_label]:!text-xs" style={{ gridTemplateColumns: columns.join(" ") }}>
    <div className="flex items-center justify-center border-r border-border/60 bg-muted/30 px-1 text-[10px] text-muted-foreground">{row}</div>
    {cells.map((cell, index) => <div key={index} className="flex min-w-0 items-center border-r border-border/60 px-2 last:border-r-0">{cell}</div>)}
  </div>;
}

function SheetInput({ id, value, onChange, unit, max, step = "any", type = "number" }: { id: string; value: string; onChange: (value: string) => void; unit?: string; max?: number; step?: string; type?: string }) {
  return <div className="flex min-w-0 flex-1 items-center">
    <Input id={id} aria-label={id} type={type} min={type === "number" ? 0 : undefined} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="h-8 min-w-0 border-0 bg-transparent px-1 text-[10px] tabular-nums text-blue-400 shadow-none focus-visible:ring-1 focus-visible:ring-violet-400/60" />
    {unit && <span className="shrink-0 px-1 text-[10px] text-muted-foreground">{unit}</span>}
  </div>;
}

function SheetSelect({ id, value, onChange, options }: { id: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <select id={id} aria-label={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-8 min-w-0 w-full border-0 bg-transparent px-1 text-[10px] text-blue-400 outline-none focus-visible:ring-1 focus-visible:ring-violet-400/60">{options.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select>;
}

function EditableCell({ value, onChange, type = "text", className = "", maxLength, max }: { value: string; onChange: (value: string) => void; type?: string; className?: string; maxLength?: number; max?: number }) {
  return <input type={type} value={value} maxLength={maxLength} max={max} min="0" step="any" onChange={(event) => onChange(event.target.value)} className={`h-8 w-full min-w-20 rounded-md border border-transparent bg-transparent px-2 text-[10px] text-foreground outline-none transition hover:border-border/70 focus:border-violet-400/60 focus:bg-background ${className}`} />;
}

export function PropfirmChallengeDashboard({ firm, onBack }: Props) {
  const [data, setData] = useState<PropfirmTrackerData>(() => normalizeTrackerData(firm));
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [trackerLoaded, setTrackerLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const skipFirstSave = useRef(true);
  const saveSequence = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const selectedPhase = data.phaseSettings[data.selectedPhaseIndex] ?? data.phaseSettings[0];
  const summary = calculatePropfirmTracker(data);
  const selectedGeneratedCount = data.trades.filter((trade) => trade.phaseIndex === data.selectedPhaseIndex && trade.generated).length;

  useEffect(() => {
    const controller = new AbortController();
    setTrackerLoaded(false);
    setLoadError("");
    fetch(`/api/propfirms/${firm.id}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "We couldn’t load this tracker.");
        setData(normalizeTrackerData(firm, result.trackerData as PropfirmTrackerData));
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "We couldn’t load this tracker."); })
      .finally(() => { if (!controller.signal.aborted) setTrackerLoaded(true); });
    return () => controller.abort();
  }, [firm, loadAttempt]);

  useEffect(() => {
    if (!trackerLoaded || loadError) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    const sequence = ++saveSequence.current;
    const snapshot = data;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
        const response = await fetch(`/api/propfirms/${firm.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackerData: snapshot }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to save tracker.");
        if (sequence === saveSequence.current) setSaveState("saved");
      }).catch(() => { if (sequence === saveSequence.current) setSaveState("error"); });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [data, firm.id, trackerLoaded, loadError]);

  useEffect(() => {
    if (!trackerLoaded || loadError) return;
    setData((current) => {
      const realTrades = current.trades.filter((trade) => trade.phaseIndex === current.selectedPhaseIndex && !trade.generated).length;
      const generatedTrades = current.trades.filter((trade) => trade.phaseIndex === current.selectedPhaseIndex && trade.generated);
      const targetRows = Math.min(500, Math.max(realTrades, summary.estimatedTrades ?? realTrades));
      const generatedNeeded = Math.max(0, targetRows - realTrades);
      if (generatedTrades.length === generatedNeeded) return current;
      const keepIds = new Set(generatedTrades.slice(0, generatedNeeded).map((trade) => trade.id));
      const nextTrades = current.trades.filter((trade) => trade.phaseIndex !== current.selectedPhaseIndex || !trade.generated || keepIds.has(trade.id));
      for (let index = generatedTrades.length; index < generatedNeeded; index += 1) {
        nextTrades.push({ id: crypto.randomUUID(), phaseIndex: current.selectedPhaseIndex, generated: true, date: "", pair: "", session: "", outcome: "pending", riskPercent: "", notes: "" });
      }
      return { ...current, trades: nextTrades };
    });
  }, [trackerLoaded, loadError, data.selectedPhaseIndex, data.trades.length, selectedGeneratedCount, summary.estimatedTrades]);

  const updatePhase = (values: Partial<ChallengePhaseSettings>) => {
    setData((current) => ({ ...current, phaseSettings: current.phaseSettings.map((phase, index) => index === current.selectedPhaseIndex ? { ...phase, ...values } : phase) }));
  };
  const updateTrade = (id: string, values: Partial<PropfirmTrade>) => setData((current) => ({ ...current, trades: current.trades.map((trade) => trade.id === id ? { ...trade, ...values, generated: false } : trade) }));
  const addTrade = () => {
    if (data.trades.length >= 500) return;
    const trade: PropfirmTrade = { id: crypto.randomUUID(), phaseIndex: data.selectedPhaseIndex, generated: false, date: "", pair: "", session: "", outcome: "pending", riskPercent: selectedPhase?.nextTradeRiskPercent ?? "", notes: "" };
    setData((current) => ({ ...current, trades: [...current.trades, trade] }));
  };
  const removeTrade = (id: string) => setData((current) => ({ ...current, trades: current.trades.filter((trade) => trade.id !== id) }));
  const handleBack = async () => {
    if (!trackerLoaded || loadError) { onBack(); return; }
    const sequence = ++saveSequence.current;
    setSaveState("saving");
    try {
      await saveQueue.current.catch(() => undefined);
      const response = await fetch(`/api/propfirms/${firm.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackerData: data }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save tracker.");
      if (sequence === saveSequence.current) setSaveState("saved");
      onBack();
    } catch {
      if (sequence === saveSequence.current) setSaveState("error");
    }
  };
  const statusTone = summary.status === "Target reached" || summary.status === "On track" ? "positive" : "negative";

  return <div className="w-full space-y-6 [&_*]:!font-normal">
    <header className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleBack()}
          className="h-9 shrink-0 gap-1.5 rounded-xl border-border/70 px-3 text-xs font-medium transition-all hover:bg-muted active:scale-[0.98] cursor-pointer"
          disabled={saveState === "saving"}
        >
          <ArrowLeft size={14} />
          <span>Firms</span>
        </Button>

        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-border/70 bg-muted/40 shadow-xs dark:border-white/[0.08] dark:bg-white/[0.03]">
          {firm.logo ? (
            <img src={firm.logo} alt="" className="size-full object-contain p-1" />
          ) : (
            <div className="flex size-full items-center justify-center bg-violet-500/10 font-semibold text-xs text-violet-600 dark:text-violet-300">
              {firm.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {firm.name}
            </h1>
            <span className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 font-semibold text-[10px] text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-300">
              {firm.evaluation}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs" aria-live="polite">
        {saveState === "saving" ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 font-medium text-xs text-violet-700 dark:text-violet-300">
            <LoaderCircle size={13} className="animate-spin text-violet-500" />
            <span>Saving…</span>
          </div>
        ) : saveState === "error" ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 font-medium text-xs text-destructive">
            <ShieldAlert size={13} className="text-destructive" />
            <span>Save failed</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setData((current) => ({ ...current }))}
              className="ml-1 h-6 rounded px-2 text-[10px]"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-medium text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" />
            <span>Saved</span>
          </div>
        )}
      </div>
    </header>

    {!trackerLoaded ? <section className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-border/70 bg-card text-sm text-muted-foreground"><LoaderCircle size={16} className="animate-spin text-blue-400" />Loading challenge data…</section> : loadError ? <section role="alert" className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-card px-6 text-center"><ShieldAlert size={22} className="text-rose-400" /><p className="text-sm text-foreground">{loadError}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry loading</Button><Button type="button" variant="ghost" size="sm" onClick={onBack}>Back to firms</Button></div></section> : <>
      <div className="grid items-start gap-4 2xl:grid-cols-2">
        <TrackerPanel title="Mastery key" icon={<KeyRound size={15} />}>
          <SheetBand>⚙ Account settings</SheetBand>
          <SheetColumnHeader columns={["34px", "1.1fr", "1fr", "1.1fr"]} />
          <SheetRow row={1} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[
            <><Label htmlFor="start-balance" className="text-[10px] font-normal">Starting balance</Label></>,
            <SheetInput id="start-balance" value={data.startingBalance} onChange={(value) => setData((current) => ({ ...current, startingBalance: value }))} unit="USD" max={1_000_000_000} />,
            <span className="text-[11px] italic text-muted-foreground">Challenge starting balance</span>,
          ]} />
          <SheetRow row={2} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[
            <Label htmlFor="challenge-phase" className="text-[10px] font-normal">Challenge phase</Label>,
            <SheetSelect id="challenge-phase" value={String(data.selectedPhaseIndex)} onChange={(value) => setData((current) => ({ ...current, selectedPhaseIndex: Number(value) }))} options={firm.phases.map((phase, index) => [String(index), phase.name])} />,
            <span className="text-[11px] italic text-muted-foreground">Select phase rules</span>,
          ]} />
          <SheetRow row={3} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[<Label htmlFor="profit-target" className="font-normal">Profit target %</Label>, <SheetInput id="profit-target" value={selectedPhase?.profitTargetPercent ?? ""} onChange={(value) => updatePhase({ profitTargetPercent: value })} max={1000} />, <span className="text-[11px] italic text-muted-foreground">Target to pass</span>]} />
          <SheetRow row={4} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[<Label htmlFor="max-drawdown" className="font-normal">Max drawdown %</Label>, <SheetInput id="max-drawdown" value={selectedPhase?.maxDrawdownPercent ?? ""} onChange={(value) => updatePhase({ maxDrawdownPercent: value })} max={100} />, <span className="text-[11px] italic text-muted-foreground">Maximum total drawdown</span>]} />
          <SheetRow row={5} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[<Label htmlFor="max-daily-loss" className="font-normal">Max daily loss %</Label>, <SheetInput id="max-daily-loss" value={selectedPhase?.maxDailyLossPercent ?? ""} onChange={(value) => updatePhase({ maxDailyLossPercent: value })} max={100} />, <span className="text-[11px] font-normal italic text-rose-400">Hard cap</span>]} />
          <SheetRow row={6} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[<Label htmlFor="trades-to-pass" className="font-normal">Trades to pass</Label>, <SheetInput id="trades-to-pass" value={selectedPhase?.tradesToPass ?? ""} onChange={(value) => updatePhase({ tradesToPass: value })} unit="trades" max={10000} step="1" />, <span className="text-[11px] italic text-muted-foreground">Plan target</span>]} />
          <SheetRow row={7} columns={["34px", "1.1fr", "1fr", "1.1fr"]} cells={[<Label htmlFor="drawdown-method" className="font-normal">Drawdown method</Label>, <SheetSelect id="drawdown-method" value={selectedPhase?.drawdownType ?? "not-set"} onChange={(value) => updatePhase({ drawdownType: value })} options={[["not-set", "Not set"], ["static", "Static"], ["trailing", "Trailing"], ["end-of-day", "End of day"]]} />, <span className="text-[11px] italic text-muted-foreground">How the limit trails</span>]} />
        </TrackerPanel>

        <div className="grid gap-4">
          <TrackerPanel title="Live dashboard" icon={<Gauge size={15} />}>
            <SheetBand className="bg-emerald-800">📊 Live dashboard</SheetBand>
            <SheetColumnHeader columns={["34px", "1fr", "1fr", "1fr", "1fr"]} />
            <SheetRow row={1} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">Balance</span>, <span className="font-normal text-blue-400">{asMoney(summary.balance)}</span>, <span className="font-normal">Target</span>, <span className="font-normal text-emerald-400">{asMoney(summary.target)}</span>]} />
            <SheetRow row={2} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">To target</span>, <span>{asMoney(summary.toTarget)}</span>, <span className="font-normal">DD left</span>, <span className="font-normal text-rose-400">{asMoney(summary.drawdownLeft)}</span>]} />
            <SheetRow row={3} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">Drawdown</span>, <span className="text-emerald-400">{asPercent(summary.drawdownPercent)}</span>, <span className="font-normal">Trades (est.)</span>, <span className="text-sky-400">{summary.tradeCount} / {summary.estimatedTrades ?? "—"}</span>]} />
          </TrackerPanel>
          <TrackerPanel title="Next trade risk" icon={<ShieldAlert size={15} />}>
            <SheetBand className="bg-amber-800">🎯 Next trade risk</SheetBand>
            <SheetColumnHeader columns={["34px", "1fr", "1fr", "1fr", "1fr"]} />
            <SheetRow row={1} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<Label htmlFor="next-risk-percent" className="font-normal">Risk %</Label>, <SheetInput id="next-risk-percent" value={selectedPhase?.nextTradeRiskPercent ?? ""} onChange={(value) => updatePhase({ nextTradeRiskPercent: value })} max={100} />, <span className="font-normal">Risk $</span>, <span className="font-normal text-rose-400">{asMoney(summary.nextTradeRiskAmount)}</span>]} />
            <SheetRow row={2} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">Potential return %</span>, <span className="text-emerald-400">{asPercent(summary.potentialReturnPercent)}</span>, <span className="font-normal">Potential return $</span>, <span className="font-normal text-emerald-400">{asMoney(summary.potentialReturnAmount)}</span>]} />
            <SheetRow row={3} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<Label htmlFor="max-open-risk-percent" className="font-normal">Max open risk %</Label>, <SheetInput id="max-open-risk-percent" value={selectedPhase?.maxOpenRiskPercent ?? ""} onChange={(value) => updatePhase({ maxOpenRiskPercent: value })} max={100} />, <span className="font-normal">Algo status</span>, <span className={`font-normal ${summary.riskCapExceeded ? "text-rose-400" : "text-sky-400"}`}>{summary.algoStatus}</span>]} />
          </TrackerPanel>
        </div>

        <TrackerPanel title="Take profit settings" icon={<Target size={15} />}>
          <SheetBand className="bg-sky-800">⚙ Take profit settings</SheetBand>
          <SheetColumnHeader columns={["34px", "1fr", "1fr", "1fr"]} />
          <SheetRow row={1} columns={["34px", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">TP1 · Partial</span>, <SheetInput id="tp1-r" value={selectedPhase?.tp1R ?? ""} onChange={(value) => updatePhase({ tp1R: value })} unit="R" max={100} />, <SheetInput id="tp1-percent" value={selectedPhase?.tp1Percent ?? ""} onChange={(value) => updatePhase({ tp1Percent: value })} unit="%" max={100} />]} />
          <SheetRow row={2} columns={["34px", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">TP2 · Full</span>, <SheetInput id="tp2-r" value={selectedPhase?.tp2R ?? ""} onChange={(value) => updatePhase({ tp2R: value })} unit="R" max={100} />, <SheetInput id="tp2-percent" value={selectedPhase?.tp2Percent ?? ""} onChange={(value) => updatePhase({ tp2Percent: value })} unit="%" max={100} />]} />
          <div className="border-t border-border/60 px-3 py-1.5 text-[10px] text-muted-foreground">Full-win R weights both exits; partial-win R uses the TP1 portion.</div>
        </TrackerPanel>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-1">
          <TrackerPanel title="Multipliers & stats" icon={<ChartNoAxesCombined size={15} />}>
            <SheetBand className="bg-violet-800">📊 Multipliers (auto)</SheetBand>
            <SheetColumnHeader columns={["34px", "1.2fr", "1fr", "1.2fr"]} />
            <SheetRow row={1} columns={["34px", "1.2fr", "1fr", "1.2fr"]} cells={[<span className="font-normal">Partial win</span>, <span className="font-normal text-orange-400">{summary.partialWinR.toFixed(2)}R</span>, <span className="text-[11px] italic text-muted-foreground">TP1 multiplier</span>]} />
            <SheetRow row={2} columns={["34px", "1.2fr", "1fr", "1.2fr"]} cells={[<span className="font-normal">Full win</span>, <span className="font-normal text-orange-400">{summary.fullWinR.toFixed(2)}R</span>, <span className="text-[11px] italic text-muted-foreground">Weighted TP multiplier</span>]} />
            <SheetBand className="bg-cyan-950 text-sky-400">Your settings</SheetBand>
            <SheetRow row={3} columns={["34px", "1.2fr", "1fr", "1.2fr"]} cells={[<Label htmlFor="target-win-rate" className="font-normal">Target win rate</Label>, <SheetInput id="target-win-rate" value={selectedPhase?.targetWinRatePercent ?? ""} onChange={(value) => updatePhase({ targetWinRatePercent: value })} unit="%" max={100} />, <span className="text-[11px] italic text-muted-foreground">Planning assumption</span>]} />
            <SheetRow row={4} columns={["34px", "1.2fr", "1fr", "1.2fr"]} cells={[<span className="font-normal">Break-even win rate</span>, <span className="text-sky-400">{asPercent(summary.breakEvenWinRate)}</span>, <span className="text-[11px] italic text-muted-foreground">Calculated from full-win R</span>]} />
            <SheetRow row={5} columns={["34px", "1.2fr", "1fr", "1.2fr"]} cells={[<span className="font-normal">Expected losses / win</span>, <span className="text-sky-400">{summary.expectedLossesPerWin === null ? "—" : `${summary.expectedLossesPerWin.toFixed(1)} : 1`}</span>, <span className="text-[11px] italic text-muted-foreground">Calculated from target win rate</span>]} />
          </TrackerPanel>
          <div className="grid content-start gap-4">
            <TrackerPanel title="Account status" icon={<ShieldAlert size={15} />}>
              <SheetColumnHeader columns={["34px", "1fr", "1.5fr"]} />
              <SheetRow row={1} columns={["34px", "1fr", "1.5fr"]} cells={[<span className="font-normal uppercase">Current status</span>, <span className={`font-normal uppercase tracking-wide ${statusTone === "positive" ? "text-emerald-400" : "text-rose-400"}`}>● &nbsp;{summary.status}</span>]} />
            </TrackerPanel>
            <TrackerPanel title="Session stats" icon={<History size={15} />}>
              <SheetBand className="bg-purple-800">📈 Trade statistics</SheetBand>
              <SheetColumnHeader columns={["34px", "1fr", "1fr", "1fr", "1fr"]} />
              <SheetRow row={1} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">Wins (W)</span>, <span className="text-emerald-400">{summary.wins}</span>, <span className="font-normal">Partial (P)</span>, <span className="text-orange-400">{summary.partialWins}</span>]} />
              <SheetRow row={2} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">Losses (L)</span>, <span className="text-rose-400">{summary.losses}</span>, <span className="font-normal">Breakeven</span>, <span>{summary.breakevens}</span>]} />
              <SheetRow row={3} columns={["34px", "1fr", "1fr", "1fr", "1fr"]} cells={[<span className="font-normal">Win rate %</span>, <span className="text-sky-400">{asPercent(summary.winRate)}</span>, <span className="font-normal">Total P/L</span>, <span className={summary.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>{asMoney(summary.totalPnl)}</span>]} />
            </TrackerPanel>
          </div>
        </div>
      </div>

      <TrackerPanel title="Trade log" icon={<TableProperties size={15} />}>
        <SheetBand className="bg-slate-700">📝 Trade log</SheetBand>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3"><div><p className="text-sm font-normal text-foreground">Challenge trades</p><p className="text-[11px] text-muted-foreground">Risk, P/L, balance, drawdown, and target distance recalculate from each trade.</p></div><Button type="button" size="sm" onClick={addTrade} disabled={data.trades.length >= 500}><Plus />Add trade</Button></div>
        <div className="max-h-[68vh] overflow-auto">
          <table className="w-full min-w-[1440px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-card shadow-sm"><tr className="border-b border-border/70 text-[11px] font-normal uppercase tracking-wide text-muted-foreground">{["#", "Date", "Pair", "Session", "Outcome", "Risk %", "Risk $", "P/L $", "Balance", "DD %", "To target", "Status", "Notes", ""].map((head, index) => <th key={`${head}-${index}`} className="px-2 py-2 font-normal">{head}</th>)}</tr></thead>
            <tbody>{summary.trades.map((trade, index) => <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/10">
              <td className="px-3 py-1.5 text-xs text-muted-foreground">{index + 1}</td>
              <td className="min-w-32 px-1"><EditableCell type="date" value={trade.date} onChange={(value) => updateTrade(trade.id, { date: value })} /></td>
              <td className="min-w-28 px-1"><EditableCell value={trade.pair} maxLength={30} onChange={(value) => updateTrade(trade.id, { pair: value })} /></td>
              <td className="min-w-32 px-1"><select aria-label={`Session for trade ${index + 1}`} value={trade.session} onChange={(event) => updateTrade(trade.id, { session: event.target.value })} className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[10px] text-foreground outline-none focus:border-violet-400/60">{SESSION_OPTIONS.map((option) => <option key={option} value={option}>{option || "Select"}</option>)}</select></td>
              <td className="min-w-32 px-1"><select aria-label={`Outcome for trade ${index + 1}`} value={trade.outcome} onChange={(event) => updateTrade(trade.id, { outcome: event.target.value as PropfirmTrade["outcome"] })} className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[10px] text-foreground outline-none focus:border-violet-400/60">{OUTCOME_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
              <td className="min-w-24 px-1"><EditableCell type="number" value={trade.riskPercent} max={100} onChange={(value) => updateTrade(trade.id, { riskPercent: value })} className="tabular-nums" /></td>
              <td className="px-2 text-xs tabular-nums text-rose-400">{trade.riskAmount > 0 ? asMoney(trade.riskAmount) : "—"}</td>
              <td className={`px-2 text-xs tabular-nums ${trade.profitLoss > 0 ? "text-emerald-400" : trade.profitLoss < 0 ? "text-rose-400" : "text-muted-foreground"}`}>{asMoney(trade.profitLoss)}</td>
              <td className="px-2 text-xs tabular-nums text-blue-400">{asMoney(trade.balance)}</td>
              <td className="px-2 text-xs tabular-nums text-emerald-400">{asPercent(trade.drawdownPercent)}</td>
              <td className="px-2 text-xs tabular-nums">{asMoney(trade.toTarget)}</td>
              <td className="px-2 text-xs">{trade.status}</td>
              <td className="min-w-48 px-1"><EditableCell value={trade.notes} onChange={(value) => updateTrade(trade.id, { notes: value.slice(0, 1000) })} /></td>
              <td className="px-2">{!trade.generated && <button type="button" aria-label={`Remove trade ${index + 1}`} onClick={() => removeTrade(trade.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>}</td>
            </tr>)}</tbody>
          </table>
          {summary.trades.length === 0 && <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">No trades yet. Add the first trade to start the live calculations.</div>}
        </div>
      </TrackerPanel>
    </>}
  </div>;
}
