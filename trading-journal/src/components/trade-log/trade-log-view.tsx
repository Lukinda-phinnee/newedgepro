"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveAccount } from "@/components/active-account-context";
import { buildMonthCalendar } from "@/lib/trade-calendar";
import { TradeCalendarView } from "@/components/trade-log/trade-calendar-view";
import { TradeTableView } from "@/components/trade-log/trade-table-view";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import { LogTradeDialog } from "@/components/trade-log/log-trade-dialog";
import type { Trade } from "@/types/trade";

interface TradeLogViewProps {
  initialTrades: Trade[];
}

export function TradeLogView({ initialTrades }: TradeLogViewProps) {
  const { activeAccount } = useActiveAccount();
  const { showFeedback, confirmAction } = useOperationFeedback();

  // Local trades state (synced with mutations)
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  useEffect(() => {
    setTrades(initialTrades);
  }, [initialTrades]);

  // Active view: 'calendar' or 'table'
  const [activeView, setActiveView] = useState<"calendar" | "table">("calendar");

  // Selected calendar month/year
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed

  // Modals state
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
  };

  // Compute month calendar data
  const monthSummary = useMemo(() => {
    return buildMonthCalendar(trades, selectedYear, selectedMonth);
  }, [trades, selectedYear, selectedMonth]);

  // Handlers for mutations
  const handleTradeLogged = (newTrade: Trade) => {
    setTrades((prev) => [newTrade, ...prev]);
    window.dispatchEvent(new Event("trade-log:updated"));
    showFeedback({ kind: "success", title: "Trade logged", description: `${newTrade.side.toUpperCase()} ${newTrade.symbol} was added to your journal.` });
  };

  const handleDeleteTrade = async (id: string) => {
    const trade = trades.find((item) => item.id === id);
    if (!(await confirmAction({ title: "Delete this trade?", description: `“${trade?.symbol ?? "This trade"}” will be removed from your journal. This can’t be undone.`, confirmLabel: "Delete trade" }))) {
      return;
    }
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrades((prev) => prev.filter((t) => t.id !== id));
        window.dispatchEvent(new Event("trade-log:updated"));
        showFeedback({ kind: "success", title: "Trade deleted", description: "The trade was removed from your journal." });
      } else {
        showFeedback({ kind: "failure", title: "Trade wasn’t deleted", description: "The server couldn’t remove this trade. Please try again." });
      }
    } catch (error) {
      showFeedback({ kind: "failure", title: "Trade wasn’t deleted", description: error instanceof Error ? error.message : "Please check your connection and try again." });
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Trade Log
          </h1>
        </div>

        {/* View Switcher & Action Button */}
        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex rounded-xl border border-border/80 bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveView("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeView === "calendar"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon size={14} />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("table")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeView === "table"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
          </div>

          {/* Log Trade Button */}
          <Button
            onClick={() => setLogModalOpen(true)}
            className="h-9 gap-1.5 bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-violet-500"
          >
            <Plus size={15} />
            Log Trade
          </Button>
        </div>
      </div>

      {/* Main Content: Calendar View vs Table View */}
      {activeView === "calendar" ? (
        <TradeCalendarView
          monthSummary={monthSummary}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          currency={activeAccount?.currency || "USD"}
          onLogTradeClick={() => setLogModalOpen(true)}
        />
      ) : (
        <TradeTableView
          trades={trades}
          onDeleteTrade={handleDeleteTrade}
          onLogTradeClick={() => setLogModalOpen(true)}
          currency={activeAccount?.currency || "USD"}
        />
      )}

      {/* Log Trade Modal Dialog */}
      <LogTradeDialog
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        onTradeLogged={handleTradeLogged}
      />
    </div>
  );
}
