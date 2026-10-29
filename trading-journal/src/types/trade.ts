export type TradeSide = "long" | "short";
export type TradeStatus = "open" | "closed";
export type TradeOutcome = "win" | "loss" | "breakeven";
export type ReviewStatus = "unreviewed" | "reviewed" | "flagged";
export type FollowedRules = "yes" | "partial" | "no";
export type ExecutionGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface Trade {
  id: string;
  isDemo?: boolean;
  userId: string;
  accountId: string;
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number;
  pnlPercentage: number;
  status: TradeStatus;
  strategy: string | null;
  marketSession: string | null;
  marketCondition: string | null;
  confidence: number | null;
  plannedEntry: number | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fees?: number;
  rMultiple?: number;
  // Professional trade review properties
  reviewStatus?: ReviewStatus;
  reviewedAt?: string | null;
  executionGrade?: ExecutionGrade | null;
  reviewRating?: number | null;
  followedRules?: FollowedRules | null;
  mistakeTags?: string[] | null;
  whatWentWell?: string | null;
  whatToImprove?: string | null;
  lessonsLearned?: string | null;
  reviewNotes?: string | null;
  tradeManagement?: string | null;
  screenshots?: string[] | null;
  screenshotTitles?: string[] | null;
  entryConfluences?: string[] | null;
  entryEmotion?: string | null;
  exitEmotion?: string | null;
  // Automated Rule Engine evaluation properties
  ruleVerdict?: "ACCEPT" | "WARN" | "BLOCK" | null;
  ruleViolationsCount?: number | null;
  ruleEvaluation?: {
    verdict: "ACCEPT" | "WARN" | "BLOCK";
    triggeredRules: Array<{
      ruleId: string;
      ruleName: string;
      ruleCategory: string;
      metric: string;
      severity: string;
      consequence: string;
      message: string;
      actualValue?: unknown;
      threshold?: unknown;
    }>;
    passedRules?: Array<{ ruleId: string; ruleName: string; metric: string }>;
    messages: string[];
    evaluatedAt: string;
    ruleSetName?: string;
  } | null;
}

export interface DayTradeSummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  totalPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  trades: Trade[];
}

export interface WeekTradeSummary {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  winRate: number;
  days: DayTradeSummary[];
}

export interface MonthTradeSummary {
  year: number;
  month: number; // 0-indexed (0 = Jan, 9 = Oct)
  monthName: string;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  bestDayPnl: number;
  worstDayPnl: number;
  averageTradePnl: number;
  weeks: WeekTradeSummary[];
}
