export type AccountType = "demo" | "live";
export type AccountStatus = "active" | "paused" | "passed" | "breached" | "archived";

export interface AccountMetrics {
  netPnl: number;
  netPnlPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  dailyLossUsedPercent: number;
  dailyLossRemaining: number;
  drawdownUsedPercent: number;
  drawdownRemaining: number;
  profitTargetProgressPercent: number;
  profitTargetRemaining: number;
}

export interface TradingAccount {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  startingBalance: number;
  currentBalance: number;
  currency: string;
  brokerName: string | null;
  accountNumber: string | null;
  status: AccountStatus;
  isDefault: boolean;
  notes: string | null;

  // Guardrails
  maxDailyLossPercent: number;
  maxDrawdownPercent: number;
  profitTargetPercent: number;
  riskPerTradePercent: number;
  maxTradesPerDay: number;

  createdAt: string;
  updatedAt: string;

  // Real-time or computed metrics
  metrics?: AccountMetrics;
}

export interface PortfolioSummary {
  totalEquity: number;
  totalStartingBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalAccounts: number;
  activeAccounts: number;
  liveAccounts: number;
  demoAccounts: number;
  currencies: string[];
  primaryCurrency: string;
}
