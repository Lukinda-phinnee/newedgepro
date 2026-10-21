"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Filter,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Trade } from "@/types/trade";

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
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "long" | "short">("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "win" | "loss" | "open">("all");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "pnl-desc" | "pnl-asc">("date-desc");

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
  }, [trades, search, sideFilter, outcomeFilter, strategyFilter, sortBy]);

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
              <th className="py-3 pl-4 pr-3">Date & Time</th>
              <th className="px-3 py-3">Symbol</th>
              <th className="px-3 py-3">Side</th>
              <th className="px-3 py-3">Entry Price</th>
              <th className="px-3 py-3">Exit Price</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">P&L</th>
              <th className="px-3 py-3">Strategy</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Review</th>
              <th className="px-3 py-3">Notes</th>
              {onDeleteTrade && <th className="py-3 pl-3 pr-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredTrades.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
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
                    className="transition-colors hover:bg-secondary/30"
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

                    {/* Entry Price */}
                    <td className="px-3 py-3.5 font-medium text-foreground whitespace-nowrap">
                      ${trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Exit Price */}
                    <td className="px-3 py-3.5 text-foreground whitespace-nowrap">
                      {trade.exitPrice !== null ? (
                        `$${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-muted-foreground italic">Open</span>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3.5 text-foreground whitespace-nowrap">
                      {trade.quantity}
                    </td>

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

                    {/* Strategy */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.strategy ? (
                        <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {trade.strategy}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          trade.status === "open"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {trade.status === "open" ? "Open" : "Closed"}
                      </span>
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

                    {/* Notes */}
                    <td className="max-w-[200px] truncate px-3 py-3.5 text-muted-foreground" title={trade.notes || undefined}>
                      {trade.notes || "—"}
                    </td>

                    {/* Actions */}
                    {onDeleteTrade && (
                      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteTrade(trade.id)}
                          aria-label="Delete trade"
                          className="rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
