/**
 * Migration for AI Plan Copilot chat sessions and messages.
 * Run with: node --env-file=.env.local src/lib/db/migrate-chat.mjs
 */
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set");
}

const sql = neon(dbUrl);
const statements = [
  `CREATE TABLE IF NOT EXISTS plan_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    plan_id UUID REFERENCES trading_plans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS plan_chat_sessions_user_idx ON plan_chat_sessions (user_id, updated_at DESC)",
  `CREATE TABLE IF NOT EXISTS plan_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES plan_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_plan_id UUID REFERENCES trading_plans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS plan_chat_messages_session_idx ON plan_chat_messages (session_id, created_at ASC)",
];

console.log("Applying AI Plan Copilot chat tables migration...");
for (const statement of statements) {
  await sql.query(statement);
}
console.log("AI Plan Copilot chat tables migration applied successfully.");

