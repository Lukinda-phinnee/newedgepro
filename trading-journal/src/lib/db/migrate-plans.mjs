/**
 * Apply the additive Trading Plans schema.
 * Run with: node --env-file=.env.local src/lib/db/migrate-plans.mjs
 */
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set");
}

const sql = neon(dbUrl);
const statements = [
  `CREATE TABLE IF NOT EXISTS trading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'Untitled Plan',
    session_tag VARCHAR(50) DEFAULT 'NY AM',
    summary TEXT DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS trading_plans_user_updated_idx ON trading_plans (user_id, updated_at DESC)",
];

console.log("Applying trading plans migration...");
for (const statement of statements) {
  await sql.query(statement);
}
console.log("Trading plans schema applied successfully.");
