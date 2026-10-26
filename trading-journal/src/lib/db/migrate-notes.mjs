/**
 * Apply only the additive Trader Notes schema.
 * Run with: node --env-file=.env.local src/lib/db/migrate-notes.mjs
 */
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set");
}

const sql = neon(dbUrl);
const statements = [
  `CREATE TABLE IF NOT EXISTS note_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title VARCHAR(160) NOT NULL,
    emoji VARCHAR(32),
    cover_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS note_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES note_workspaces(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'Untitled',
    emoji VARCHAR(32),
    cover_image_url TEXT,
    content TEXT NOT NULL DEFAULT '',
    share_token UUID UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS note_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES note_documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    author_name VARCHAR(160) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS note_attachments (
    object_key TEXT PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES note_documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  "CREATE INDEX IF NOT EXISTS note_workspaces_user_updated_idx ON note_workspaces (user_id, updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS note_documents_workspace_updated_idx ON note_documents (workspace_id, updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS note_comments_document_created_idx ON note_comments (document_id, created_at ASC)",
  "CREATE INDEX IF NOT EXISTS note_attachments_document_idx ON note_attachments (document_id)",
];

console.log("Applying Trader Notes database schema...");
for (const statement of statements) await sql.query(statement);
console.log("Trader Notes database schema is ready.");
