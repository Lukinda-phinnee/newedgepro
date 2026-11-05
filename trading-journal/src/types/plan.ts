export type MarketBias = "BULLISH" | "NEUTRAL" | "BEARISH" | "DEFENSIVE";

export type TradingSession = "ASIA" | "LONDON" | "NY_AM" | "NY_PM";

export type SetupStatus = "ARMED" | "PENDING" | "TRIGGERED" | "INVALIDATED" | "MISSED";

export interface PlannedSetup {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  strategyName: string;
  entryZone: string;
  invalidation: string;
  target1: string;
  target2?: string;
  rrRatio: number;
  triggerCondition: string;
  status: SetupStatus;
  notes?: string;
}

export interface PremarketChecklistItem {
  id: string;
  label: string;
  category: "routine" | "macro" | "technical" | "mindset";
  completed: boolean;
}

export interface DailyRiskPlan {
  maxDailyLossPercent: number;
  maxDailyLossAmount: number;
  maxTradesPerDay: number;
  riskPerTradePercent: number;
  cooldownMinutes: number;
  newsBlackoutTimes: string[];
}

export interface TradingPlanState {
  date: string;
  session: TradingSession;
  bias: MarketBias;
  isArmed: boolean;
  sleepHours: number;
  focusRating: number;
  stressLevel: "LOW" | "NORMAL" | "HIGH";
  checklist: PremarketChecklistItem[];
  setups: PlannedSetup[];
  riskPlan: DailyRiskPlan;
  selectedStrategyId: string | null;
  sessionThesis: string;
}

export interface AiCopilotMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  tag?: "audit" | "macro" | "invalidation" | "risk" | "general";
}

