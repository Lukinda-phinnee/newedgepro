import type { Rule, RuleCategory } from "@/types/rules";

const CONSEQUENCE_COPY: Partial<Record<Rule["consequence"], string>> = {
  BLOCK_TRADE: "The trade is blocked",
  BLOCK: "The trade is blocked",
  WARN: "You’ll receive a warning",
  REDUCE_RISK: "Your trade risk is reduced",
  SIZE_REDUCTION: "Your position size is reduced",
  LOCK_ACCOUNT: "Trading is paused",
  COOLDOWN: "A cooldown begins",
  LIMIT_TRADES: "Further trades are limited",
  REQUIRE_REVIEW: "The trade needs a review",
  AUDIT_FAIL: "The trade fails the rule check",
};

function formatRuleValue(value: unknown): string {
  if (Array.isArray(value)) {
    const values = value.map(String);
    if (values.length < 2) return values[0] ?? "your configured values";
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return String(value ?? "your configured limit");
}

export function getTraderReadableRuleCopy(rule: Rule): string {
  const metric = rule.condition.trim().toLowerCase();
  const threshold = formatRuleValue(rule.thresholdValue);
  const metricCopy: Record<string, { label: string; unit: string }> = {
    risk_per_trade: { label: "risk per trade", unit: "% of your account" },
    daily_loss: { label: "daily loss", unit: "% of your account" },
    drawdown: { label: "account drawdown", unit: "%" },
    position_size: { label: "position size", unit: "lots/contracts" },
    min_rr: { label: "potential reward relative to risk", unit: ":1" },
  };
  const readableMetric = metric.replace(/[_-]+/g, " ").trim();
  const { label, unit } = metricCopy[metric] ?? {
    label: readableMetric || rule.ruleName || "this rule",
    unit: "",
  };
  const thresholdText = metric === "min_rr"
    ? `${threshold}:1`
    : metric === "risk_per_trade" || metric === "daily_loss" || metric === "recovery_loss_limit"
    ? `${threshold}% of your account`
    : metric === "drawdown" || metric === "recovery_drawdown_trigger"
    ? `${threshold}%`
    : `${threshold}${unit ? ` ${unit}` : ""}`;

  const riskPolicy: Record<string, string> = {
    risk_per_trade: rule.comparisonOperator === "<" || rule.comparisonOperator === "<="
      ? `Keep risk on each trade at or above ${thresholdText}.`
      : `Risk no more than ${thresholdText} on any one trade.`,
    daily_loss: `Stop trading for the day when your losses reach ${thresholdText}.`,
    drawdown: `Stop trading if your account drawdown reaches ${thresholdText}.`,
    position_size: `Keep each position to ${thresholdText} or less.`,
    min_rr: `Only take trades with a reward-to-risk ratio of at least ${thresholdText}.`,
  };
  if (rule.ruleCategory === "Risk" && riskPolicy[metric]) return riskPolicy[metric];

  const policies: Partial<Record<RuleCategory, Record<string, string>>> = {
    Frequency: {
      max_trades_per_day: `Limit yourself to ${threshold} trades per day.`,
      consecutive_losses: `After ${threshold} consecutive losses, take a break before trading again.`,
      trades_per_session: `Limit yourself to ${threshold} trades per session.`,
    },
    Eligibility: {
      instrument: rule.comparisonOperator === "IN"
        ? `Avoid trading these instruments: ${threshold}.`
        : `Trade only these instruments: ${threshold}.`,
      session: rule.comparisonOperator === "IN"
        ? `Avoid trading during these sessions: ${threshold}.`
        : `Trade only during these sessions: ${threshold}.`,
      day_of_week: rule.comparisonOperator === "NOT_IN"
        ? `Trade only on these days: ${threshold}.`
        : `Do not trade on these days: ${threshold}.`,
    },
    Recovery: {
      recovery_drawdown_trigger: `When drawdown reaches ${thresholdText}, reduce your risk on each trade.`,
      recovery_loss_limit: `While recovering, stop trading for the day when losses reach ${thresholdText}.`,
      consecutive_loss_trigger: `After ${threshold} losses in a row, reduce risk on your next trades.`,
    },
    Discipline: {
      violation_count: `After ${threshold} rule violations in one day, take a cooldown before trading again.`,
      require_plan_review: "Review and tag your last closed trade before taking another setup.",
    },
    Checklist: {
      has_stop_loss: "Set a stop loss before entering every trade.",
      has_take_profit: "Plan your take-profit target before entering each trade.",
    },
  };
  const policy = policies[rule.ruleCategory]?.[metric];
  if (policy) return policy;

  const consequence = CONSEQUENCE_COPY[rule.consequence];
  return `${rule.ruleName || label}: stay within your configured limit of ${thresholdText}.${consequence ? ` If breached, ${consequence.charAt(0).toLowerCase()}${consequence.slice(1)}.` : ""}`;
}

export function getTraderReadableConsequence(consequence: Rule["consequence"]): string {
  const labels: Partial<Record<Rule["consequence"], string>> = {
    BLOCK_TRADE: "Trade blocked",
    BLOCK: "Trading blocked",
    WARN: "Warning",
    REDUCE_RISK: "Risk reduced",
    SIZE_REDUCTION: "Position reduced",
    LOCK_ACCOUNT: "Account locked",
    COOLDOWN: "Cooldown",
    LIMIT_TRADES: "Trade limit",
    REQUIRE_REVIEW: "Review required",
    AUDIT_FAIL: "Rule check failed",
  };
  return labels[consequence] ?? consequence;
}

export function getTraderReadableScope(scope: Rule["evaluationScope"]): string {
  const labels: Record<Rule["evaluationScope"], string> = {
    TRADE: "Per trade",
    DAILY: "Daily",
    SESSION: "Per session",
    ACCOUNT: "Account-wide",
  };
  return labels[scope];
}
