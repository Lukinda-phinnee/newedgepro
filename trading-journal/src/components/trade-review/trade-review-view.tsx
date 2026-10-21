"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Bookmark,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  LayoutGrid,
  Play,
  Plus,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveAccount } from "@/components/active-account-context";
import { TradeReviewStats } from "@/components/trade-review/trade-review-stats";
import { TradeReviewCard } from "@/components/trade-review/trade-review-card";
import { TradeReviewTable } from "@/components/trade-review/trade-review-table";
import { TradeReviewModal } from "@/components/trade-review/trade-review-modal";
import type { ExecutionGrade, FollowedRules, ReviewStatus, Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface TradeReviewViewProps {
  initialTrades: Trade[];
}

type QueueTab = "unreviewed" | "reviewed" | "flagged" | "all";

export function TradeReviewView({ initialTrades }: TradeReviewViewProps) {
  const { activeAccount } = useActiveAccount();
  const [trades, setTrades] = useState<Trade[]>(initialTrades);

  // View Mode: cards (default) vs table
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<QueueTab>("unreviewed");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [ruleFilter, setRuleFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "win" | "loss">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "pnl-desc" | "pnl-asc">("date-desc");

  // Modal Review Studio
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tab counts
  const counts = useMemo(() => {
    const unreviewed = trades.filter((t) => !t.reviewStatus || t.reviewStatus === "unreviewed").length;
    const reviewed = trades.filter((t) => t.reviewStatus === "reviewed").length;
    const flagged = trades.filter((t) => t.reviewStatus === "flagged").length;
    return {
      unreviewed,
      reviewed,
      flagged,
      all: trades.length,
    };
  }, [trades]);

  // Filtered trades by tab and filters
  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        // Tab filter
        if (activeTab === "unreviewed") {
          if (t.reviewStatus && t.reviewStatus !== "unreviewed") return false;
        } else if (activeTab === "reviewed") {
          if (t.reviewStatus !== "reviewed") return false;
        } else if (activeTab === "flagged") {
          if (t.reviewStatus !== "flagged") return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSym = t.symbol.toLowerCase().includes(q);
          const matchStrat = t.strategy?.toLowerCase().includes(q);
          const matchNotes = t.notes?.toLowerCase().includes(q);
          const matchLesson = t.lessonsLearned?.toLowerCase().includes(q);
          const matchTags = t.mistakeTags?.some((tag) => tag.toLowerCase().includes(q));
          if (!matchSym && !matchStrat && !matchNotes && !matchLesson && !matchTags) {
            return false;
          }
        }

        // Grade filter
        if (gradeFilter !== "all" && t.executionGrade !== gradeFilter) {
          return false;
        }

        // Rule adherence filter
        if (ruleFilter !== "all" && t.followedRules !== ruleFilter) {
          return false;
        }

        // Outcome filter
        if (outcomeFilter === "win" && t.pnl <= 0) return false;
        if (outcomeFilter === "loss" && t.pnl >= 0) return false;

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
  }, [trades, activeTab, search, gradeFilter, ruleFilter, outcomeFilter, sortBy]);

  // Navigation inside review modal
  const currentIndex = selectedTrade
    ? filteredTrades.findIndex((t) => t.id === selectedTrade.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredTrades.length - 1;

  const handleNavigatePrev = () => {
    if (hasPrev) {
      setSelectedTrade(filteredTrades[currentIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      setSelectedTrade(filteredTrades[currentIndex + 1]);
    }
  };

  // Start queue from first unreviewed trade
  const handleStartReviewQueue = () => {
    const firstUnreviewed = trades.find((t) => !t.reviewStatus || t.reviewStatus === "unreviewed");
    if (firstUnreviewed) {
      setSelectedTrade(firstUnreviewed);
      setModalOpen(true);
    } else {
      showToast("All trades have already been reviewed!");
    }
  };

  // Open review modal for specific trade
  const handleOpenReview = (trade: Trade) => {
    setSelectedTrade(trade);
    setModalOpen(true);
  };

  // Save review mutation
  const handleSaveReview = async (updatedTrade: Trade) => {
    try {
      const res = await fetch(`/api/trades/${updatedTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: updatedTrade.reviewStatus,
          reviewedAt: updatedTrade.reviewedAt,
          executionGrade: updatedTrade.executionGrade,
          reviewRating: updatedTrade.reviewRating,
          followedRules: updatedTrade.followedRules,
          mistakeTags: updatedTrade.mistakeTags,
          whatWentWell: updatedTrade.whatWentWell,
          whatToImprove: updatedTrade.whatToImprove,
          lessonsLearned: updatedTrade.lessonsLearned,
          reviewNotes: updatedTrade.reviewNotes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update trade in database");
      }

      const data = await res.json();
      const saved = data.trade as Trade;

      setTrades((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      showToast(
        saved.reviewStatus === "reviewed"
          ? `Trade ${saved.symbol} reviewed (Grade ${saved.executionGrade || "A"}).`
          : `Trade ${saved.symbol} updated.`
      );
    } catch (err) {
      // Optimistic fallback for demo mode
      setTrades((prev) => prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
      showToast(`Trade ${updatedTrade.symbol} review saved locally.`);
    }
  };

  // Quick toggle flag
  const handleToggleFlag = async (trade: Trade) => {
    const newStatus: ReviewStatus = trade.reviewStatus === "flagged" ? "unreviewed" : "flagged";
    const updatedTrade: Trade = { ...trade, reviewStatus: newStatus };
    await handleSaveReview(updatedTrade);
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-violet-500/30 bg-card/95 px-4 py-3 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Trade Review Management
          </h1>
        </div>

        {/* View Switcher & Start Review Action */}
        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex rounded-xl border border-border/80 bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                viewMode === "cards"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                viewMode === "table"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
          </div>

          {counts.unreviewed > 0 && (
            <Button
              onClick={handleStartReviewQueue}
              className="h-9 gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 px-4 text-xs font-bold text-white shadow-sm hover:from-amber-500 hover:to-amber-600"
            >
              <Play size={14} fill="currentColor" />
              Review Next ({counts.unreviewed})
            </Button>
          )}
        </div>
      </div>

      {/* Executive Performance & Review Stats Bar */}
      <TradeReviewStats trades={trades} currency={activeAccount?.currency || "USD"} />

      {/* Tab Switcher: Unreviewed / Reviewed / Flagged / All */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap rounded-xl border border-border/80 bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("unreviewed")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              activeTab === "unreviewed"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            <Clock size={13} />
            <span>Awaiting Review</span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.2 text-[10px] font-bold",
                activeTab === "unreviewed" ? "bg-white/20 text-white" : "bg-white/[0.06] text-foreground/60"
              )}
            >
              {counts.unreviewed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviewed")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              activeTab === "reviewed"
                ? "bg-violet-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CheckCircle2 size={13} />
            <span>Reviewed Archive</span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.2 text-[10px] font-bold",
                activeTab === "reviewed" ? "bg-white/20 text-white" : "bg-white/[0.06] text-foreground/60"
              )}
            >
              {counts.reviewed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flagged")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              activeTab === "flagged"
                ? "bg-violet-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark size={13} fill={activeTab === "flagged" ? "currentColor" : "none"} />
            <span>Flagged for Study</span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.2 text-[10px] font-bold",
                activeTab === "flagged" ? "bg-white/20 text-white" : "bg-white/[0.06] text-foreground/60"
              )}
            >
              {counts.flagged}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
              activeTab === "all"
                ? "bg-violet-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers size={13} />
            <span>All Trades</span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.2 text-[10px] font-bold",
                activeTab === "all" ? "bg-white/20 text-white" : "bg-white/[0.06] text-foreground/60"
              )}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Counter indicator */}
        <div className="text-xs text-foreground/70">
          Showing <span className="font-semibold text-foreground">{filteredTrades.length}</span> of{" "}
          <span className="font-semibold text-foreground">{trades.length}</span> trades
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, leak, setup, lesson..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Grades</option>
            <option value="A+">Grade A+</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
            <option value="F">Grade F</option>
          </select>

          {/* Rule adherence filter */}
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Rule Statuses</option>
            <option value="yes">Followed Plan (100%)</option>
            <option value="partial">Minor Deviation</option>
            <option value="no">Broke Rules</option>
          </select>

          {/* Outcome filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as "all" | "win" | "loss")}
            className="flex h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Winning Trades</option>
            <option value="loss">Losing Trades</option>
          </select>

          {/* Sort */}
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
      </div>

      {/* Main Content: Cards View vs Table View */}
      {viewMode === "table" ? (
        <TradeReviewTable
          trades={filteredTrades}
          onReviewClick={handleOpenReview}
          onToggleFlag={handleToggleFlag}
          currency={activeAccount?.currency || "USD"}
        />
      ) : filteredTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/80 text-foreground/60">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {activeTab === "unreviewed"
              ? "No trades awaiting review"
              : "No trades match current filters"}
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-5 text-foreground/70">
            {activeTab === "unreviewed"
              ? "All your recorded trades have been audited and scored. Excellent professional discipline!"
              : "Try adjusting your search criteria or review filters to see your trades."}
          </p>
          {activeTab !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("all");
                setSearch("");
                setGradeFilter("all");
                setRuleFilter("all");
                setOutcomeFilter("all");
              }}
              className="mt-4 text-xs"
            >
              View All Trades
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTrades.map((trade) => (
            <TradeReviewCard
              key={trade.id}
              trade={trade}
              onReviewClick={handleOpenReview}
              onToggleFlag={handleToggleFlag}
              currency={activeAccount?.currency || "USD"}
            />
          ))}
        </div>
      )}

      {/* Review Studio Modal Dialog */}
      <TradeReviewModal
        trade={selectedTrade}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaveReview={handleSaveReview}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        currentIndex={currentIndex}
        totalInQueue={filteredTrades.length}
      />
    </div>
  );
}
