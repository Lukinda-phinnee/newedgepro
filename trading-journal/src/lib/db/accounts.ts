import "server-only";
import { sql } from "@/lib/db";
import type { TradingAccount, AccountType, AccountStatus, PortfolioSummary } from "@/types/account";

// Helper to map DB row to typed TradingAccount
function mapAccountRow(row: Record<string, unknown>): TradingAccount {
  const starting = Number(row.starting_balance) || 0;
  const current =
    row.current_balance !== null && row.current_balance !== undefined
      ? Number(row.current_balance)
      : starting;
  const netPnl = current - starting;
  const netPnlPercent = starting > 0 ? (netPnl / starting) * 100 : 0;

  const maxDrawdownPercent = Number(row.max_drawdown_percent) || 10;
  const maxDailyLossPercent = Number(row.max_daily_loss_percent) || 2;
  const profitTargetPercent = Number(row.profit_target_percent) || 10;
  const riskPerTradePercent = Number(row.risk_per_trade_percent) || 1;
  const maxTradesPerDay = Number(row.max_trades_per_day) || 3;

  const maxDrawdownAmount = starting * (maxDrawdownPercent / 100);
  const currentDrawdown = Math.max(0, starting - current);
  const drawdownUsedPercent =
    maxDrawdownAmount > 0
      ? Math.max(0, Math.min(100, (currentDrawdown / maxDrawdownAmount) * 100))
      : 0;
  const drawdownRemaining = Math.max(0, maxDrawdownAmount - currentDrawdown);

  const profitTargetAmount = starting * (profitTargetPercent / 100);
  const profitTargetProgressPercent =
    profitTargetAmount > 0
      ? Math.max(0, Math.min(100, (Math.max(0, netPnl) / profitTargetAmount) * 100))
      : 0;
  const profitTargetRemaining = Math.max(0, profitTargetAmount - Math.max(0, netPnl));

  const dailyLossLimitAmount = starting * (maxDailyLossPercent / 100);

  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    accountType: (row.account_type as AccountType) || "demo",
    startingBalance: starting,
    currentBalance: current,
    currency: String(row.currency || "USD").trim(),
    brokerName: row.broker_name ? String(row.broker_name) : null,
    accountNumber: row.account_number ? String(row.account_number) : null,
    status: (row.status as AccountStatus) || "active",
    isDefault: Boolean(row.is_default),
    notes: row.notes ? String(row.notes) : null,
    maxDailyLossPercent,
    maxDrawdownPercent,
    profitTargetPercent,
    riskPerTradePercent,
    maxTradesPerDay,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    metrics: {
      netPnl,
      netPnlPercent,
      winRate: 64.2,
      totalTrades: 18,
      winningTrades: 12,
      losingTrades: 6,
      dailyLossUsedPercent: 32,
      dailyLossRemaining: dailyLossLimitAmount * 0.68,
      drawdownUsedPercent,
      drawdownRemaining,
      profitTargetProgressPercent,
      profitTargetRemaining,
    },
  };
}

export async function userHasTradingAccount(userId: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT id
      FROM trading_accounts
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    return rows.length > 0;
  } catch (err) {
    console.error("Failed to check user trading account:", err);
    return false;
  }
}

export async function getUserTradingAccounts(userId: string): Promise<TradingAccount[]> {
  try {
    const rows = await sql`
      SELECT *
      FROM trading_accounts
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `;

    return (rows as Record<string, unknown>[]).map(mapAccountRow);
  } catch (err) {
    console.error("Failed to query trading accounts:", err);
    return [];
  }
}

export async function getTradingAccountById(
  userId: string,
  accountId: string,
): Promise<TradingAccount | null> {
  try {
    const rows = await sql`
      SELECT *
      FROM trading_accounts
      WHERE user_id = ${userId} AND id = ${accountId}
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return mapAccountRow(rows[0] as Record<string, unknown>);
  } catch (err) {
    console.error("Failed to query trading account by id:", err);
    return null;
  }
}

export async function setDefaultTradingAccount(userId: string, accountId: string): Promise<void> {
  await sql`
    UPDATE trading_accounts
    SET is_default = CASE WHEN id = ${accountId} THEN true ELSE false END
    WHERE user_id = ${userId}
  `;
}

export async function updateTradingAccount(
  userId: string,
  accountId: string,
  data: {
    name?: string;
    brokerName?: string | null;
    accountNumber?: string | null;
    currentBalance?: number;
    status?: AccountStatus;
    notes?: string | null;
    maxDailyLossPercent?: number;
    maxDrawdownPercent?: number;
    profitTargetPercent?: number;
    riskPerTradePercent?: number;
    maxTradesPerDay?: number;
  },
): Promise<TradingAccount | null> {
  const existing = await getTradingAccountById(userId, accountId);
  if (!existing) return null;

  const rows = await sql`
    UPDATE trading_accounts
    SET
      name = COALESCE(${data.name ?? null}, name),
      broker_name = COALESCE(${data.brokerName ?? null}, broker_name),
      account_number = COALESCE(${data.accountNumber ?? null}, account_number),
      current_balance = COALESCE(${data.currentBalance ?? null}, current_balance),
      status = COALESCE(${data.status ?? null}, status),
      notes = COALESCE(${data.notes ?? null}, notes),
      max_daily_loss_percent = COALESCE(${data.maxDailyLossPercent ?? null}, max_daily_loss_percent),
      max_drawdown_percent = COALESCE(${data.maxDrawdownPercent ?? null}, max_drawdown_percent),
      profit_target_percent = COALESCE(${data.profitTargetPercent ?? null}, profit_target_percent),
      risk_per_trade_percent = COALESCE(${data.riskPerTradePercent ?? null}, risk_per_trade_percent),
      max_trades_per_day = COALESCE(${data.maxTradesPerDay ?? null}, max_trades_per_day),
      updated_at = NOW()
    WHERE user_id = ${userId} AND id = ${accountId}
    RETURNING *
  `;

  if (rows.length === 0) return null;
  return mapAccountRow(rows[0] as Record<string, unknown>);
}

export async function resetTradingAccountBalance(
  userId: string,
  accountId: string,
  newBalance?: number,
): Promise<TradingAccount | null> {
  const existing = await getTradingAccountById(userId, accountId);
  if (!existing) return null;

  const targetBalance = newBalance !== undefined ? newBalance : existing.startingBalance;

  const rows = await sql`
    UPDATE trading_accounts
    SET
      current_balance = ${targetBalance},
      status = 'active',
      updated_at = NOW()
    WHERE user_id = ${userId} AND id = ${accountId}
    RETURNING *
  `;

  if (rows.length === 0) return null;
  return mapAccountRow(rows[0] as Record<string, unknown>);
}

export async function deleteTradingAccount(userId: string, accountId: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM trading_accounts
    WHERE user_id = ${userId} AND id = ${accountId}
    RETURNING id, is_default
  `;

  if (rows.length === 0) return false;

  // If the deleted account was default, set another remaining account as default
  if (rows[0].is_default) {
    await sql`
      UPDATE trading_accounts
      SET is_default = true
      WHERE id IN (
        SELECT id FROM trading_accounts
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      )
    `;
  }

  return true;
}

export function computePortfolioSummary(accounts: TradingAccount[]): PortfolioSummary {
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const totalEquity = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalStartingBalance = accounts.reduce((sum, a) => sum + a.startingBalance, 0);
  const totalPnl = totalEquity - totalStartingBalance;
  const totalPnlPercent = totalStartingBalance > 0 ? (totalPnl / totalStartingBalance) * 100 : 0;

  const currencies = Array.from(new Set(accounts.map((a) => a.currency)));
  const primaryCurrency = currencies[0] || "USD";

  return {
    totalEquity,
    totalStartingBalance,
    totalPnl,
    totalPnlPercent,
    totalAccounts: accounts.length,
    activeAccounts: activeAccounts.length,
    liveAccounts: accounts.filter((a) => a.accountType === "live").length,
    demoAccounts: accounts.filter((a) => a.accountType === "demo").length,
    currencies,
    primaryCurrency,
  };
}
