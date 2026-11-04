import { z } from "zod";

const numericText = (max: number, integer = false) => z.string().max(16).refine((value) => {
  if (value === "") return true;
  if (!/^\d+(\.\d*)?$/.test(value)) return false;
  const number = Number(value);
  return number >= 0 && number <= max && (!integer || Number.isInteger(number));
});

const phaseSchema = z.object({
  name: z.string().trim().min(1).max(40), profitTarget: numericText(1000), dailyLossLimit: numericText(100), maxDrawdown: numericText(100),
  drawdownType: z.enum(["not-set", "static", "trailing", "end-of-day"]), riskPerTrade: numericText(100), maxOpenRisk: numericText(100),
  minTradingDays: numericText(366, true), maxTradesPerDay: numericText(1000, true), consistencyLimit: numericText(100),
  newsTrading: z.enum(["not-set", "allowed", "restricted", "prohibited"]), overnightHolding: z.boolean(), weekendHolding: z.boolean(),
}).strict();

export const propfirmSchema = z.object({
  name: z.string().trim().min(1).max(100),
  evaluation: z.enum(["1-phase", "2-phase", "3-phase", "Instant funding", "Custom"]),
  phases: z.array(phaseSchema).min(1).max(10),
  logo: z.string().max(2_800_000).regex(/^data:image\/(png|jpeg|webp);base64,/).nullable(),
}).strict();

const trackerNumeric = (max: number, integer = false) => numericText(max, integer);
const phaseSettingsSchema = z.object({
  profitTargetPercent: trackerNumeric(1000), maxDrawdownPercent: trackerNumeric(100), maxDailyLossPercent: trackerNumeric(100),
  drawdownType: z.enum(["not-set", "static", "trailing", "end-of-day"]),
  maxOpenRiskPercent: trackerNumeric(100),
  tradesToPass: trackerNumeric(10000, true), nextTradeRiskPercent: trackerNumeric(100),
  tp1R: trackerNumeric(100), tp1Percent: trackerNumeric(100), tp2R: trackerNumeric(100), tp2Percent: trackerNumeric(100),
  targetWinRatePercent: trackerNumeric(100),
}).strict();
const tradeSchema = z.object({
  id: z.string().uuid(), phaseIndex: z.number().int().min(0).max(9), generated: z.boolean(), date: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/), pair: z.string().max(30),
  session: z.enum(["", "Asia", "London", "New York", "Sydney", "Overlap", "Other"]),
  outcome: z.enum(["pending", "full-win", "partial-win", "loss", "breakeven"]),
  riskPercent: trackerNumeric(100), notes: z.string().max(1000),
}).strict();

export const trackerDataSchema = z.object({
  startingBalance: trackerNumeric(1_000_000_000),
  selectedPhaseIndex: z.number().int().min(0).max(9),
  phaseSettings: z.array(phaseSettingsSchema).min(1).max(10),
  trades: z.array(tradeSchema).max(500),
}).strict().superRefine((value, context) => {
  if (value.selectedPhaseIndex >= value.phaseSettings.length) context.addIssue({ code: "custom", message: "Invalid selected phase." });
  value.trades.forEach((trade, index) => {
    if (trade.phaseIndex >= value.phaseSettings.length) context.addIssue({ code: "custom", path: ["trades", index, "phaseIndex"], message: "Trade phase does not exist." });
  });
});
