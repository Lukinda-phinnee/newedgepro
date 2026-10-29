/** Apply additive schema for account profile preferences.
 * Run with: node --env-file=.env.local src/lib/db/migrate-profile.mjs
 */
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) throw new Error("Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set");

const sql = neon(dbUrl);
await sql.query(`CREATE TABLE IF NOT EXISTS user_profile_settings (
  user_id TEXT PRIMARY KEY,
  phone_number VARCHAR(32),
  phone_country_code VARCHAR(5) NOT NULL DEFAULT '+1',
  phone_region VARCHAR(2) NOT NULL DEFAULT 'US',
  timezone VARCHAR(80) NOT NULL DEFAULT 'Europe/Paris',
  time_format VARCHAR(4) NOT NULL DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  currency_display CHAR(3),
  theme VARCHAR(8) NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  avatar_data TEXT,
  pre_market_routine JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`);
await sql.query("ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(5) NOT NULL DEFAULT '+1'");
await sql.query("ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS phone_region VARCHAR(2) NOT NULL DEFAULT 'US'");
await sql.query("ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS theme VARCHAR(8) NOT NULL DEFAULT 'dark'");
await sql.query("ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS pre_market_routine JSONB");
console.log("Profile preferences schema is ready.");
