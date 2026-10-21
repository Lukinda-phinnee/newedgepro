import type {
  Trade,
  DayTradeSummary,
  WeekTradeSummary,
  MonthTradeSummary,
} from "@/types/trade";

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Returns a formatted date string YYYY-MM-DD from a Date object
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates ISO week number
 */
export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Groups a list of trades into a full month calendar grid with weekly performance columns.
 */
export function buildMonthCalendar(
  trades: Trade[],
  year: number,
  month: number, // 0-indexed: 0 = January, 9 = October
): MonthTradeSummary {
  const todayKey = formatDateKey(new Date());

  // Index trades by date YYYY-MM-DD
  const tradesByDate = new Map<string, Trade[]>();
  for (const trade of trades) {
    if (!trade.openedAt) continue;
    const dateStr = trade.openedAt.slice(0, 10);
    const list = tradesByDate.get(dateStr) || [];
    list.push(trade);
    tradesByDate.set(dateStr, list);
  }

  // Determine first day of month and last day of month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday is 0, Sunday is 6
  // JS getDay(): 0 is Sun, 1 is Mon... 6 is Sat
  const getMondayIndexedDay = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const startOffset = getMondayIndexedDay(firstDayOfMonth);
  const calendarStartDate = new Date(year, month, 1 - startOffset);

  const totalDays = Math.ceil((startOffset + lastDayOfMonth.getDate()) / 7) * 7;

  const weeks: WeekTradeSummary[] = [];
  let currentWeekDays: DayTradeSummary[] = [];

  let monthTotalPnl = 0;
  let monthTotalTrades = 0;
  let monthWins = 0;
  let monthLosses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let bestDayPnl = 0;
  let worstDayPnl = 0;

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(
      calendarStartDate.getFullYear(),
      calendarStartDate.getMonth(),
      calendarStartDate.getDate() + i,
    );

    const dateKey = formatDateKey(currentDate);
    const dayTrades = tradesByDate.get(dateKey) || [];

    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = dateKey === todayKey;

    let dayPnl = 0;
    let dayWins = 0;
    let dayLosses = 0;
    let dayBreakevens = 0;

    for (const t of dayTrades) {
      dayPnl += t.pnl;
      if (t.pnl > 0) {
        dayWins++;
        if (isCurrentMonth) grossProfit += t.pnl;
      } else if (t.pnl < 0) {
        dayLosses++;
        if (isCurrentMonth) grossLoss += Math.abs(t.pnl);
      } else {
        dayBreakevens++;
      }
    }

    if (isCurrentMonth && dayTrades.length > 0) {
      monthTotalPnl += dayPnl;
      monthTotalTrades += dayTrades.length;
      monthWins += dayWins;
      monthLosses += dayLosses;

      if (dayPnl > bestDayPnl) bestDayPnl = dayPnl;
      if (dayPnl < worstDayPnl) worstDayPnl = dayPnl;
    }

    const dayWinRate =
      dayTrades.length > 0 ? (dayWins / dayTrades.length) * 100 : 0;

    const daySummary: DayTradeSummary = {
      date: dateKey,
      dayOfWeek: currentDate.getDay(),
      dayOfMonth: currentDate.getDate(),
      isCurrentMonth,
      isToday,
      totalPnl: Math.round(dayPnl * 100) / 100,
      tradeCount: dayTrades.length,
      wins: dayWins,
      losses: dayLosses,
      breakevens: dayBreakevens,
      winRate: Math.round(dayWinRate),
      trades: dayTrades,
    };

    currentWeekDays.push(daySummary);

    // End of week (Sunday)
    if (currentWeekDays.length === 7) {
      let weekPnl = 0;
      let weekTradeCount = 0;
      let weekWins = 0;
      let weekLosses = 0;

      for (const d of currentWeekDays) {
        weekPnl += d.totalPnl;
        weekTradeCount += d.tradeCount;
        weekWins += d.wins;
        weekLosses += d.losses;
      }

      const weekWinRate =
        weekTradeCount > 0 ? (weekWins / weekTradeCount) * 100 : 0;
      const weekNum = getWeekNumber(currentDate);

      weeks.push({
        weekNumber: weekNum,
        weekLabel: `Week ${weekNum}`,
        startDate: currentWeekDays[0].date,
        endDate: currentWeekDays[6].date,
        totalPnl: Math.round(weekPnl * 100) / 100,
        tradeCount: weekTradeCount,
        wins: weekWins,
        losses: weekLosses,
        winRate: Math.round(weekWinRate),
        days: currentWeekDays,
      });

      currentWeekDays = [];
    }
  }

  const monthWinRate =
    monthTotalTrades > 0 ? (monthWins / monthTotalTrades) * 100 : 0;
  const profitFactor =
    grossLoss > 0
      ? grossProfit / grossLoss
      : grossProfit > 0
      ? 99.99
      : 0;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return {
    year,
    month,
    monthName: monthNames[month],
    totalPnl: Math.round(monthTotalPnl * 100) / 100,
    totalTrades: monthTotalTrades,
    winningTrades: monthWins,
    losingTrades: monthLosses,
    winRate: Math.round(monthWinRate),
    profitFactor: Math.round(profitFactor * 100) / 100,
    bestDayPnl: Math.round(bestDayPnl * 100) / 100,
    worstDayPnl: Math.round(worstDayPnl * 100) / 100,
    averageTradePnl:
      monthTotalTrades > 0
        ? Math.round((monthTotalPnl / monthTotalTrades) * 100) / 100
        : 0,
    weeks,
  };
}
