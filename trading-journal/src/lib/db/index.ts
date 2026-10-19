import { neon } from "@neondatabase/serverless";

// Use pooled DATABASE_URL for serverless/edge (web app queries)
// Use DATABASE_URL_UNPOOLED for migrations only
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);
