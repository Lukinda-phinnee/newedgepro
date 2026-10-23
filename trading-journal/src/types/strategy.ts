export type StrategyStatus = "ACTIVE" | "CALIBRATING" | "PROBATION" | "ARCHIVED";

export type StrategyCategory =
  | "Liquidity Sweep"
  | "Trend Continuation"
  | "Breakout & Momentum"
  | "Mean Reversion"
  | "Range Bound"
  | "News Catalyst"
  | (string & {});

export interface ChecklistItem {
  id: string;
  label: string;
  phase: "PRE_CONDITION" | "TRIGGER" | "CONFIRMATION";
  required: boolean;
  notes?: string;
}

export interface DisqualifierItem {
  id: string;
  condition: string;
  severity: "FATAL_EXIT" | "REDUCE_SIZE" | "SKIP_TRADE";
  explanation?: string;
}

export interface ExitStrategyConfig {
  tp1Ratio: number; // e.g. 1.5R
  tp1Percent: number; // e.g. 50%
  tp2Ratio: number; // e.g. 3.0R
  tp2Percent: number; // e.g. 35%
  runnerRule?: string; // e.g. "Trail 15m swing pivot or 9 EMA"
  breakevenRule: string; // e.g. "Move to BE + 0.1R after TP1 secured"
  timeStopMinutes?: number; // e.g. 45 min without expansion
}

export interface RefinementLogItem {
  id: string;
  version: string; // e.g. "v1.2"
  date: string;
  author?: string;
  changeSummary: string;
  hypothesis: string;
  impactObserved?: string;
  tradesSampled?: number;
  status: "IMPLEMENTED" | "TESTING" | "REVERTED";
}

export interface TradeManagementRule {
  id: string;
  rule: string;
  category?: "BREAKEVEN" | "TRAILING" | "SCALE_OUT" | "POSITION_SIZE" | "TIME_STOP" | "GENERAL" | string;
}

export interface Strategy {
  id: string;
  userId: string;
  accountId: string | null;
  name: string;
  category: StrategyCategory;
  version: string;
  status: StrategyStatus;
  description: string | null;
  thesis: string | null;
  assetUniverse: string[];
  marketRegime: string;

  // 1. Edge State
  edgeScore: number; // 0-100
  expectancyR: number; // e.g. 0.85
  winRateTarget: number; // e.g. 62.0%
  profitFactor: number; // e.g. 2.15
  sampleSize: number; // e.g. 48
  edgeStateNotes: string | null;

  // 2. Risk Control
  maxRiskPercent: number; // e.g. 1.0%
  minRrRatio: number; // e.g. 2.0 (1:2.0)
  invalidationRule: string | null;
  stopLossLogic: string | null;
  killSwitchRule: string | null;

  // 3. Trading Window
  tradingSessions: string[]; // e.g. ["London Open", "New York AM"]
  killZoneStart: string; // e.g. "09:30"
  killZoneEnd: string; // e.g. "11:30"
  timeZone: string; // e.g. "EST (UTC-5)"
  daysOfWeek: string[]; // e.g. ["Tuesday", "Wednesday", "Thursday"]
  newsBlackoutRule: string | null;

  // Playbook & Execution
  entryChecklist: ChecklistItem[];
  disqualifiers: DisqualifierItem[];
  exitStrategy: ExitStrategyConfig;
  tradeManagementRules?: TradeManagementRule[];
  refinements: RefinementLogItem[];

  createdAt: string;
  updatedAt: string;
}

export type CreateStrategyInput = Omit<
  Strategy,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type UpdateStrategyInput = Partial<CreateStrategyInput>;
