-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo and live trading accounts with per-account risk guardrails.
CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  account_type VARCHAR(16) NOT NULL DEFAULT 'demo' CHECK (account_type IN ('demo', 'live')),
  starting_balance NUMERIC(18, 2) NOT NULL CHECK (starting_balance > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  -- Legacy currency values retained only for existing account records.
  max_daily_loss NUMERIC(18, 2) CHECK (max_daily_loss > 0),
  max_daily_loss_percent NUMERIC(5, 2) NOT NULL CHECK (max_daily_loss_percent > 0 AND max_daily_loss_percent <= 100),
  max_drawdown NUMERIC(18, 2) CHECK (max_drawdown > 0),
  max_drawdown_percent NUMERIC(5, 2) NOT NULL CHECK (max_drawdown_percent > 0 AND max_drawdown_percent <= 100),
  profit_target NUMERIC(18, 2) CHECK (profit_target > 0),
  profit_target_percent NUMERIC(6, 2) NOT NULL CHECK (profit_target_percent > 0 AND profit_target_percent <= 1000),
  max_trades_per_day INTEGER NOT NULL CHECK (max_trades_per_day > 0),
  -- Legacy currency value retained only for existing account records.
  risk_per_trade NUMERIC(18, 2) CHECK (risk_per_trade > 0),
  risk_per_trade_percent NUMERIC(5, 2) NOT NULL CHECK (risk_per_trade_percent > 0 AND risk_per_trade_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade existing installations without losing their current account limits.
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS max_drawdown NUMERIC(18, 2);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS profit_target NUMERIC(18, 2);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS risk_per_trade_percent NUMERIC(5, 2);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS max_daily_loss_percent NUMERIC(5, 2);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS max_drawdown_percent NUMERIC(5, 2);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS profit_target_percent NUMERIC(6, 2);
UPDATE trading_accounts
SET max_drawdown = COALESCE(max_drawdown, starting_balance),
    profit_target = COALESCE(profit_target, starting_balance),
    profit_target_percent = COALESCE(
      profit_target_percent,
      GREATEST(0.01, LEAST(1000, COALESCE(profit_target, starting_balance) / starting_balance * 100))
    ),
    max_daily_loss_percent = COALESCE(
      max_daily_loss_percent,
      GREATEST(0.01, LEAST(100, max_daily_loss / starting_balance * 100))
    ),
    max_drawdown_percent = COALESCE(
      max_drawdown_percent,
      GREATEST(0.01, LEAST(100, COALESCE(max_drawdown, starting_balance) / starting_balance * 100))
    ),
    risk_per_trade_percent = COALESCE(
      risk_per_trade_percent,
      GREATEST(0.01, LEAST(100, risk_per_trade / starting_balance * 100))
    )
WHERE max_drawdown IS NULL OR profit_target IS NULL OR profit_target_percent IS NULL OR max_daily_loss_percent IS NULL
   OR max_drawdown_percent IS NULL OR risk_per_trade_percent IS NULL;
ALTER TABLE trading_accounts ALTER COLUMN risk_per_trade_percent SET NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN max_daily_loss_percent SET NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN max_drawdown_percent SET NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN profit_target_percent SET NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN max_daily_loss DROP NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN max_drawdown DROP NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN risk_per_trade DROP NOT NULL;
ALTER TABLE trading_accounts ALTER COLUMN profit_target DROP NOT NULL;

CREATE INDEX IF NOT EXISTS trading_accounts_user_id_created_at_idx
  ON trading_accounts (user_id, created_at DESC);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8),
  quantity DECIMAL(18, 8) NOT NULL,
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  pnl DECIMAL(18, 8),
  pnl_percentage DECIMAL(10, 4),
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  strategy VARCHAR(100),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
