export type RuleCategory =
  | "Risk"
  | "Frequency"
  | "Eligibility"
  | "Recovery"
  | "Discipline"
  | "Checklist";

export type RuleType =
  | "RISK"
  | "FREQUENCY"
  | "ELIGIBILITY"
  | "RECOVERY"
  | "DISCIPLINE"
  | "CHECKLIST";

export type EvaluationScope = "TRADE" | "DAILY" | "SESSION" | "ACCOUNT";

export type ComparisonOperator =
  | ">"
  | ">="
  | "<"
  | "<="
  | "=="
  | "!="
  | "IN"
  | "NOT_IN";

export type SeverityLevel = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ConsequenceType =
  | "BLOCK_TRADE"
  | "BLOCK"
  | "WARN"
  | "REDUCE_RISK"
  | "LOCK_ACCOUNT"
  | "COOLDOWN"
  | "REQUIRE_REVIEW"
  | "LIMIT_TRADES"
  | "SIZE_REDUCTION"
  | "AUDIT_FAIL";

export type EvaluationVerdict = "ACCEPT" | "WARN" | "BLOCK";

export interface RuleFilters {
  instrument_labels?: string[];
  allowed_sessions?: string[];
  allowed_days?: string[];
  [key: string]: unknown;
}

export interface Rule {
  id: string;
  ruleSetId: string;
  ruleName: string;
  description: string | null;
  ruleType: RuleType;
  ruleCategory: RuleCategory;
  condition: string; // The metric identifier
  comparisonOperator: ComparisonOperator;
  thresholdValue: unknown; // number, string[], string, boolean, etc.
  evaluationScope: EvaluationScope;
  timeWindow: string | null;
  filters: RuleFilters;
  severity: SeverityLevel;
  consequence: ConsequenceType;
  consequenceParams: Record<string, unknown>;
  consequenceDuration: number | null; // minutes
  exitCondition: string | null;
  userMessage: string | null;
  isActive: boolean;
  effectiveFrom: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RuleSet {
  id: string;
  userId: string;
  accountId: string | null; // null = Global System Rules
  name: string;
  version: number;
  isActive: boolean;
  isDraft: boolean;
  description: string | null;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
  rules?: Rule[];
  ruleCount?: number;
}

export interface RuleViolation {
  id: string;
  userId: string;
  accountId: string | null;
  ruleId: string | null;
  tradeId: string | null;
  violationName: string;
  ruleType: string | null;
  severity: SeverityLevel;
  actionTaken: string;
  metadata: {
    metric?: string;
    threshold?: unknown;
    actualValue?: unknown;
    message?: string;
    tradeSymbol?: string;
    consequence?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface TradeIntent {
  accountId?: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  quantity: number; // or lot size
  lotSize?: number;
  riskPercent?: number;
  marketSession?: string;
  marketCondition?: string;
  accountBalance?: number;
  dayOfWeek?: string;
  timestamp?: string;
}

export interface TriggeredRule {
  ruleId: string;
  ruleName: string;
  ruleCategory: RuleCategory;
  metric: string;
  operator: ComparisonOperator;
  threshold: unknown;
  actualValue: unknown;
  severity: SeverityLevel;
  consequence: ConsequenceType;
  message: string;
}

export interface RuleEvaluationResult {
  verdict: EvaluationVerdict;
  triggeredRules: TriggeredRule[];
  passedRules: Array<{ ruleId: string; ruleName: string; metric: string }>;
  messages: string[];
  ruleSetId?: string;
  ruleSetName?: string;
  isGlobalScope: boolean;
  evaluatedAt: string;
  accountLocked?: boolean;
  accountCooldown?: boolean;
  lockUntil?: string;
  cooldownUntil?: string;
}

export interface RuleEngineStatus {
  accountId: string | null;
  isGlobal: boolean;
  activeRuleSet: RuleSet | null;
  totalActiveRules: number;
  disciplineScore: number; // 0 - 100
  escalationLevel: "Normal" | "Elevated" | "Severe" | "Locked";
  isLocked: boolean;
  isCooldown: boolean;
  lockRemainingMinutes?: number;
  cooldownRemainingMinutes?: number;
  activeRulesByCategory: Record<RuleCategory, number>;
}

export interface RuleEngineCompliance {
  accountId: string | null;
  totalSimulations: number;
  totalViolations: number;
  violationsToday: number;
  violationsThisWeek: number;
  passRate: number; // percentage e.g. 94.2
  disciplineScore: number;
  recentViolations: RuleViolation[];
}

/** Schema descriptor for rule editor categories */
export interface MetricDefinition {
  id: string;
  label: string;
  unit: "%" | "$" | "count" | "ratio" | "list" | "boolean";
  description: string;
  defaultOperator: ComparisonOperator;
  allowedOperators: ComparisonOperator[];
  defaultThreshold: unknown;
  allowedScopes: EvaluationScope[];
  defaultScope: EvaluationScope;
  defaultConsequence: ConsequenceType;
  defaultSeverity: SeverityLevel;
  defaultMessage: string;
}

export interface CategorySchema {
  category: RuleCategory;
  ruleType: RuleType;
  description: string;
  metrics: MetricDefinition[];
  allowedConsequences: ConsequenceType[];
}

export const RULE_CATEGORY_SCHEMAS: Record<RuleCategory, CategorySchema> = {
  Risk: {
    category: "Risk",
    ruleType: "RISK",
    description: "Guardrails controlling maximum capital risk, daily losses, drawdown, and risk-to-reward ratios.",
    allowedConsequences: ["BLOCK_TRADE", "BLOCK", "REDUCE_RISK", "LOCK_ACCOUNT", "WARN"],
    metrics: [
      {
        id: "risk_per_trade",
        label: "Risk per Trade (%)",
        unit: "%",
        description: "Limits maximum account balance percentage risked on a single trade intent.",
        defaultOperator: ">",
        allowedOperators: [">", ">=", "<="],
        defaultThreshold: 2.0,
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "HIGH",
        defaultMessage: "Risk per trade exceeds the allowed maximum limit.",
      },
      {
        id: "daily_loss",
        label: "Max Daily Loss (%)",
        unit: "%",
        description: "Halts trading if accumulated daily losses cross this percentage threshold.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 4.0,
        allowedScopes: ["DAILY"],
        defaultScope: "DAILY",
        defaultConsequence: "LOCK_ACCOUNT",
        defaultSeverity: "CRITICAL",
        defaultMessage: "Daily loss threshold reached. Account trading locked for the rest of session.",
      },
      {
        id: "drawdown",
        label: "Max Trailing Drawdown (%)",
        unit: "%",
        description: "Locks account if overall drawdown from high-water mark exceeds limit.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 8.0,
        allowedScopes: ["ACCOUNT"],
        defaultScope: "ACCOUNT",
        defaultConsequence: "LOCK_ACCOUNT",
        defaultSeverity: "CRITICAL",
        defaultMessage: "Max drawdown breach. Protect capital by halting further trades.",
      },
      {
        id: "position_size",
        label: "Max Position Size (Lots / Contracts)",
        unit: "count",
        description: "Hard cap on position quantity to prevent over-leveraging.",
        defaultOperator: ">",
        allowedOperators: [">", ">="],
        defaultThreshold: 5.0,
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "HIGH",
        defaultMessage: "Order lot size exceeds allowable threshold.",
      },
      {
        id: "min_rr",
        label: "Minimum Risk to Reward Ratio",
        unit: "ratio",
        description: "Requires potential take-profit distance to be at least R-multiple of stop loss.",
        defaultOperator: "<",
        allowedOperators: ["<", "<="],
        defaultThreshold: 1.5,
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "MEDIUM",
        defaultMessage: "Trade setup does not offer minimum required Risk:Reward ratio.",
      },
    ],
  },
  Frequency: {
    category: "Frequency",
    ruleType: "FREQUENCY",
    description: "Prevents over-trading and revenge trading by limiting trade velocity and loss streaks.",
    allowedConsequences: ["WARN", "COOLDOWN", "BLOCK_TRADE", "LIMIT_TRADES"],
    metrics: [
      {
        id: "max_trades_per_day",
        label: "Max Trades per Day",
        unit: "count",
        description: "Maximum trades allowed in a single trading day.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 5,
        allowedScopes: ["DAILY"],
        defaultScope: "DAILY",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "HIGH",
        defaultMessage: "Daily trade quota reached. Step away and avoid over-trading.",
      },
      {
        id: "consecutive_losses",
        label: "Consecutive Losses Before Cooldown",
        unit: "count",
        description: "Enforces a mandatory timeout period after a streak of consecutive losing trades.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 3,
        allowedScopes: ["DAILY", "SESSION"],
        defaultScope: "DAILY",
        defaultConsequence: "COOLDOWN",
        defaultSeverity: "HIGH",
        defaultMessage: "Consecutive loss streak detected. Take a mandatory cooldown break.",
      },
      {
        id: "trades_per_session",
        label: "Max Trades per Session",
        unit: "count",
        description: "Limits execution count within a specific market session (e.g. NY Open).",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 3,
        allowedScopes: ["SESSION"],
        defaultScope: "SESSION",
        defaultConsequence: "WARN",
        defaultSeverity: "MEDIUM",
        defaultMessage: "Session trade limit reached.",
      },
    ],
  },
  Eligibility: {
    category: "Eligibility",
    ruleType: "ELIGIBILITY",
    description: "Validates trade eligibility based on approved instruments, trading sessions, and days.",
    allowedConsequences: ["BLOCK_TRADE", "WARN"],
    metrics: [
      {
        id: "instrument",
        label: "Allowed Instruments / Symbols",
        unit: "list",
        description: "Restrict trading exclusively to an authorized list of tickers/symbols.",
        defaultOperator: "NOT_IN",
        allowedOperators: ["IN", "NOT_IN"],
        defaultThreshold: ["EURUSD", "GBPUSD", "USDJPY", "NQ", "ES", "BTCUSD"],
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "HIGH",
        defaultMessage: "Symbol is not on your approved playbook instrument whitelist.",
      },
      {
        id: "session",
        label: "Allowed Trading Sessions",
        unit: "list",
        description: "Ensures trades are only executed during authorized market sessions.",
        defaultOperator: "NOT_IN",
        allowedOperators: ["IN", "NOT_IN"],
        defaultThreshold: ["London", "New York"],
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "HIGH",
        defaultMessage: "Trading outside of your authorized active sessions is prohibited.",
      },
      {
        id: "day_of_week",
        label: "Prohibited Days (e.g. Friday Afternoon)",
        unit: "list",
        description: "Block execution on high-risk days (e.g., Sunday opens or late Fridays).",
        defaultOperator: "IN",
        allowedOperators: ["IN", "NOT_IN"],
        defaultThreshold: ["Saturday", "Sunday"],
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "MEDIUM",
        defaultMessage: "Trading on this day of week violates your trading plan rules.",
      },
    ],
  },
  Recovery: {
    category: "Recovery",
    ruleType: "RECOVERY",
    description: "Safety protocols activated during drawdown to downsize risk and regain psychological composure.",
    allowedConsequences: ["REDUCE_RISK", "LIMIT_TRADES", "COOLDOWN", "LOCK_ACCOUNT"],
    metrics: [
      {
        id: "recovery_drawdown_trigger",
        label: "Drawdown Trigger for Risk Cut (%)",
        unit: "%",
        description: "When drawdown exceeds this %, position sizing is forced to half normal risk.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 5.0,
        allowedScopes: ["ACCOUNT"],
        defaultScope: "ACCOUNT",
        defaultConsequence: "REDUCE_RISK",
        defaultSeverity: "HIGH",
        defaultMessage: "Account entered Recovery Mode: Cut risk in half until positive equity restored.",
      },
      {
        id: "recovery_loss_limit",
        label: "Tightened Daily Loss in Drawdown (%)",
        unit: "%",
        description: "Lowers allowable daily loss while in recovery to preserve remaining equity.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 2.0,
        allowedScopes: ["DAILY"],
        defaultScope: "DAILY",
        defaultConsequence: "LOCK_ACCOUNT",
        defaultSeverity: "CRITICAL",
        defaultMessage: "Recovery daily loss ceiling hit. Stopping trades to prevent catastrophic drift.",
      },
    ],
  },
  Discipline: {
    category: "Discipline",
    ruleType: "DISCIPLINE",
    description: "Enforces consequences for repeated rule infringements and process deviations.",
    allowedConsequences: ["COOLDOWN", "LOCK_ACCOUNT", "REQUIRE_REVIEW"],
    metrics: [
      {
        id: "violation_count",
        label: "Daily Violation Tolerance",
        unit: "count",
        description: "Locks account if more than N rule warnings/violations happen in a single day.",
        defaultOperator: ">=",
        allowedOperators: [">", ">="],
        defaultThreshold: 2,
        allowedScopes: ["DAILY"],
        defaultScope: "DAILY",
        defaultConsequence: "COOLDOWN",
        defaultSeverity: "HIGH",
        defaultMessage: "Multiple discipline infractions today. Enforcing cooling-off lockout.",
      },
      {
        id: "require_plan_review",
        label: "Require Trade Review Before Next Execution",
        unit: "boolean",
        description: "Prevents submitting a new trade until the previous closed trade has been audited.",
        defaultOperator: "==",
        allowedOperators: ["=="],
        defaultThreshold: true,
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "REQUIRE_REVIEW",
        defaultSeverity: "MEDIUM",
        defaultMessage: "You must review and tag your last closed trade before taking a new setup.",
      },
    ],
  },
  Checklist: {
    category: "Checklist",
    ruleType: "CHECKLIST",
    description: "Pre-flight confirmation of technical setup criteria and mental state.",
    allowedConsequences: ["WARN", "AUDIT_FAIL", "BLOCK_TRADE"],
    metrics: [
      {
        id: "has_stop_loss",
        label: "Hard Stop Loss Required",
        unit: "boolean",
        description: "Requires every order intent to have a predefined non-zero Stop Loss.",
        defaultOperator: "==",
        allowedOperators: ["==", "!="],
        defaultThreshold: true,
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "BLOCK_TRADE",
        defaultSeverity: "CRITICAL",
        defaultMessage: "Entering any trade without a defined Stop Loss is strictly prohibited.",
      },
      {
        id: "has_take_profit",
        label: "Pre-planned Target / Take Profit",
        unit: "boolean",
        description: "Requires a planned exit target before entry to avoid arbitrary exits.",
        defaultOperator: "==",
        allowedOperators: ["=="],
        defaultThreshold: true,
        allowedScopes: ["TRADE"],
        defaultScope: "TRADE",
        defaultConsequence: "WARN",
        defaultSeverity: "LOW",
        defaultMessage: "Trade intent has no target defined. Ensure you have an exit plan.",
      },
    ],
  },
};
