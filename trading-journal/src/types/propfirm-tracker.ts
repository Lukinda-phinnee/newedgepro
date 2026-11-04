export type PropfirmPhaseRules = {
  name: string;
  profitTarget: string;
  dailyLossLimit: string;
  maxDrawdown: string;
  drawdownType: string;
  riskPerTrade: string;
  maxOpenRisk: string;
  minTradingDays: string;
  maxTradesPerDay: string;
  consistencyLimit: string;
  newsTrading: string;
  overnightHolding: boolean;
  weekendHolding: boolean;
};

export type ChallengePhaseSettings = {
  profitTargetPercent: string;
  maxDrawdownPercent: string;
  maxDailyLossPercent: string;
  drawdownType: string;
  maxOpenRiskPercent: string;
  tradesToPass: string;
  nextTradeRiskPercent: string;
  tp1R: string;
  tp1Percent: string;
  tp2R: string;
  tp2Percent: string;
  targetWinRatePercent: string;
};

export type PropfirmTradeOutcome = "pending" | "full-win" | "partial-win" | "loss" | "breakeven";

export type PropfirmTrade = {
  id: string;
  phaseIndex: number;
  generated: boolean;
  date: string;
  pair: string;
  session: string;
  outcome: PropfirmTradeOutcome;
  riskPercent: string;
  notes: string;
};

export type PropfirmTrackerData = {
  startingBalance: string;
  selectedPhaseIndex: number;
  phaseSettings: ChallengePhaseSettings[];
  trades: PropfirmTrade[];
};

export type PropfirmRecord = {
  id: string;
  name: string;
  evaluation: string;
  phases: PropfirmPhaseRules[];
  logo: string | null;
  trackerData?: PropfirmTrackerData | null;
};

export function createDefaultPhaseSettings(phase?: PropfirmPhaseRules): ChallengePhaseSettings {
  return {
    profitTargetPercent: phase?.profitTarget ?? "",
    maxDrawdownPercent: phase?.maxDrawdown ?? "",
    maxDailyLossPercent: phase?.dailyLossLimit ?? "",
    drawdownType: phase?.drawdownType ?? "not-set",
    maxOpenRiskPercent: phase?.maxOpenRisk ?? "",
    tradesToPass: "5",
    nextTradeRiskPercent: phase?.riskPerTrade || "0.5",
    tp1R: "0",
    tp1Percent: "0",
    tp2R: "3",
    tp2Percent: "100",
    targetWinRatePercent: "25",
  };
}

export function createDefaultTrackerData(phases: PropfirmPhaseRules[]): PropfirmTrackerData {
  return {
    startingBalance: "10000",
    selectedPhaseIndex: 0,
    phaseSettings: (phases.length ? phases : [{ name: "Phase 1" } as PropfirmPhaseRules]).map(createDefaultPhaseSettings),
    trades: [],
  };
}
