import type { ChallengePhaseSettings, PropfirmTrade, PropfirmTrackerData } from "@/types/propfirm-tracker";

export type CalculatedTrade = PropfirmTrade & {
  riskAmount: number;
  profitLoss: number;
  balance: number;
  drawdownPercent: number;
  toTarget: number | null;
  status: string;
};

export type PropfirmTrackerSummary = {
  balance: number;
  target: number | null;
  toTarget: number | null;
  drawdownPercent: number;
  drawdownLeft: number | null;
  estimatedTrades: number | null;
  tradeCount: number;
  nextTradeRiskAmount: number;
  potentialReturnPercent: number;
  potentialReturnAmount: number;
  partialWinR: number;
  fullWinR: number;
  breakEvenWinRate: number | null;
  expectedLossesPerWin: number | null;
  winRate: number | null;
  wins: number;
  partialWins: number;
  losses: number;
  breakevens: number;
  totalPnl: number;
  status: "On track" | "Near drawdown limit" | "Daily loss breached" | "Max drawdown breached" | "Risk cap exceeded" | "Target reached";
  algoStatus: string;
  riskCapExceeded: boolean;
  openRiskPercent: number;
  trades: CalculatedTrade[];
};

const number = (value: string | undefined) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function returnsForOutcome(outcome: PropfirmTrade["outcome"], phase: ChallengePhaseSettings) {
  const tp1R = number(phase.tp1R);
  const tp1Portion = Math.min(100, Math.max(0, number(phase.tp1Percent)));
  const tp2R = number(phase.tp2R);
  const tp2Percent = Math.min(100, Math.max(tp1Portion, number(phase.tp2Percent)));
  const partialR = tp1R * tp1Portion / 100;
  const fullR = partialR + tp2R * (tp2Percent - tp1Portion) / 100;
  if (outcome === "loss") return { partialR, fullR, outcomeR: -1 };
  if (outcome === "partial-win") return { partialR, fullR, outcomeR: partialR };
  if (outcome === "full-win") return { partialR, fullR, outcomeR: fullR };
  return { partialR, fullR, outcomeR: 0 };
}

export function calculatePropfirmTracker(data: PropfirmTrackerData): PropfirmTrackerSummary {
  const startingBalance = Math.max(0, number(data.startingBalance));
  const phase = data.phaseSettings[data.selectedPhaseIndex] ?? data.phaseSettings[0];
  const selectedPhase: ChallengePhaseSettings = phase ?? {
    profitTargetPercent: "", maxDrawdownPercent: "", maxDailyLossPercent: "", drawdownType: "not-set", maxOpenRiskPercent: "", tradesToPass: "5",
    nextTradeRiskPercent: "0.5", tp1R: "0", tp1Percent: "0", tp2R: "3", tp2Percent: "100", targetWinRatePercent: "25",
  };
  const targetPercent = number(selectedPhase.profitTargetPercent);
  const maxDrawdownPercent = number(selectedPhase.maxDrawdownPercent);
  const maxDailyLossPercent = number(selectedPhase.maxDailyLossPercent);
  const maxOpenRiskPercent = number(selectedPhase.maxOpenRiskPercent);
  const target = startingBalance > 0 && targetPercent > 0 ? roundMoney(startingBalance * (1 + targetPercent / 100)) : null;
  const lossLimitAmount = startingBalance * maxDrawdownPercent / 100;
  const dailyLossLimitAmount = startingBalance * maxDailyLossPercent / 100;
  const calculations = returnsForOutcome("pending", selectedPhase);
  const targetWinRate = number(selectedPhase.targetWinRatePercent);
  const nextTradeRiskPercent = number(selectedPhase.nextTradeRiskPercent);
  const phaseTrades = data.trades
    .filter((trade) => trade.phaseIndex === data.selectedPhaseIndex)
    .map((trade, index) => ({ trade, index }))
    .sort((left, right) => {
      if (!left.trade.date && !right.trade.date) return left.index - right.index;
      if (!left.trade.date) return 1;
      if (!right.trade.date) return -1;
      return left.trade.date.localeCompare(right.trade.date) || left.index - right.index;
    })
    .map(({ trade }) => trade);
  const openRiskPercent = roundMoney(phaseTrades.filter((trade) => trade.outcome === "pending").reduce((sum, trade) => sum + number(trade.riskPercent), 0));
  const riskCapExceeded = maxOpenRiskPercent > 0 && openRiskPercent + nextTradeRiskPercent > maxOpenRiskPercent;
  const trades: CalculatedTrade[] = [];
  let balance = startingBalance;
  let peakBalance = startingBalance;
  let endOfDayPeakBalance = startingBalance;
  let lastTradeDate: string | null = null;
  let totalPnl = 0;
  let wins = 0;
  let partialWins = 0;
  let losses = 0;
  let breakevens = 0;
  let dailyLossBreached = false;
  let maxDrawdownBreached = false;
  let targetReached = false;
  const dailyPnl = new Map<string, number>();

  for (const trade of phaseTrades) {
    if (trade.date && lastTradeDate && trade.date !== lastTradeDate) endOfDayPeakBalance = Math.max(endOfDayPeakBalance, balance);
    if (trade.date) lastTradeDate = trade.date;
    const riskAmount = roundMoney(balance * number(trade.riskPercent) / 100);
    const tradeReturns = returnsForOutcome(trade.outcome, selectedPhase);
    const profitLoss = trade.outcome === "pending" ? 0 : roundMoney(riskAmount * tradeReturns.outcomeR);
    if (trade.outcome !== "pending") {
      totalPnl = roundMoney(totalPnl + profitLoss);
      balance = roundMoney(balance + profitLoss);
      if (trade.outcome === "full-win") wins += 1;
      else if (trade.outcome === "partial-win") partialWins += 1;
      else if (trade.outcome === "loss") losses += 1;
      else if (trade.outcome === "breakeven") breakevens += 1;
      if (trade.date) {
        const datePnl = roundMoney((dailyPnl.get(trade.date) ?? 0) + profitLoss);
        dailyPnl.set(trade.date, datePnl);
        if (dailyLossLimitAmount > 0 && datePnl <= -dailyLossLimitAmount) dailyLossBreached = true;
      }
    }
    peakBalance = Math.max(peakBalance, balance);
    const drawdownBase = selectedPhase.drawdownType === "trailing" ? peakBalance : selectedPhase.drawdownType === "end-of-day" ? endOfDayPeakBalance : startingBalance;
    const drawdownMeasureAtTrade = Math.max(0, drawdownBase - balance);
    if (lossLimitAmount > 0 && drawdownMeasureAtTrade >= lossLimitAmount) maxDrawdownBreached = true;
    if (target !== null && balance >= target) targetReached = true;
    const drawdownPercent = drawdownBase > 0 ? roundMoney(drawdownMeasureAtTrade / drawdownBase * 100) : 0;
    trades.push({
      ...trade, riskAmount, profitLoss, balance, drawdownPercent,
      toTarget: target === null ? null : roundMoney(Math.max(0, target - balance)),
      status: trade.outcome === "pending" ? "Pending" : trade.outcome === "loss" ? "Loss" : trade.outcome === "breakeven" ? "Breakeven" : "Closed",
    });
  }

  const drawdownUsed = startingBalance - balance > 0 ? startingBalance - balance : 0;
  const drawdownBase = selectedPhase.drawdownType === "trailing" ? peakBalance : selectedPhase.drawdownType === "end-of-day" ? endOfDayPeakBalance : startingBalance;
  const drawdownMeasure = Math.max(0, drawdownBase - balance);
  const currentDrawdown = drawdownBase > 0 ? roundMoney(drawdownMeasure / drawdownBase * 100) : 0;
  const drawdownLeft = maxDrawdownPercent > 0 ? roundMoney(Math.max(0, lossLimitAmount - drawdownMeasure)) : null;
  const toTarget = target === null ? null : roundMoney(Math.max(0, target - balance));
  const nextTradeRiskAmount = roundMoney(balance * nextTradeRiskPercent / 100);
  const potentialReturnPercent = roundMoney(nextTradeRiskPercent * calculations.fullR);
  const potentialReturnAmount = roundMoney(nextTradeRiskAmount * calculations.fullR);
  const breakEvenWinRate = calculations.fullR > 0 ? roundMoney(100 / (1 + calculations.fullR)) : null;
  const expectedLossesPerWin = targetWinRate > 0 && targetWinRate < 100 ? roundMoney((100 - targetWinRate) / targetWinRate) : null;
  const completedCount = wins + partialWins + losses + breakevens;
  const profitableTrades = trades.filter((trade) => trade.outcome !== "pending" && trade.profitLoss > 0).length;
  const winRate = completedCount > 0 ? roundMoney(profitableTrades / completedCount * 100) : null;
  const winR = calculations.fullR;
  const winsNeeded = toTarget !== null && potentialReturnAmount > 0 ? Math.ceil(toTarget / potentialReturnAmount) : null;
  const estimatedTrades = winsNeeded !== null && targetWinRate > 0 ? Math.ceil(winsNeeded / (targetWinRate / 100)) : null;
  let status: PropfirmTrackerSummary["status"] = "On track";
  if (targetReached) status = "Target reached";
  else if (maxDrawdownBreached) status = "Max drawdown breached";
  else if (dailyLossBreached) status = "Daily loss breached";
  else if (riskCapExceeded) status = "Risk cap exceeded";
  else if (lossLimitAmount > 0 && drawdownMeasure >= lossLimitAmount * 0.8) status = "Near drawdown limit";
  const plannedTrades = number(selectedPhase.tradesToPass);
  const algoStatus = riskCapExceeded ? "Risk exceeds open-risk cap" : target === null ? "Set profit target" : breakEvenWinRate === null ? "Set take-profit R" : targetWinRate < breakEvenWinRate ? "Below break-even" : estimatedTrades !== null && plannedTrades > 0 && estimatedTrades <= plannedTrades ? "On plan" : "Baseline";

  return {
    balance, target, toTarget, drawdownPercent: currentDrawdown, drawdownLeft, estimatedTrades,
    tradeCount: completedCount, nextTradeRiskAmount, potentialReturnPercent, potentialReturnAmount,
    partialWinR: calculations.partialR, fullWinR: winR, breakEvenWinRate, expectedLossesPerWin,
    winRate, wins, partialWins, losses, breakevens, totalPnl, status, algoStatus, riskCapExceeded, openRiskPercent, trades,
  };
}
