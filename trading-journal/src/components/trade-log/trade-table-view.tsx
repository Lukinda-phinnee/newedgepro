"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Image as ImageIcon,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TradeDetailDialog } from "@/components/trade-log/trade-detail-dialog";
import { useActiveAccount } from "@/components/active-account-context";
import { calculatePipInfo } from "@/lib/pips";
import type { Trade } from "@/types/trade";
import type { TradingAccount } from "@/types/account";

interface TradeTableViewProps {
  trades: Trade[];
  onDeleteTrade?: (id: string) => void;
  onLogTradeClick?: () => void;
  currency?: string;
}

export function TradeTableView({
  trades,
  onDeleteTrade,
  onLogTradeClick,
  currency = "USD",
}: TradeTableViewProps) {
  const { accounts } = useActiveAccount();
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "long" | "short">("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "win" | "loss" | "open">("all");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [disciplineFilter, setDisciplineFilter] = useState<"all" | "compliant" | "warning" | "violation">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "pnl-desc" | "pnl-asc">("date-desc");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Distinct strategies for filter dropdown
  const strategies = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) {
      if (t.strategy) set.add(t.strategy);
    }
    return Array.from(set);
  }, [trades]);

  // Filtered and sorted trades
  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => {
        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSym = trade.symbol.toLowerCase().includes(q);
          const matchNotes = trade.notes?.toLowerCase().includes(q);
          const matchStrat = trade.strategy?.toLowerCase().includes(q);
          if (!matchSym && !matchNotes && !matchStrat) return false;
        }

        // Side filter
        if (sideFilter !== "all" && trade.side !== sideFilter) {
          return false;
        }

        // Outcome filter
        if (outcomeFilter === "win" && trade.pnl <= 0) return false;
        if (outcomeFilter === "loss" && trade.pnl >= 0) return false;
        if (outcomeFilter === "open" && trade.status !== "open") return false;

        // Strategy filter
        if (strategyFilter !== "all" && trade.strategy !== strategyFilter) {
          return false;
        }

        // Discipline filter
        if (disciplineFilter === "compliant") {
          const isComp = trade.ruleVerdict === "ACCEPT" || (!trade.ruleVerdict && trade.followedRules === "yes");
          if (!isComp) return false;
        } else if (disciplineFilter === "warning") {
          const isWarn = trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial");
          if (!isWarn) return false;
        } else if (disciplineFilter === "violation") {
          const isViol = trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no");
          if (!isViol) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
        }
        if (sortBy === "date-asc") {
          return new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
        }
        if (sortBy === "pnl-desc") {
          return b.pnl - a.pnl;
        }
        if (sortBy === "pnl-asc") {
          return a.pnl - b.pnl;
        }
        return 0;
      });
  }, [trades, search, sideFilter, outcomeFilter, strategyFilter, disciplineFilter, sortBy]);

  // Computed summary of the currently visible filtered trades
  const stats = useMemo(() => {
    const totalPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
    const wins = filteredTrades.filter((t) => t.pnl > 0).length;
    const losses = filteredTrades.filter((t) => t.pnl < 0).length;
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;
    return {
      totalPnl: Math.round(totalPnl * 100) / 100,
      wins,
      losses,
      winRate: Math.round(winRate),
      count: filteredTrades.length,
    };
  }, [filteredTrades]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, notes, setup..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          {/* Side filter */}
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value as "all" | "long" | "short")}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Sides</option>
            <option value="long">Longs Only</option>
            <option value="short">Shorts Only</option>
          </select>

          {/* Outcome filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as "all" | "win" | "loss" | "open")}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Winning Trades</option>
            <option value="loss">Losing Trades</option>
            <option value="open">Open Positions</option>
          </select>

          {/* Strategy filter */}
          {strategies.length > 0 && (
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Setups</option>
              {strategies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Discipline filter */}
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value as typeof disciplineFilter)}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Discipline</option>
            <option value="compliant">100% Compliant</option>
            <option value="warning">Warnings</option>
            <option value="violation">Rule Violations</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="pnl-desc">Highest P&L</option>
            <option value="pnl-asc">Lowest P&L</option>
          </select>
        </div>

        {/* Filtered Metrics Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredTrades.length}</span> trades
          </div>
          <div
            className={`rounded-lg border px-2.5 py-1 font-bold ${
              stats.totalPnl >= 0
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-secondary/30 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              <th className="py-3 pl-4 pr-3">Date</th>
              <th className="px-3 py-3">Asset</th>
              <th className="px-3 py-3">Img</th>
              <th className="px-3 py-3">Side</th>
              <th className="px-3 py-3">Result</th>
              <th className="px-3 py-3">Size</th>
              <th className="px-3 py-3">Planning</th>
              <th className="px-3 py-3">Risk %</th>
              <th className="px-3 py-3">RR</th>
              <th className="px-3 py-3">P&L</th>
              <th className="px-3 py-3">Pips</th>
              <th className="px-3 py-3">Governance</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Review</th>
              <th className="py-3 pl-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredTrades.length === 0 ? (
              <tr>
                <td
                  colSpan={15}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-medium text-foreground">No trades match your filters</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try clearing search parameters or record a new trade.
                    </p>
                    {onLogTradeClick && (
                      <Button
                        onClick={onLogTradeClick}
                        className="mt-3.5 h-8 gap-1.5 bg-violet-600 px-3 text-xs text-white hover:bg-violet-500"
                      >
                        <Plus size={13} />
                        Log a trade
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => {
                const isProfitable = trade.pnl > 0;
                const isLosing = trade.pnl < 0;
                const pipInfo = calculatePipInfo(trade.symbol, trade.entryPrice, trade.exitPrice, trade.side, trade.stopLoss, trade.takeProfit);
                const riskPercent = calculateRiskPercent(trade, accounts.find((account) => account.id === trade.accountId));

                const dateObj = new Date(trade.openedAt);
                const dateStr = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={trade.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${trade.symbol} ${trade.side} trade`}
                    onClick={() => setSelectedTrade(trade)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedTrade(trade);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-secondary/30 focus-visible:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/60"
                  >
                    {/* Date & Time */}
                    <td
                      className="py-3.5 pl-4 pr-3 whitespace-nowrap"
                      suppressHydrationWarning
                    >
                      <div className="font-medium text-foreground">{dateStr}</div>
                      <div className="text-[10px] text-muted-foreground">{timeStr}</div>
                    </td>

                    {/* Symbol */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="rounded-lg border border-border/70 bg-secondary/60 px-2 py-1 text-xs font-bold text-foreground">
                        {trade.symbol}
                      </span>
                    </td>

                    {/* Screenshot */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.screenshots?.[0] ? (
                        <div className="relative size-9 overflow-hidden rounded-md border border-border/70 bg-secondary/40" title={`${trade.screenshots.length} image${trade.screenshots.length === 1 ? "" : "s"} attached`}>
                          <Image src={trade.screenshots[0]} alt={`${trade.symbol} trade chart`} fill sizes="36px" unoptimized className="object-cover" />
                          {trade.screenshots.length > 1 && <span className="absolute bottom-0 right-0 rounded-tl bg-black/75 px-1 text-[9px] text-white">+{trade.screenshots.length - 1}</span>}
                        </div>
                      ) : <span className="flex size-9 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground/50" title="No image attached"><ImageIcon size={14} /></span>}
                    </td>

                    {/* Side */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          trade.side === "long"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {trade.side === "long" ? (
                          <ArrowUpRight size={11} />
                        ) : (
                          <ArrowDownLeft size={11} />
                        )}
                        {trade.side}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${trade.status === "open" ? "bg-amber-500/10 text-amber-400" : isProfitable ? "bg-emerald-500/10 text-emerald-400" : isLosing ? "bg-rose-500/10 text-rose-400" : "bg-secondary text-muted-foreground"}`}>
                        {trade.status === "open" ? "Open" : isProfitable ? "Win" : isLosing ? "Loss" : "Breakeven"}
                      </span>
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3.5 text-foreground whitespace-nowrap">
                      {trade.quantity}
                    </td>

                    {/* Planning */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${trade.plannedEntry != null ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-orange-500/10 text-orange-700 dark:text-orange-300"}`}>
                        {trade.plannedEntry != null ? "Planned" : "Unplanned"}
                      </span>
                    </td>

                    {/* Estimated risk as a percentage of the trade account balance */}
                    <td className="px-3 py-3.5 text-foreground whitespace-nowrap" title={riskPercent == null ? "Risk cannot be calculated without a supported FX pair, stop loss, and account balance" : "Estimated loss at stop as a percentage of account balance"}>
                      {riskPercent == null ? <span className="text-muted-foreground">—</span> : `${riskPercent.toFixed(2)}%`}
                    </td>

                    {/* Planned risk / reward */}
                    <td className="px-3 py-3.5 font-medium text-foreground whitespace-nowrap">{pipInfo.riskRewardRatio || "—"}</td>

                    {/* P&L */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div
                        className={`font-bold ${
                          isProfitable
                            ? "text-emerald-400"
                            : isLosing
                            ? "text-rose-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isProfitable ? "+" : ""}
                        ${trade.pnl.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {isProfitable ? "+" : ""}
                        {trade.pnlPercentage.toFixed(2)}%
                      </div>
                    </td>

                    {/* Pips / points */}
                    <td className="px-3 py-3.5 whitespace-nowrap text-foreground">
                      {pipInfo.pipsFormatted || <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Governance */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no") ? (
                        <div
                          className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300"
                          title={
                            trade.ruleEvaluation?.triggeredRules?.map((r) => `${r.ruleName}: ${r.message}`).join("\n") ||
                            "Rule violation detected during trade execution."
                          }
                        >
                          <AlertTriangle size={11} className="text-rose-400" />
                          <span>Violated</span>
                          {trade.ruleViolationsCount ? (
                            <span className="rounded-full bg-rose-500/20 px-1 text-[9px]">
                              {trade.ruleViolationsCount}
                            </span>
                          ) : null}
                        </div>
                      ) : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial") ? (
                        <div
                          className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300"
                          title={
                            trade.ruleEvaluation?.triggeredRules?.map((r) => `${r.ruleName}: ${r.message}`).join("\n") ||
                            "Minor rule deviation or warning threshold triggered."
                          }
                        >
                          <ShieldAlert size={11} className="text-amber-400" />
                          <span>Warning</span>
                        </div>
                      ) : (
                        <div
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
                          title={
                            trade.ruleEvaluation?.messages?.[0] ||
                            "Conforms 100% to all active rules and safety guardrails."
                          }
                        >
                          <ShieldCheck size={11} className="text-emerald-400" />
                          <span>Compliant</span>
                        </div>
                      )}
                    </td>

                    {/* Score */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.executionGrade || trade.reviewRating ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/60 px-2 py-1 text-[10px] font-bold text-foreground" title={trade.reviewRating ? `Review rating ${trade.reviewRating} out of 5` : "Execution grade"}>
                          {trade.executionGrade || "—"}{trade.reviewRating ? <span className="text-amber-400">· {trade.reviewRating}/5</span> : null}
                        </span>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </td>

                    {/* Review Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.reviewStatus === "reviewed" ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            Reviewed
                          </span>
                          {trade.executionGrade && (
                            <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-extrabold text-foreground border border-border/70">
                              {trade.executionGrade}
                            </span>
                          )}
                        </div>
                      ) : trade.reviewStatus === "flagged" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <span className="size-1 rounded-full bg-amber-400 animate-pulse" />
                          Unreviewed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedTrade(trade); }} aria-label={`View ${trade.symbol} trade details`} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-violet-500/10 hover:text-violet-400">
                          <Eye size={14} />
                        </button>
                        {onDeleteTrade && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTrade(trade.id);
                          }}
                          aria-label="Delete trade"
                          className="rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <TradeDetailDialog
        trade={selectedTrade}
        open={selectedTrade !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTrade(null);
        }}
        currency={currency}
      />
    </div>
  );
}

const FX_CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"]);
const STANDARD_FOREX_LOT_UNITS = 100_000;

function calculateRiskPercent(trade: Trade, account?: TradingAccount): number | null {
  if (!account || !trade.stopLoss || trade.entryPrice <= 0 || trade.quantity <= 0) return null;

  const pair = trade.symbol.toUpperCase().replace(/[^A-Z]/g, "");
  if (pair.length !== 6) return null;
  const baseCurrency = pair.slice(0, 3);
  const quoteCurrency = pair.slice(3, 6);
  if (!FX_CURRENCIES.has(baseCurrency) || !FX_CURRENCIES.has(quoteCurrency)) return null;

  // Standard FX lots represent 100,000 units of the base currency.
  const riskInQuoteCurrency = Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity * STANDARD_FOREX_LOT_UNITS;
  const accountCurrency = account.currency.toUpperCase();
  const riskInAccountCurrency = accountCurrency === quoteCurrency
    ? riskInQuoteCurrency
    : accountCurrency === baseCurrency
      ? riskInQuoteCurrency / trade.entryPrice
      : null;
  const balance = account.currentBalance > 0 ? account.currentBalance : account.startingBalance;

  if (riskInAccountCurrency == null || balance <= 0) return null;
  return (riskInAccountCurrency / balance) * 100;
}
