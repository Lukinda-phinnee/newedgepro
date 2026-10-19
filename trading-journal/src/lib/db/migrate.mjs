/**
 * Run with: node --env-file=.env.local src/lib/db/migrate.mjs
 * Uses DATABASE_URL_UNPOOLED (direct connection) as required for DDL migrations.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = neon(process.env.DATABASE_URL_UNPOOLED);
const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

// Split on statement boundaries and run each non-empty statement
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log("Running database schema migrations...");
for (const stmt of statements) {
  await sql.query(stmt);
}
console.log("✓ Schema migration complete");

