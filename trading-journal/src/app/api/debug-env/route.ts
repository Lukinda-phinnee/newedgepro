import { NextResponse } from "next/server";

// Temporary diagnostic route — remove after confirming env vars work in production.
// Visit /api/debug-env from your deployed app to check variable availability.
export async function GET() {
  const checks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: !!process.env.DATABASE_URL_UNPOOLED,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL
      ? `SET (${process.env.NEON_AUTH_BASE_URL.slice(0, 40)}...)`
      : "MISSING ❌",
    NEON_AUTH_JWKS_URL: !!process.env.NEON_AUTH_JWKS_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET
      ? `SET (length: ${process.env.NEON_AUTH_COOKIE_SECRET.length})`
      : "MISSING ❌",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "MISSING ❌",
    STORAGE_ACCESS_KEY_ID: !!process.env.STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY: !!process.env.STORAGE_SECRET_ACCESS_KEY,
    STORAGE_REGION: process.env.STORAGE_REGION || "MISSING ❌",
    STORAGE_BUCKET: process.env.STORAGE_BUCKET || "MISSING ❌",
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(checks);
}

