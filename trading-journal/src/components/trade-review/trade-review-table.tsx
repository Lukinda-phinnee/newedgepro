"use client";

import { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Edit3,
  Flame,
  Image as LucideImage,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface TradeReviewTableProps {
  trades: Trade[];
  onReviewClick: (trade: Trade) => void;
  onToggleFlag: (trade: Trade) => void;
  currency?: string;
}

export function TradeReviewTable({
  trades,
  onReviewClick,
  onToggleFlag,
  currency = "USD",
}: TradeReviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize));

  // Safe current page if trades change
  const activePage = Math.min(currentPage, totalPages);

  // Paginated slice
  const paginatedTrades = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return trades.slice(start, start + pageSize);
  }, [trades, activePage, pageSize]);

  const startIndex = trades.length > 0 ? (activePage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(activePage * pageSize, trades.length);

  return (
    <div className="space-y-3">
      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 bg-secondary/30 text-[11px] font-medium text-muted-foreground">
              <th className="py-3 pl-4 pr-3 whitespace-nowrap">Date & Time</th>
              <th className="px-3 py-3 whitespace-nowrap">Symbol</th>
              <th className="px-3 py-3 whitespace-nowrap">Side</th>
              <th className="px-3 py-3 whitespace-nowrap">Entry / Exit</th>
              <th className="px-3 py-3 whitespace-nowrap">P&L ($ / %)</th>
              <th className="px-3 py-3 whitespace-nowrap">Strategy</th>
              <th className="px-3 py-3 whitespace-nowrap">Plan Adherence</th>
              <th className="px-3 py-3 whitespace-nowrap">Grade / Score</th>
              <th className="px-3 py-3 whitespace-nowrap">Identified Leaks</th>
              <th className="px-3 py-3 whitespace-nowrap">Review Status</th>
              <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-semibold text-foreground">No trades found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try adjusting your search criteria or review queue filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTrades.map((trade) => {
                const isProfitable = trade.pnl > 0;
                const isLoss = trade.pnl < 0;
                const isReviewed = trade.reviewStatus === "reviewed";
                const isFlagged = trade.reviewStatus === "flagged";
                const isUnreviewed = !trade.reviewStatus || trade.reviewStatus === "unreviewed";

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
                    className="transition-colors hover:bg-accent/40"
                  >
                    {/* Date & Time */}
                    <td
                      className="py-3 pl-4 pr-3 whitespace-nowrap tabular-nums"
                      suppressHydrationWarning
                    >
                      <div className="font-medium text-foreground">{dateStr}</div>
                      <div className="text-[10px] text-muted-foreground">{timeStr}</div>
                    </td>

                    {/* Symbol */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold tracking-tight text-foreground">
                          {trade.symbol}
                        </span>
                        {trade.screenshots && trade.screenshots.length > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded bg-secondary/80 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground"
                            title={`${trade.screenshots.length} screenshot${trade.screenshots.length === 1 ? "" : "s"} attached`}
                          >
                            <LucideImage size={10} />
                            {trade.screenshots.length}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Side */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          trade.side === "long"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {trade.side === "long" ? (
                          <ArrowUpRight size={11} />
                        ) : (
                          <ArrowDownLeft size={11} />
                        )}
                        {trade.side}
                      </span>
                    </td>

                    {/* Entry / Exit */}
                    <td className="px-3 py-3 whitespace-nowrap text-xs tabular-nums">
                      <div className="font-medium text-foreground">
                        ${trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {trade.exitPrice !== null ? (
                          `Exit: $${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="italic">Open</span>
                        )}
                      </div>
                    </td>

                    {/* P&L */}
                    <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                      <div
                        className={cn(
                          "font-semibold",
                          isProfitable
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isLoss
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        )}
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
                        {trade.rMultiple !== undefined && ` (${trade.rMultiple >= 0 ? "+" : ""}${trade.rMultiple}R)`}
                      </div>
                    </td>

                    {/* Strategy */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {trade.strategy ? (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {trade.strategy}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Rule Adherence */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {trade.ruleVerdict || trade.followedRules ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no")
                              ? "text-rose-600 dark:text-rose-400"
                              : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial")
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no") ? (
                            <Flame size={12} />
                          ) : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial") ? (
                            <ShieldAlert size={12} />
                          ) : (
                            <ShieldCheck size={12} />
                          )}
                          {trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no")
                            ? "Broke Rules"
                            : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial")
                            ? "Deviation"
                            : "Compliant"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Grade / Rating */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {trade.executionGrade ? (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.2 text-[10px] font-bold uppercase border tabular-nums",
                              trade.executionGrade === "A+" || trade.executionGrade === "A"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : trade.executionGrade === "B"
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                                : trade.executionGrade === "C"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {trade.executionGrade}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px]">—</span>
                        )}

                        {trade.reviewRating && trade.reviewRating > 0 && (
                          <div className="flex items-center text-amber-400/90">
                            {Array.from({ length: trade.reviewRating }).map((_, i) => (
                              <Star key={i} size={10} fill="currentColor" />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Identified Leaks */}
                    <td className="max-w-[180px] px-3 py-3">
                      {trade.mistakeTags && trade.mistakeTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {trade.mistakeTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="truncate rounded border border-border/50 bg-secondary/40 px-1.5 py-0.2 text-[9px] text-foreground/80"
                            >
                              {tag}
                            </span>
                          ))}
                          {trade.mistakeTags.length > 2 && (
                            <span className="rounded bg-secondary/30 px-1 py-0.2 text-[9px] text-muted-foreground">
                              +{trade.mistakeTags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Review Status */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {isReviewed ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 size={10} />
                          Reviewed
                        </Badge>
                      ) : isFlagged ? (
                        <Badge variant="violet" size="sm">
                          <Bookmark size={10} fill="currentColor" />
                          Flagged
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <Clock size={10} />
                          Awaiting
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleFlag(trade)}
                          className={cn(
                            "flex size-7 items-center justify-center rounded-lg transition active:scale-95",
                            isFlagged
                              ? "bg-violet-500/15 text-violet-500 dark:text-violet-300"
                              : "text-muted-foreground/60 hover:bg-secondary hover:text-foreground"
                          )}
                          title={isFlagged ? "Remove study flag" : "Flag for study"}
                        >
                          <Bookmark size={13} fill={isFlagged ? "currentColor" : "none"} />
                        </button>

                        <Button
                          size="sm"
                          variant={isUnreviewed ? "default" : "outline"}
                          onClick={() => onReviewClick(trade)}
                          className="h-7 gap-1 px-2.5 text-[11px] font-medium"
                        >
                          <Edit3 size={11} />
                          {isUnreviewed ? "Review" : "Edit"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {trades.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 text-xs text-muted-foreground">
          {/* Summary */}
          <div>
            Showing <span className="font-semibold text-foreground tabular-nums">{startIndex}</span> to{" "}
            <span className="font-semibold text-foreground tabular-nums">{endIndex}</span> of{" "}
            <span className="font-semibold text-foreground tabular-nums">{trades.length}</span> trades
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={activePage === 1}
                className="h-8 w-8 rounded-lg"
                title="First page"
              >
                <ChevronsLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="h-8 w-8 rounded-lg"
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </Button>

              <span className="px-2 font-medium text-foreground tabular-nums">
                Page {activePage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                className="h-8 w-8 rounded-lg"
                title="Next page"
              >
                <ChevronRight size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={activePage === totalPages}
                className="h-8 w-8 rounded-lg"
                title="Last page"
              >
                <ChevronsRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
