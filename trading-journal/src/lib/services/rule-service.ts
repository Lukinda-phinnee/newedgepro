import { sql } from "@/lib/db";
import { getEffectiveRuleSet, recordViolation } from "@/lib/db/rules";
import type {
  ComparisonOperator,
  ConsequenceType,
  EvaluationVerdict,
  Rule,
  RuleEvaluationResult,
  TradeIntent,
  TriggeredRule,
} from "@/types/rules";

/**
 * Compare an extracted actual value against a threshold using the rule's comparison operator.
 */
function evaluateComparison(
  actual: unknown,
  operator: ComparisonOperator,
  threshold: unknown,
): boolean {
  if (actual === undefined || actual === null) {
    return false; // Unknown metrics or unextractable values don't trigger violations
  }

  // List membership operators: IN / NOT_IN
  if (operator === "IN" || operator === "NOT_IN") {
    let list: unknown[] = [];
    if (Array.isArray(threshold)) {
      list = threshold;
    } else if (typeof threshold === "string") {
      try {
        const parsed = JSON.parse(threshold);
        list = Array.isArray(parsed) ? parsed : [threshold];
      } catch {
        list = threshold.split(",").map((s) => s.trim());
      }
    }

    const actualStr = String(actual).toUpperCase().trim();
    const listNormalized = list.map((item) => String(item).toUpperCase().trim());
    const isIncluded = listNormalized.includes(actualStr);

    return operator === "IN" ? isIncluded : !isIncluded;
  }

  // Boolean comparison
  if (typeof actual === "boolean" || typeof threshold === "boolean") {
    const bActual = Boolean(actual);
    const bThreshold = Boolean(threshold);
    if (operator === "==") return bActual === bThreshold;
    if (operator === "!=") return bActual !== bThreshold;
    return false;
  }

  // Numeric comparisons
  const numActual = Number(actual);
  const numThreshold = Number(threshold);

  if (isNaN(numActual) || isNaN(numThreshold)) {
    // String comparison fallback
    const strActual = String(actual);
    const strThreshold = String(threshold);
    if (operator === "==") return strActual === strThreshold;
    if (operator === "!=") return strActual !== strThreshold;
    return false;
  }

  switch (operator) {
    case ">":
      return numActual > numThreshold;
    case ">=":
      return numActual >= numThreshold;
    case "<":
      return numActual < numThreshold;
    case "<=":
      return numActual <= numThreshold;
    case "==":
      return numActual === numThreshold;
    case "!=":
      return numActual !== numThreshold;
    default:
      return false;
  }
}

/**
 * Estimate risk percentage from trade intent parameters.
 */
function estimateRiskPercent(intent: TradeIntent, balance: number): number {
  if (intent.riskPercent !== undefined && intent.riskPercent !== null) {
    return Number(intent.riskPercent);
  }

  if (intent.entryPrice && intent.stopLoss && balance > 0) {
    const slDist = Math.abs(intent.entryPrice - intent.stopLoss);
    const qty = intent.lotSize || intent.quantity || 1;
    // Standard contract multiplier rough estimation: qty * slDist
    const estDollarRisk = slDist * qty;
    return Number(((estDollarRisk / balance) * 100).toFixed(2));
  }

  return 1.0;
}

/**
 * Calculate Risk-to-Reward ratio (take profit dist / stop loss dist).
 */
function calculateRiskReward(intent: TradeIntent): number | null {
  if (!intent.entryPrice || !intent.stopLoss || !intent.takeProfit) {
    return null;
  }
  const slDist = Math.abs(intent.entryPrice - intent.stopLoss);
  const tpDist = Math.abs(intent.takeProfit - intent.entryPrice);
  if (slDist <= 0) return null;
  return Number((tpDist / slDist).toFixed(2));
}

/**
 * Derive market session from timestamp or explicit intent session.
 */
function deriveSession(intent: TradeIntent): string {
  if (intent.marketSession) return intent.marketSession;
  const d = intent.timestamp ? new Date(intent.timestamp) : new Date();
  const utcHour = d.getUTCHours();

  if (utcHour >= 0 && utcHour < 8) return "Asian";
  if (utcHour >= 7 && utcHour < 16) return "London";
  if (utcHour >= 12 && utcHour < 21) return "New York";
  return "Asian";
}

/**
 * Derive day of week name.
 */
function deriveDayOfWeek(intent: TradeIntent): string {
  if (intent.dayOfWeek) return intent.dayOfWeek;
  const d = intent.timestamp ? new Date(intent.timestamp) : new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getUTCDay()];
}

export class RuleService {
  /**
   * The shared evaluator: evaluates a trade intent against active rules.
   * If accountId is null, evaluates against the user's active Global System Rule Set.
   */
  static async evaluateTradeIntent(
    userId: string,
    accountId: string | null | undefined,
    tradeIntent: TradeIntent,
  ): Promise<RuleEvaluationResult> {
    const effectiveSet = await getEffectiveRuleSet(userId, accountId);
    const isGlobalScope = !accountId || effectiveSet.accountId === null;

    // Check if account is locked or in cooldown
    let isLocked = false;
    let isCooldown = false;
    let lockUntil: string | undefined;
    let cooldownUntil: string | undefined;

    if (accountId) {
      const accRows = await sql`
        SELECT cooldown_until, locked_until FROM trading_accounts WHERE id = ${accountId} LIMIT 1
      `;
      if (accRows.length > 0) {
        const now = new Date();
        if (accRows[0].locked_until && new Date(accRows[0].locked_until) > now) {
          isLocked = true;
          lockUntil = new Date(accRows[0].locked_until).toISOString();
        }
        if (accRows[0].cooldown_until && new Date(accRows[0].cooldown_until) > now) {
          isCooldown = true;
          cooldownUntil = new Date(accRows[0].cooldown_until).toISOString();
        }
      }
    }

    // Step 2: Return ACCEPT with no triggered rules if there is no current set or no rules
    const rules = (effectiveSet.rules || []).filter((r) => r.isActive);
    if (!effectiveSet.isActive || rules.length === 0) {
      return {
        verdict: "ACCEPT",
        triggeredRules: [],
        passedRules: [],
        messages: ["All rules passed. No active trading guardrails triggered."],
        ruleSetId: effectiveSet.id,
        ruleSetName: effectiveSet.name,
        isGlobalScope,
        evaluatedAt: new Date().toISOString(),
      };
    }

    // Fetch account context metrics if available
    let accountBalance = tradeIntent.accountBalance || 50000;
    let peakBalance = accountBalance;
    let dailyLossAmount = 0;
    let dailyLossPercent = 0;
    let todayTradesCount = 0;
    let consecutiveLosses = 0;
    let dailyViolationsCount = 0;

    if (accountId) {
      const accRow = await sql`SELECT starting_balance, current_balance FROM trading_accounts WHERE id = ${accountId} LIMIT 1`;
      if (accRow.length > 0) {
        accountBalance = Number(accRow[0].current_balance) || Number(accRow[0].starting_balance) || 50000;
        peakBalance = Math.max(accountBalance, Number(accRow[0].starting_balance) || accountBalance);
      }

      // Query today's trades for daily metrics
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      const todayTrades = await sql`
        SELECT pnl, status, opened_at
        FROM trades
        WHERE account_id = ${accountId}
          AND opened_at >= ${startOfToday.toISOString()}
        ORDER BY opened_at DESC
      `;

      todayTradesCount = todayTrades.length;
      let dayPnl = 0;
      for (const t of todayTrades) {
        if (t.pnl !== null && t.pnl !== undefined) {
          dayPnl += Number(t.pnl);
        }
      }

      if (dayPnl < 0) {
        dailyLossAmount = Math.abs(dayPnl);
        dailyLossPercent = accountBalance > 0 ? (dailyLossAmount / accountBalance) * 100 : 0;
      }

      // Query recent closed trades for consecutive loss count
      const recentClosed = await sql`
        SELECT pnl FROM trades
        WHERE account_id = ${accountId}
          AND status = 'closed'
        ORDER BY opened_at DESC
        LIMIT 10
      `;

      for (const r of recentClosed) {
        if (r.pnl !== null && Number(r.pnl) < 0) {
          consecutiveLosses++;
        } else {
          break; // Stop at first non-loss
        }
      }

      // Count today's violations
      const todayViolations = await sql`
        SELECT COUNT(id)::int as count
        FROM rule_violations
        WHERE account_id = ${accountId}
          AND created_at >= ${startOfToday.toISOString()}
      `;
      dailyViolationsCount = Number(todayViolations[0]?.count) || 0;
    }

    const currentDrawdownPercent = peakBalance > 0 ? Math.max(0, ((peakBalance - accountBalance) / peakBalance) * 100) : 0;
    const session = deriveSession(tradeIntent);
    const dayOfWeek = deriveDayOfWeek(tradeIntent);
    const riskPercent = estimateRiskPercent(tradeIntent, accountBalance);
    const riskReward = calculateRiskReward(tradeIntent);

    const triggeredRules: TriggeredRule[] = [];
    const passedRules: Array<{ ruleId: string; ruleName: string; metric: string }> = [];
    const messages: string[] = [];

    // Check account lockout first
    if (isLocked) {
      triggeredRules.push({
        ruleId: "sys-locked",
        ruleName: "Account Trading Lock Active",
        ruleCategory: "Discipline",
        metric: "account_lock",
        operator: "==",
        threshold: true,
        actualValue: true,
        severity: "CRITICAL",
        consequence: "LOCK_ACCOUNT",
        message: `Account is currently locked from trading until ${lockUntil ? new Date(lockUntil).toLocaleTimeString() : "next session"} due to previous rule breach.`,
      });
      messages.push(`Account locked: No new trade entries permitted.`);
    }

    if (isCooldown) {
      triggeredRules.push({
        ruleId: "sys-cooldown",
        ruleName: "Cooling-off Period Active",
        ruleCategory: "Frequency",
        metric: "cooldown",
        operator: "==",
        threshold: true,
        actualValue: true,
        severity: "HIGH",
        consequence: "COOLDOWN",
        message: `Account is in a mandatory cooling-off period until ${cooldownUntil ? new Date(cooldownUntil).toLocaleTimeString() : "shortly"}.`,
      });
      messages.push(`Cooldown active: Step away until time elapsed.`);
    }

    // Step 5: Extract each rule's current value and compare
    for (const rule of rules) {
      const metric = rule.condition.toLowerCase().trim();
      let actualValue: unknown = undefined;

      switch (metric) {
        // Risk
        case "risk_per_trade":
          actualValue = riskPercent;
          break;
        case "daily_loss":
          actualValue = Number(dailyLossPercent.toFixed(2));
          break;
        case "drawdown":
        case "recovery_drawdown_trigger":
          actualValue = Number(currentDrawdownPercent.toFixed(2));
          break;
        case "position_size":
          actualValue = tradeIntent.lotSize || tradeIntent.quantity;
          break;
        case "min_rr":
          actualValue = riskReward;
          break;

        // Frequency
        case "max_trades_per_day":
        case "trade_count":
          actualValue = todayTradesCount;
          break;
        case "consecutive_losses":
          actualValue = consecutiveLosses;
          break;
        case "trades_per_session":
          actualValue = todayTradesCount; // Approximation
          break;

        // Eligibility
        case "instrument":
        case "symbol":
          actualValue = tradeIntent.symbol?.toUpperCase();
          break;
        case "session":
          actualValue = session;
          break;
        case "day_of_week":
          actualValue = dayOfWeek;
          break;

        // Recovery
        case "recovery_loss_limit":
          actualValue = Number(dailyLossPercent.toFixed(2));
          break;

        // Discipline
        case "violation_count":
          actualValue = dailyViolationsCount;
          break;
        case "require_plan_review":
          actualValue = false; // By default not requiring
          break;

        // Checklist
        case "has_stop_loss":
          actualValue = Boolean(tradeIntent.stopLoss && tradeIntent.stopLoss > 0);
          break;
        case "has_take_profit":
          actualValue = Boolean(tradeIntent.takeProfit && tradeIntent.takeProfit > 0);
          break;

        default:
          actualValue = undefined;
          break;
      }

      // Check if this condition triggers a violation
      // Note: for "has_stop_loss", rule says comparison "==" with threshold true.
      // If actualValue is true, rule evaluates to true (stop loss exists). But we want violation when stop loss is missing!
      // In the schema, Checklist rules verify that criterion is met.
      let isViolation = false;

      if (metric === "has_stop_loss") {
        // Triggers violation if stop loss is false/missing
        isViolation = !actualValue;
      } else if (metric === "has_take_profit") {
        isViolation = !actualValue;
      } else {
        isViolation = evaluateComparison(actualValue, rule.comparisonOperator, rule.thresholdValue);
      }

      if (isViolation) {
        const msg =
          rule.userMessage ||
          `Rule violation: ${rule.ruleName} triggered (Value: ${actualValue}, Threshold: ${JSON.stringify(rule.thresholdValue)})`;

        triggeredRules.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          ruleCategory: rule.ruleCategory,
          metric: rule.condition,
          operator: rule.comparisonOperator,
          threshold: rule.thresholdValue,
          actualValue,
          severity: rule.severity,
          consequence: rule.consequence,
          message: msg,
        });

        messages.push(msg);
      } else {
        passedRules.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          metric: rule.condition,
        });
      }
    }

    // Decision priority:
    // Any BLOCK, LOCK, BLOCK_TRADE, LOCK_ACCOUNT, or COOLDOWN produces BLOCK.
    // If no hard block but at least one WARN, REDUCE_RISK, REQUIRE_REVIEW, LIMIT_TRADES, or SIZE_REDUCTION, produce WARN.
    // Else ACCEPT.
    let verdict: EvaluationVerdict = "ACCEPT";

    const hasBlock = triggeredRules.some(
      (t) =>
        t.consequence === "BLOCK" ||
        t.consequence === "BLOCK_TRADE" ||
        t.consequence === "LOCK_ACCOUNT" ||
        t.consequence === "COOLDOWN",
    );

    const hasWarn = triggeredRules.some(
      (t) =>
        t.consequence === "WARN" ||
        t.consequence === "REDUCE_RISK" ||
        t.consequence === "REQUIRE_REVIEW" ||
        t.consequence === "LIMIT_TRADES" ||
        t.consequence === "SIZE_REDUCTION" ||
        t.consequence === "AUDIT_FAIL",
    );

    if (hasBlock) {
      verdict = "BLOCK";
    } else if (hasWarn || triggeredRules.length > 0) {
      verdict = "WARN";
    } else {
      verdict = "ACCEPT";
      messages.push("Trade intent conforms to all active trading rules and safety criteria.");
    }

    return {
      verdict,
      triggeredRules,
      passedRules,
      messages,
      ruleSetId: effectiveSet.id,
      ruleSetName: effectiveSet.name,
      isGlobalScope,
      evaluatedAt: new Date().toISOString(),
      accountLocked: isLocked,
      accountCooldown: isCooldown,
      lockUntil,
      cooldownUntil,
    };
  }

  /**
   * Evaluates trade data against active rules, logs violations to rule_violations table if tradeId is provided,
   * applies account lockout/cooldown if triggered, and returns the evaluation result.
   */
  static async evaluateAndRecordTrade(
    userId: string,
    accountId: string,
    tradeData: {
      symbol: string;
      side?: "long" | "short";
      entryPrice: number;
      exitPrice?: number | null;
      quantity: number;
      stopLoss?: number | null;
      takeProfit?: number | null;
      marketSession?: string | null;
      marketCondition?: string | null;
      pnl?: number | null;
      openedAt?: string | null;
    },
    tradeId?: string,
  ): Promise<RuleEvaluationResult> {
    const tradeIntent: TradeIntent = {
      accountId,
      symbol: tradeData.symbol,
      side: tradeData.side || "long",
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit,
      quantity: tradeData.quantity,
      lotSize: tradeData.quantity,
      marketSession: tradeData.marketSession || undefined,
      marketCondition: tradeData.marketCondition || undefined,
      timestamp: tradeData.openedAt || new Date().toISOString(),
    };

    const evalResult = await this.evaluateTradeIntent(userId, accountId, tradeIntent);

    if (tradeId && evalResult.triggeredRules.length > 0) {
      for (const trig of evalResult.triggeredRules) {
        await recordViolation(userId, {
          accountId,
          ruleId: trig.ruleId.startsWith("sys-") ? null : trig.ruleId,
          tradeId,
          violationName: trig.ruleName,
          ruleType: trig.ruleCategory.toUpperCase(),
          severity: trig.severity,
          actionTaken: trig.consequence,
          metadata: {
            metric: trig.metric,
            threshold: trig.threshold,
            actualValue: trig.actualValue,
            message: trig.message,
            tradeSymbol: tradeData.symbol,
            consequence: trig.consequence,
          },
        });

        // Apply account state changes for LOCK (24 hours) or COOLDOWN (1 hour)
        if (trig.consequence === "LOCK_ACCOUNT") {
          const lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await sql`
            UPDATE trading_accounts
            SET locked_until = ${lockUntil}
            WHERE id = ${accountId}
          `;
        } else if (trig.consequence === "COOLDOWN") {
          const cooldownUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          await sql`
            UPDATE trading_accounts
            SET cooldown_until = ${cooldownUntil}
            WHERE id = ${accountId}
          `;
        }
      }
    }

    return evalResult;
  }

  /**
   * Post-trade evaluator called after a trade closes.
   */
  static async postTradeEvaluate(
    userId: string,
    trade: {
      id: string;
      accountId: string;
      symbol: string;
      side?: "long" | "short";
      entryPrice: number;
      exitPrice?: number | null;
      pnl?: number | null;
      quantity: number;
      stopLoss?: number | null;
      takeProfit?: number | null;
      marketSession?: string | null;
      openedAt?: string | null;
    },
  ): Promise<RuleEvaluationResult> {
    return this.evaluateAndRecordTrade(userId, trade.accountId, trade, trade.id);
  }
}
