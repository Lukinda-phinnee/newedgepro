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
      <div className="w-full overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-secondary/40 text-[10px] font-bold tracking-wider text-foreground/70 uppercase">
              <th className="py-3 pl-4 pr-3 whitespace-nowrap">Date &amp; Time</th>
              <th className="px-3 py-3 whitespace-nowrap">Symbol</th>
              <th className="px-3 py-3 whitespace-nowrap">Side</th>
              <th className="px-3 py-3 whitespace-nowrap">Entry / Exit</th>
              <th className="px-3 py-3 whitespace-nowrap">P&amp;L ($ / %)</th>
              <th className="px-3 py-3 whitespace-nowrap">Strategy</th>
              <th className="px-3 py-3 whitespace-nowrap">Rule Adherence</th>
              <th className="px-3 py-3 whitespace-nowrap">Grade / Rating</th>
              <th className="px-3 py-3 whitespace-nowrap">Identified Leaks</th>
              <th className="px-3 py-3 whitespace-nowrap">Review Status</th>
              <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
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
                    className="transition-colors hover:bg-secondary/30"
                  >
                    {/* Date & Time */}
                    <td
                      className="py-3.5 pl-4 pr-3 whitespace-nowrap"
                      suppressHydrationWarning
                    >
                      <div className="font-semibold text-foreground">{dateStr}</div>
                      <div className="text-[10px] text-foreground/70">{timeStr}</div>
                    </td>

                    {/* Symbol */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-lg border border-border/70 bg-secondary/80 px-2 py-1 text-xs font-bold text-foreground">
                          {trade.symbol}
                        </span>
                        {trade.screenshots && trade.screenshots.length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-300"
                            title={`${trade.screenshots.length} chart ${trade.screenshots.length === 1 ? "screenshot" : "screenshots"} attached`}
                          >
                            <LucideImage size={11} />
                            {trade.screenshots.length}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Side */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          trade.side === "long"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
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
                    <td className="px-3 py-3.5 whitespace-nowrap text-xs">
                      <div className="font-medium text-foreground">
                        ${trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-foreground/70">
                        {trade.exitPrice !== null ? (
                          `Exit: $${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="italic">Open</span>
                        )}
                      </div>
                    </td>

                    {/* P&L */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div
                        className={cn(
                          "font-extrabold",
                          isProfitable
                            ? "text-emerald-400"
                            : isLoss
                            ? "text-rose-400"
                            : "text-foreground/60"
                        )}
                      >
                        {isProfitable ? "+" : ""}
                        ${trade.pnl.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[10px] text-foreground/70">
                        {isProfitable ? "+" : ""}
                        {trade.pnlPercentage.toFixed(2)}%
                        {trade.rMultiple !== undefined && ` (${trade.rMultiple >= 0 ? "+" : ""}${trade.rMultiple}R)`}
                      </div>
                    </td>

                    {/* Strategy */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.strategy ? (
                        <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                          {trade.strategy}
                        </span>
                      ) : (
                        <span className="text-foreground/40">—</span>
                      )}
                    </td>

                    {/* Rule Adherence */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {trade.followedRules ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                            trade.followedRules === "yes"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : trade.followedRules === "partial"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                          )}
                        >
                          {trade.followedRules === "yes" ? (
                            <ShieldCheck size={11} />
                          ) : trade.followedRules === "partial" ? (
                            <ShieldAlert size={11} />
                          ) : (
                            <Flame size={11} />
                          )}
                          {trade.followedRules === "yes"
                            ? "Followed Plan"
                            : trade.followedRules === "partial"
                            ? "Deviation"
                            : "Broke Rules"}
                        </span>
                      ) : (
                        <span className="text-foreground/40 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Grade / Rating */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {trade.executionGrade ? (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase border",
                              trade.executionGrade === "A+" || trade.executionGrade === "A"
                                ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                                : trade.executionGrade === "B"
                                ? "border-violet-500/30 bg-violet-500/20 text-violet-300"
                                : trade.executionGrade === "C"
                                ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
                                : "border-rose-500/30 bg-rose-500/20 text-rose-300"
                            )}
                          >
                            {trade.executionGrade}
                          </span>
                        ) : (
                          <span className="text-foreground/40 text-[10px]">—</span>
                        )}

                        {trade.reviewRating && trade.reviewRating > 0 && (
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: trade.reviewRating }).map((_, i) => (
                              <Star key={i} size={10} fill="currentColor" />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Identified Leaks */}
                    <td className="max-w-[180px] px-3 py-3.5">
                      {trade.mistakeTags && trade.mistakeTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {trade.mistakeTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="truncate rounded border border-border/60 bg-secondary/40 px-1.5 py-0.5 text-[9px] text-foreground/80"
                            >
                              {tag}
                            </span>
                          ))}
                          {trade.mistakeTags.length > 2 && (
                            <span className="rounded bg-secondary/40 px-1 py-0.5 text-[9px] text-foreground/70">
                              +{trade.mistakeTags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-foreground/40 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Review Status */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {isReviewed ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 size={10} />
                          Reviewed
                        </span>
                      ) : isFlagged ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                          <Bookmark size={10} fill="currentColor" />
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <span className="size-1 rounded-full bg-amber-400 animate-pulse" />
                          Unreviewed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleFlag(trade)}
                          className={cn(
                            "rounded-lg p-1.5 transition",
                            isFlagged
                              ? "bg-violet-500/20 text-violet-300"
                              : "text-foreground/50 hover:bg-white/5 hover:text-foreground"
                          )}
                          title={isFlagged ? "Remove study flag" : "Flag for study"}
                        >
                          <Bookmark size={13} fill={isFlagged ? "currentColor" : "none"} />
                        </button>

                        <Button
                          size="sm"
                          onClick={() => onReviewClick(trade)}
                          className={cn(
                            "h-7 gap-1 px-2.5 text-[11px] font-semibold shadow-xs",
                            isUnreviewed
                              ? "bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm"
                              : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/70"
                          )}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 text-xs text-foreground/70">
          {/* Summary */}
          <div>
            Showing <span className="font-semibold text-foreground">{startIndex}</span> to{" "}
            <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
            <span className="font-semibold text-foreground">{trades.length}</span> trades
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
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

              <span className="px-2 font-medium text-foreground">
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
