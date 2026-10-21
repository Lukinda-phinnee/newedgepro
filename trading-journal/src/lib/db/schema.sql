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
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS current_balance NUMERIC(18, 2);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS broker_name VARCHAR(100);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS notes TEXT;
UPDATE trading_accounts
SET current_balance = COALESCE(current_balance, starting_balance);
UPDATE trading_accounts
SET is_default = true
WHERE id IN (SELECT id FROM trading_accounts ORDER BY created_at ASC LIMIT 1);
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
  user_id TEXT NOT NULL,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8),
  quantity DECIMAL(18, 8) NOT NULL,
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  pnl DECIMAL(18, 8),
  pnl_percentage DECIMAL(10, 4),
  status VARCHAR(10) NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  strategy VARCHAR(100),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_session VARCHAR(30);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_condition VARCHAR(30);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS confidence SMALLINT CHECK (confidence IS NULL OR (confidence >= 1 AND confidence <= 5));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_entry DECIMAL(18, 8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'unreviewed';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS execution_grade VARCHAR(10);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS review_rating SMALLINT CHECK (review_rating IS NULL OR (review_rating >= 1 AND review_rating <= 5));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS followed_rules VARCHAR(20) DEFAULT 'yes';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS mistake_tags TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS what_went_well TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS what_to_improve TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS lessons_learned TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshots TEXT;
CREATE INDEX IF NOT EXISTS trades_user_id_account_id_idx ON trades (user_id, account_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS trades_user_review_status_idx ON trades (user_id, review_status, opened_at DESC);

-- ==========================================
-- RULE ENGINE: Sets, Rules & Violations
-- ==========================================

-- Rule sets belong to a user, optionally linked to an account (NULL means System / Global Default)
CREATE TABLE IF NOT EXISTS rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'System Default Rules',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rule_sets_user_id_idx ON rule_sets (user_id, is_active);
CREATE INDEX IF NOT EXISTS rule_sets_account_id_idx ON rule_sets (account_id, is_active);

-- Rules configured within a rule set
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id UUID NOT NULL REFERENCES rule_sets(id) ON DELETE CASCADE,
  rule_name VARCHAR(120) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL,
  rule_category VARCHAR(50) NOT NULL,
  condition VARCHAR(80) NOT NULL,
  comparison_operator VARCHAR(20) NOT NULL,
  threshold_value JSONB NOT NULL,
  evaluation_scope VARCHAR(30) NOT NULL DEFAULT 'TRADE',
  time_window VARCHAR(30),
  filters JSONB DEFAULT '{}'::jsonb,
  severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
  consequence VARCHAR(40) NOT NULL DEFAULT 'BLOCK_TRADE',
  consequence_params JSONB DEFAULT '{}'::jsonb,
  consequence_duration INTEGER,
  exit_condition TEXT,
  user_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rules_rule_set_id_idx ON rules (rule_set_id, is_active);
CREATE INDEX IF NOT EXISTS rules_category_idx ON rules (rule_category, is_active);

-- Violation logs recorded from pre/post trade evaluation or simulations
CREATE TABLE IF NOT EXISTS rule_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  violation_name VARCHAR(150) NOT NULL,
  rule_type VARCHAR(50),
  severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  action_taken VARCHAR(50) NOT NULL DEFAULT 'WARN',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rule_violations_user_id_idx ON rule_violations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rule_violations_account_id_idx ON rule_violations (account_id, created_at DESC);

-- Trading accounts link to current rule set and safety enforcement states
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS current_rule_set_id UUID REFERENCES rule_sets(id) ON DELETE SET NULL;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMPTZ;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

