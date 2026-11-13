"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Image as LucideImage,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveAccount } from "@/components/active-account-context";
import { JournalTradeCard } from "@/components/journal/journal-trade-card";
import { JournalDetailModal } from "@/components/journal/journal-detail-modal";
import { LogTradeDialog } from "@/components/trade-log/log-trade-dialog";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface JournalViewProps {
  initialTrades: Trade[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthGroup {
  key: string; // YYYY-MM
  year: number;
  month: number; // 0-11
  label: string;
  isCurrentMonth: boolean;
  trades: Trade[];
}

export function JournalView({ initialTrades }: JournalViewProps) {
  const { activeAccount } = useActiveAccount();
  const { showFeedback } = useOperationFeedback();

  // Local trades state
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  useEffect(() => {
    setTrades(initialTrades);
  }, [initialTrades]);

  // Year state (page is scrollable per year)
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);

  // Sync with active account changes or trade-log:updated events
  useEffect(() => {
    if (!activeAccount?.id) return;

    const controller = new AbortController();
    const fetchTrades = async () => {
      try {
        const res = await fetch(`/api/trades?accountId=${encodeURIComponent(activeAccount.id)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.trades)) {
          setTrades(data.trades);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    };

    fetchTrades();
    window.addEventListener("trade-log:updated", fetchTrades);
    return () => {
      controller.abort();
      window.removeEventListener("trade-log:updated", fetchTrades);
    };
  }, [activeAccount?.id]);

  // Extract all distinct years with trades (plus current year)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentCalendarYear);
    for (const t of trades) {
      const d = new Date(t.openedAt || t.createdAt);
      if (!isNaN(d.getTime())) {
        yearsSet.add(d.getFullYear());
      }
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [trades, currentCalendarYear]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "win" | "loss" | "breakeven">("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "with-charts">("all");

  // Modals state
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Filtered trades by search and filters
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Outcome filter
      if (outcomeFilter === "win" && trade.pnl <= 0) return false;
      if (outcomeFilter === "loss" && trade.pnl >= 0) return false;
      if (outcomeFilter === "breakeven" && trade.pnl !== 0) return false;

      // Media filter
      if (
        mediaFilter === "with-charts" &&
        (!trade.screenshots || trade.screenshots.length === 0)
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSymbol = trade.symbol.toLowerCase().includes(q);
        const matchStrategy = trade.strategy?.toLowerCase().includes(q) ?? false;
        const matchNotes = trade.notes?.toLowerCase().includes(q) ?? false;
        const matchLessons = trade.lessonsLearned?.toLowerCase().includes(q) ?? false;
        const matchWentWell = trade.whatWentWell?.toLowerCase().includes(q) ?? false;
        const matchImprove = trade.whatToImprove?.toLowerCase().includes(q) ?? false;
        const matchTags = trade.mistakeTags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const matchSession = trade.marketSession?.toLowerCase().includes(q) ?? false;

        if (
          !matchSymbol &&
          !matchStrategy &&
          !matchNotes &&
          !matchLessons &&
          !matchWentWell &&
          !matchImprove &&
          !matchTags &&
          !matchSession
        ) {
          return false;
        }
      }

      return true;
    });
  }, [trades, outcomeFilter, mediaFilter, searchQuery]);

  // Group trades by month for the selected year:
  // Shows ONLY months with trades, sorted latest/current month first going backward
  const monthGroups: MonthGroup[] = useMemo(() => {
    const groupsMap = new Map<number, Trade[]>(); // month index (0-11) -> trades

    for (const trade of filteredTrades) {
      const d = new Date(trade.openedAt || trade.createdAt);
      if (isNaN(d.getTime())) continue;
      if (d.getFullYear() !== selectedYear) continue;

      const m = d.getMonth();
      const list = groupsMap.get(m) || [];
      list.push(trade);
      groupsMap.set(m, list);
    }

    // Only include months that actually have trades (> 0)
    const monthsWithTrades = Array.from(groupsMap.keys()).sort((a, b) => b - a); // 11 down to 0 (descending)

    const now = new Date();
    const isCurrentYear = selectedYear === now.getFullYear();
    const currentMonthIndex = now.getMonth();

    return monthsWithTrades.map((month) => {
      const monthTrades = groupsMap.get(month) || [];

      // Sort trades inside the month descending by openedAt
      monthTrades.sort((a, b) => {
        const timeA = new Date(a.openedAt || a.createdAt).getTime();
        const timeB = new Date(b.openedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      const isCurrent = isCurrentYear && month === currentMonthIndex;

      return {
        key: `${selectedYear}-${String(month + 1).padStart(2, "0")}`,
        year: selectedYear,
        month,
        label: `${MONTH_NAMES[month]} ${selectedYear}`,
        isCurrentMonth: isCurrent,
        trades: monthTrades,
      };
    });
  }, [filteredTrades, selectedYear]);

  // Handle modal navigation between trades in current list
  const currentTradeIndex = useMemo(() => {
    if (!selectedTrade) return -1;
    return filteredTrades.findIndex((t) => t.id === selectedTrade.id);
  }, [selectedTrade, filteredTrades]);

  const handleNavigatePrev = () => {
    if (currentTradeIndex > 0) {
      setSelectedTrade(filteredTrades[currentTradeIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (currentTradeIndex < filteredTrades.length - 1) {
      setSelectedTrade(filteredTrades[currentTradeIndex + 1]);
    }
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailModalOpen(true);
  };

  const handleTradeLogged = (newTrade: Trade) => {
    setTrades((prev) => [newTrade, ...prev]);
    const tradeYear = new Date(newTrade.openedAt || newTrade.createdAt).getFullYear();
    if (tradeYear && tradeYear !== selectedYear) {
      setSelectedYear(tradeYear);
    }
    window.dispatchEvent(new Event("trade-log:updated"));
    showFeedback({
      kind: "success",
      title: "Trade added to Journal",
      description: `${newTrade.side.toUpperCase()} ${newTrade.symbol} was recorded in your journal.`,
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ─── Page Header & Quick Actions (Clean, no subtitle) ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Journal
          </h1>

          {/* Year Switcher */}
          <div className="flex items-center rounded-xl border border-border/80 bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              aria-label="Previous year"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="px-2.5 text-xs font-bold text-foreground tabular-nums">
              {selectedYear}
            </span>

            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              aria-label="Next year"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Quick Year Pill Selectors (if multiple years exist) */}
          {availableYears.length > 1 && (
            <div className="hidden items-center gap-1 sm:flex">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-xs font-medium tabular-nums transition",
                    selectedYear === yr
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  )}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setLogModalOpen(true)}
            className="h-9 gap-1.5 rounded-lg bg-violet-600 px-3.5 text-xs font-semibold text-white shadow-sm shadow-violet-950/30 transition hover:bg-violet-500"
          >
            <Plus size={15} />
            <span>Log a trade</span>
          </Button>
        </div>
      </div>

      {/* ─── Search & Filters Bar (Border-free, padding-free, background-free) ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by symbol, notes, lesson, strategy, or tags…"
            className="h-9 pl-8 text-xs rounded-xl bg-background border-border/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Outcome Toggle */}
          <div className="flex rounded-lg border border-border/80 bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setOutcomeFilter("all")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition",
                outcomeFilter === "all"
                  ? "bg-secondary text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setOutcomeFilter("win")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition",
                outcomeFilter === "win"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Wins
            </button>
            <button
              type="button"
              onClick={() => setOutcomeFilter("loss")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition",
                outcomeFilter === "loss"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Losses
            </button>
          </div>

          {/* Media Filter */}
          <div className="flex rounded-lg border border-border/80 bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMediaFilter("all")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition",
                mediaFilter === "all"
                  ? "bg-secondary text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Trades
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter("with-charts")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition",
                mediaFilter === "with-charts"
                  ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LucideImage size={12} />
              With Charts
            </button>
          </div>
        </div>
      </div>

      {/* ─── Scrollable Months of Selected Year (Only months with trades, latest first) ─── */}
      <div className="space-y-10">
        {monthGroups.map((group) => (
          <section
            key={group.key}
            aria-label={group.label}
            className="space-y-4"
          >
            {/* Month Section Header */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-secondary/80 text-foreground border border-border/60">
                  <CalendarIcon size={14} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {group.label}
                </h2>

                {group.isCurrentMonth && (
                  <Badge variant="violet" size="sm" className="font-semibold text-[10px]">
                    <Sparkles size={11} className="mr-1" />
                    Current Month
                  </Badge>
                )}
              </div>

              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {group.trades.length} {group.trades.length === 1 ? "trade" : "trades"}
              </span>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.trades.map((trade) => (
                <JournalTradeCard
                  key={trade.id}
                  trade={trade}
                  currency={activeAccount?.currency || "USD"}
                  onClick={handleTradeClick}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Empty State when no trades exist for selected year or filter match */}
        {monthGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-secondary/10 p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              {searchQuery || outcomeFilter !== "all" || mediaFilter !== "all" ? (
                <Search size={22} />
              ) : (
                <CalendarIcon size={22} />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {searchQuery || outcomeFilter !== "all" || mediaFilter !== "all"
                  ? `No trades match your filters in ${selectedYear}`
                  : `No trades logged in ${selectedYear}`}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {searchQuery || outcomeFilter !== "all" || mediaFilter !== "all"
                  ? "Try resetting your search query or adjusting the filters above."
                  : `There are no recorded trade executions for the year ${selectedYear}.`}
              </p>
            </div>
            {searchQuery || outcomeFilter !== "all" || mediaFilter !== "all" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setOutcomeFilter("all");
                  setMediaFilter("all");
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLogModalOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Plus size={13} />
                Log Trade in {selectedYear}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Detail & Lightbox Modal ─── */}
      <JournalDetailModal
        trade={selectedTrade}
        currency={activeAccount?.currency || "USD"}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        hasPrev={currentTradeIndex > 0}
        hasNext={currentTradeIndex < filteredTrades.length - 1}
      />

      {/* ─── Log Trade Dialog ─── */}
      <LogTradeDialog
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        onTradeLogged={handleTradeLogged}
      />
    </div>
  );
}
