/** Apply additive schema for account profile preferences.
 * Run with: node --env-file=.env.local src/lib/db/migrate-profile.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

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
await sql.query(`CREATE TABLE IF NOT EXISTS app_information (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  version VARCHAR(40) NOT NULL,
  environment VARCHAR(32) NOT NULL DEFAULT 'production',
  support_email VARCHAR(255),
  website_url TEXT,
  privacy_url TEXT,
  terms_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`);
await sql.query(`INSERT INTO app_information (id, app_name, description, version)
  VALUES (1, 'EdgePro', 'Trading journal and performance workspace.', '1.0.0')
  ON CONFLICT (id) DO NOTHING`);
await sql.query("ALTER TABLE app_information ADD COLUMN IF NOT EXISTS environment VARCHAR(32) NOT NULL DEFAULT 'production'");
await sql.query("UPDATE app_information SET version = '1.0.0', environment = 'production' WHERE id = 1 AND version = '0.1.0'");
await sql.query(`CREATE TABLE IF NOT EXISTS legal_documents (
  slug VARCHAR(60) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  source_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`);

const legalDocuments = [
  ["terms-of-service", "Terms of Service", "https://docs.google.com/document/d/1IWwxDxjiMS2A6bIutaOWsrv6J2PAgZeA5OCm5IMHfCk", "terms-of-service.md"],
  ["privacy-policy", "Privacy Policy", "https://docs.google.com/document/d/1iVrG2qq6dcxMkTZe_0Ltkja8BQWX989lYn5QAfOgzc8", "privacy-policy.md"],
  ["risk-policy", "Risk Policy", "https://docs.google.com/document/d/1gIf0jbRPij0rA9BIN3-P3hb3AGaJugGAaCI1l2I90eo", "risk-policy.md"],
  ["cookie-policy", "Cookie Policy", "https://docs.google.com/document/d/1_1yyhhY0hQMRKUTc0TH6nCgjdVpAHzf6V5H4Wr_zNYs", "cookie-policy.md"],
];
for (const [slug, title, sourceUrl, fileName] of legalDocuments) {
  const body = readFileSync(new URL(`../../content/legal/${fileName}`, import.meta.url), "utf8");
  await sql.query("INSERT INTO legal_documents (slug, title, body, source_url) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING", [slug, title, body, sourceUrl]);
}
console.log("Profile, app information, and legal document schema are ready.");
