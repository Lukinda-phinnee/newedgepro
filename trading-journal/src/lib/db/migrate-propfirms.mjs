/**
 * Run with: node --env-file=.env.local src/lib/db/migrate-propfirms.mjs
 * Uses DATABASE_URL_UNPOOLED (direct connection) for DDL when available.
 */
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED;
if (!dbUrl) throw new Error("DATABASE_URL_UNPOOLED is required for database migrations");

const sql = neon(dbUrl);
await sql.query(`
  CREATE TABLE IF NOT EXISTS propfirms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    evaluation_type VARCHAR(24) NOT NULL CHECK (evaluation_type IN ('1-phase', '2-phase', '3-phase', 'Instant funding', 'Custom')),
    phases JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(phases) = 'array'),
    logo_data TEXT,
    tracker_data JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(tracker_data) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);
await sql.query("CREATE INDEX IF NOT EXISTS propfirms_user_created_idx ON propfirms (user_id, created_at DESC)");
await sql.query("ALTER TABLE propfirms ADD COLUMN IF NOT EXISTS tracker_data JSONB NOT NULL DEFAULT '{}'::jsonb");
console.log("Prop firm tracker database is ready.");
