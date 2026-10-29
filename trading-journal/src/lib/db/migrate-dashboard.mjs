/**
 * Apply additive schema needed by persisted demo trades and Rule Engine metrics.
 * Run with: node --env-file=.env.local src/lib/db/migrate-dashboard.mjs
 * Uses DATABASE_URL_UNPOOLED (direct connection) for DDL when available.
 */
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set");
}

const sql = neon(dbUrl);
const statements = [
  "ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS demo_data_seeded_at TIMESTAMPTZ",
  "ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false",
  "ALTER TABLE trades ALTER COLUMN side TYPE VARCHAR(5)",
  // Neon Auth owns app identities; the legacy local users table is not the
  // source of truth and can be empty for valid authenticated account owners.
  "ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey",
  "ALTER TABLE trades ALTER COLUMN user_id TYPE TEXT USING user_id::text",
  // Older installations may predate these trade-review fields even though
  // fixture inserts and review editing rely on them.
  "ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_management TEXT",
  "ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot_titles TEXT",
  "ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_confluences TEXT",
  "ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_emotion VARCHAR(60)",
  "ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_emotion VARCHAR(60)",
  `CREATE TABLE IF NOT EXISTS rule_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
    verdict VARCHAR(10) NOT NULL CHECK (verdict IN ('ACCEPT', 'WARN', 'BLOCK')),
    violation_count INTEGER NOT NULL DEFAULT 0 CHECK (violation_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS rule_simulations_user_created_idx ON rule_simulations (user_id, created_at DESC)",
  "CREATE INDEX IF NOT EXISTS rule_simulations_account_created_idx ON rule_simulations (account_id, created_at DESC)",
];

console.log("Applying additive dashboard schema...");
for (const statement of statements) await sql.query(statement);
console.log("Dashboard schema is ready.");
